namespace AITutor.Application.Interfaces.Services;

public record VectorSearchResult(
    string ChunkText,
    string DocumentId,
    string Topic,
    string Difficulty,
    string Type,
    float Score
);

public interface IVectorDbService
{
    Task UpsertAsync(string collectionName, string id, string text, Dictionary<string, string> metadata);
    Task<IEnumerable<VectorSearchResult>> SearchAsync(string collectionName, string queryText, int topK = 3);
    Task EnsureCollectionExistsAsync(string collectionName);
    Task DeleteByDocumentIdAsync(string collectionName, string documentId);
    Task<IEnumerable<string>> GetContentByDocumentIdAsync(string collectionName, string documentId);
}
