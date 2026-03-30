namespace AITutor.Application.Interfaces.Services;

public interface IDocumentProcessingService
{
    /// <summary>Trích xuất text từ file PDF và chia nhỏ thành chunks.</summary>
    Task<IEnumerable<string>> ExtractAndChunkAsync(Stream fileStream, int chunkSize = 800, int overlap = 100);
}
