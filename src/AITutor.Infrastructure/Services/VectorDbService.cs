using System.Linq;
using System.Collections.Generic;
using AITutor.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel.Embeddings;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using Condition = Qdrant.Client.Grpc.Condition;

namespace AITutor.Infrastructure.Services;

public class VectorDbService : IVectorDbService
{
    private readonly QdrantClient _client;
    private readonly ITextEmbeddingGenerationService _embeddingService;
    private readonly IConfiguration _config;

    public VectorDbService(ITextEmbeddingGenerationService embeddingService, IConfiguration config)
    {
        _embeddingService = embeddingService;
        _config = config;
        var qdrantConfig = _config.GetSection("Qdrant");
        _client = new QdrantClient(qdrantConfig["Host"] ?? "localhost", int.Parse(qdrantConfig["Port"] ?? "6334"));
    }

    public async Task EnsureCollectionExistsAsync(string collectionName)
    {
        var collections = await _client.ListCollectionsAsync();
        if (!collections.Contains(collectionName))
        {
            // Get configuration from AI:Embedding to decide vector size
            var embedConfig = _config.GetSection("AI:Embedding");
            var provider = embedConfig["Provider"];
            
            // OpenAI text-embedding-3-small uses 1536 dims
            // Gemini / Ollama (nomic-embed-text) uses 768 dims
            uint dims = (provider == "Gemini" || provider == "Ollama") ? 768u : 1536u;
            
            await _client.CreateCollectionAsync(collectionName, new VectorParams { Size = dims, Distance = Distance.Cosine });
        }
    }

    public async Task UpsertAsync(string collectionName, string id, string text, Dictionary<string, string> metadata)
    {
        var vector = await _embeddingService.GenerateEmbeddingAsync(text);
        
        var point = new PointStruct
        {
            Id = Guid.Parse(id),
            Vectors = vector.ToArray()
        };

        foreach (var m in metadata)
        {
            point.Payload.Add(m.Key, m.Value);
        }
        point.Payload.Add("text", text);

        await _client.UpsertAsync(collectionName, new[] { point });
    }

    public async Task<IEnumerable<VectorSearchResult>> SearchAsync(string collectionName, string queryText, int topK = 3)
    {
        var vector = await _embeddingService.GenerateEmbeddingAsync(queryText);
        
        var results = await _client.SearchAsync(collectionName, vector.ToArray(), limit: (ulong)topK);

        return results.Select(r => new VectorSearchResult(
            ChunkText: r.Payload["text"].StringValue,
            DocumentId: r.Payload.ContainsKey("DocumentId") ? r.Payload["DocumentId"].StringValue : "",
            Topic: r.Payload.ContainsKey("Topic") ? r.Payload["Topic"].StringValue : "",
            Difficulty: r.Payload.ContainsKey("Difficulty") ? r.Payload["Difficulty"].StringValue : "",
            Type: r.Payload.ContainsKey("Type") ? r.Payload["Type"].StringValue : "",
            Score: r.Score
        ));
    }

    public async Task DeleteByDocumentIdAsync(string collectionName, string documentId)
    {
        await _client.DeleteAsync(collectionName, new Filter
        {
            Must = { new Condition { Field = new FieldCondition { Key = "DocumentId", Match = new Match { Text = documentId } } } }
        });
    }

    public async Task<IEnumerable<string>> GetContentByDocumentIdAsync(string collectionName, string documentId)
    {
        var points = await _client.ScrollAsync(collectionName, new Filter
        {
            Must = { new Condition { Field = new FieldCondition { Key = "DocumentId", Match = new Match { Text = documentId } } } }
        });

        return points.Result.Select(p => p.Payload["text"].StringValue);
    }
}
