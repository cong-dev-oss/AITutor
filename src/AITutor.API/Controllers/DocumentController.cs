using AITutor.Application.Interfaces.Repositories;
using AITutor.Application.Interfaces.Services;
using AITutor.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AITutor.API.Controllers;

[Authorize]
[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentRepository _docRepo;
    private readonly IDocumentProcessingService _docProc;
    private readonly IVectorDbService _vectorDb;

    public DocumentController(IDocumentRepository docRepo, IDocumentProcessingService docProc, IVectorDbService vectorDb)
    {
        _docRepo = docRepo;
        _docProc = docProc;
        _vectorDb = vectorDb;
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
        var chunks = await _docProc.ExtractAndChunkAsync(stream);
        
        await _vectorDb.EnsureCollectionExistsAsync("Knowledge_Base");
        
        foreach (var chunk in chunks)
        {
            var metadata = new Dictionary<string, string>
            {
                { "DocumentId", doc.Id.ToString() },
                { "Topic", topic },
                { "Difficulty", difficulty },
                { "Type", "Custom" }
            };
            await _vectorDb.UpsertAsync("Knowledge_Base", Guid.NewGuid().ToString(), chunk, metadata);
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
}
