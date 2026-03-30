namespace AITutor.Application.Interfaces.Services;

public interface ITutorAgentService
{
    /// <summary>
    /// Gọi LLM với Socratic System Prompt + context từ RAG + lịch sử chat.
    /// Trả về chuỗi stream qua IAsyncEnumerable để đẩy thời gian thực qua SignalR.
    /// </summary>
    IAsyncEnumerable<string> StreamResponseAsync(
        Guid userId,
        Guid sessionId,
        string userMessage,
        string weakPoints,
        CancellationToken cancellationToken = default
    );
}
