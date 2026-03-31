using AITutor.Application.Interfaces.Repositories;
using AITutor.Application.Interfaces.Services;
using AITutor.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HtmlAgilityPack;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.SignalR;
using AITutor.API.Hubs;

namespace AITutor.API.Controllers;

[Authorize]
[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentRepository _docRepo;
    private readonly IDocumentProcessingService _docProc;
    private readonly IVectorDbService _vectorDb;
    private readonly ILogger<DocumentController> _logger;
    private readonly IHubContext<ChatHub> _hubContext;

    public DocumentController(IDocumentRepository docRepo, 
                              IDocumentProcessingService docProc, 
                              IVectorDbService vectorDb,
                              ILogger<DocumentController> logger,
                              IHubContext<ChatHub> hubContext)
    {
        _docRepo = docRepo;
        _docProc = docProc;
        _vectorDb = vectorDb;
        _logger = logger;
        _hubContext = hubContext;
    }

    private HttpClient CreateHttpClient()
    {
        var handler = new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate
        };
        var client = new HttpClient(handler);
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9,vi;q=0.8");
        return client;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string topic, [FromForm] string difficulty)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty");

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        // 1. Save to DB
        var doc = new Document
        {
            UserId = userId,
            FileName = file.FileName,
            Topic = topic,
            Difficulty = difficulty,
            Type = "Custom"
        };
        await _docRepo.AddAsync(doc);
        await _docRepo.SaveChangesAsync();

        // 2. Process RAG (Chunk & Embed)
        using var stream = file.OpenReadStream();
        var chunks = (await _docProc.ExtractAndChunkAsync(stream)).ToList();
        
        await _vectorDb.EnsureCollectionExistsAsync("Knowledge_Base_Ollama");
        
        for (int i = 0; i < chunks.Count; i++)
        {
            var metadata = new Dictionary<string, string>
            {
                { "DocumentId", doc.Id.ToString() },
                { "Topic", topic },
                { "Difficulty", difficulty },
                { "Type", "Custom" }
            };
            await _vectorDb.UpsertAsync("Knowledge_Base_Ollama", Guid.NewGuid().ToString(), chunks[i], metadata);
            
            // Report progress via SignalR
            var percentage = (int)((i + 1.0) / chunks.Count * 100);
            await _hubContext.Clients.User(userId.ToString()).SendAsync("UploadProgress", doc.Id, percentage);
        }

        doc.IsProcessed = true;
        await _docRepo.UpdateAsync(doc);
        await _docRepo.SaveChangesAsync();

        return Ok(new { message = "Upload and processing complete", documentId = doc.Id });
    }

    [HttpGet]
    public async Task<IActionResult> GetUserDocuments()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var docs = await _docRepo.GetByUserIdAsync(userId);
        return Ok(docs);
    }

    [HttpGet("preview-url")]
    public async Task<IActionResult> PreviewUrl([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return BadRequest("Url is required");
        _logger.LogInformation("Attempting to preview URL: {Url}", url);
        
        try
        {
            using var client = CreateHttpClient();
            var html = await client.GetStringAsync(url);
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var title = doc.DocumentNode.SelectSingleNode("//title")?.InnerText?.Trim() ?? string.Empty;
            var descriptionNode = doc.DocumentNode.SelectSingleNode("//meta[@name='description']") ?? 
                                  doc.DocumentNode.SelectSingleNode("//meta[@property='og:description']");
            var description = descriptionNode?.GetAttributeValue("content", string.Empty) ?? string.Empty;

            var imageNode = doc.DocumentNode.SelectSingleNode("//meta[@property='og:image']");
            var image = imageNode?.GetAttributeValue("content", string.Empty) ?? string.Empty;

            return Ok(new { title, description, image, url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to preview URL: {Url}", url);
            return BadRequest(new { error = "Cannot fetch URL metadata", details = ex.Message });
        }
    }

    [HttpPost("url")]
    public async Task<IActionResult> UploadUrl([FromBody] UrlUploadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url)) return BadRequest("Url is required");
        if (string.IsNullOrWhiteSpace(request.Topic)) return BadRequest("Topic is required");

        _logger.LogInformation("Processing URL Upload: {Url}, Topic: {Topic}", request.Url, request.Topic);

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        try
        {
            using var client = CreateHttpClient();
            var html = await client.GetStringAsync(request.Url);
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Remove scripts and styles
            doc.DocumentNode.Descendants()
                .Where(n => n.Name == "script" || n.Name == "style")
                .ToList()
                .ForEach(n => n.Remove());

            var textContent = doc.DocumentNode.InnerText;
            // Decode HTML entities and normalize spaces
            textContent = System.Net.WebUtility.HtmlDecode(textContent);
            textContent = Regex.Replace(textContent, @"\s+", " ").Trim();

            if (string.IsNullOrWhiteSpace(textContent)) return BadRequest("Could not extract any text from URL");

            var title = doc.DocumentNode.SelectSingleNode("//title")?.InnerText?.Trim() ?? "Web Article";

            // 1. Save to DB
            var dbDoc = new Document
            {
                UserId = userId,
                FileName = title, // Use title as File Name
                Topic = request.Topic,
                Difficulty = request.Difficulty,
                Type = "URL"
            };
            await _docRepo.AddAsync(dbDoc);
            await _docRepo.SaveChangesAsync();

            // 2. Process RAG (Chunk & Embed)
            var chunks = (await _docProc.ExtractAndChunkTextAsync(textContent)).ToList();
            
            await _vectorDb.EnsureCollectionExistsAsync("Knowledge_Base_Ollama");
            
            for (int i = 0; i < chunks.Count; i++)
            {
                var metadata = new Dictionary<string, string>
                {
                    { "DocumentId", dbDoc.Id.ToString() },
                    { "Topic", request.Topic },
                    { "Difficulty", request.Difficulty },
                    { "Type", "URL" },
                    { "SourceUrl", request.Url }
                };
                await _vectorDb.UpsertAsync("Knowledge_Base_Ollama", Guid.NewGuid().ToString(), chunks[i], metadata);
                
                // Report progress
                var percentage = (int)((i + 1.0) / chunks.Count * 100);
                await _hubContext.Clients.User(userId.ToString()).SendAsync("UploadProgress", dbDoc.Id, percentage);
            }

            dbDoc.IsProcessed = true;
            await _docRepo.UpdateAsync(dbDoc);
            await _docRepo.SaveChangesAsync();

            _logger.LogInformation("Successfully processed URL: {Url}. DocId: {Id}", request.Url, dbDoc.Id);
            return Ok(new { message = "URL processed successfully", documentId = dbDoc.Id });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP Error fetching URL: {Url}", request.Url);
            return BadRequest(new { error = "Cannot fetch URL", details = $"Status: {ex.StatusCode}. Message: {ex.Message}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "General Error processing URL: {Url}", request.Url);
            return BadRequest(new { error = "Cannot process URL", details = ex.Message });
        }
    }

    [HttpGet("{id}/content")]
    public async Task<IActionResult> GetDocumentContent(Guid id)
    {
        var content = await _vectorDb.GetContentByDocumentIdAsync("Knowledge_Base_Ollama", id.ToString());
        return Ok(new { content = string.Join("\n\n", content) });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var doc = await _docRepo.GetByIdAsync(id);
        
        if (doc == null || doc.UserId != userId) return NotFound();

        // 1. Delete from Vector DB
        await _vectorDb.DeleteByDocumentIdAsync("Knowledge_Base_Ollama", id.ToString());

        // 2. Delete from relational DB
        await _docRepo.DeleteAsync(doc);
        await _docRepo.SaveChangesAsync();

        return Ok(new { message = "Document and associated data deleted successfully" });
    }
}

public class UrlUploadRequest
{
    public string Url { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Beginner";
}
