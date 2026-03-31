using AITutor.Application.Interfaces.Repositories;
using AITutor.Application.Interfaces.Services;
using AITutor.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Runtime.CompilerServices;
using System.Text;

namespace AITutor.Infrastructure.Services;

public class TutorAgentService : ITutorAgentService
{
    private readonly Kernel _kernel;
    private readonly IVectorDbService _vectorDb;
    private readonly IChatSessionRepository _chatRepo;
    private readonly IChatCompletionService _chatCompletion;

    public TutorAgentService(
        Kernel kernel,
        IVectorDbService vectorDb,
        IChatSessionRepository chatRepo,
        IChatCompletionService chatCompletion)
    {
        _kernel = kernel;
        _vectorDb = vectorDb;
        _chatRepo = chatRepo;
        _chatCompletion = chatCompletion;
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(
        Guid userId,
        Guid sessionId,
        string userMessage,
        string weakPoints,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        // 1. RAG: Search for relevant knowledge
        await _vectorDb.EnsureCollectionExistsAsync("Knowledge_Base_Ollama");
        var searchResults = await _vectorDb.SearchAsync("Knowledge_Base_Ollama", userMessage, topK: 3);
        var contextBuilder = new StringBuilder();
        foreach (var res in searchResults)
        {
            contextBuilder.AppendLine($"--- Source (Topic: {res.Topic}) ---\n{res.ChunkText}\n");
        }

        // 2. Build History from DB
        var history = new ChatHistory();
        
        // System Prompt: Socratic Method
        var systemPrompt = $"""
            Bạn là một AI Tutor chuyên nghiệp, dạy tiếng Anh theo phương pháp Socratic (Giảng dạy gợi mở).
            
            QUY TẮC:
            1. Đừng đưa câu trả lời ngay lập tức. Hãy đặt câu hỏi gợi mở để người học tự tìm ra vấn đề.
            2. Sử dụng thông tin từ 'KIẾN THỨC CUNG CẤP' để giải thích.
            3. Đưa ra tối đa 2 ví dụ thực tế liên quan đến cuộc sống/công việc.
            4. Nếu người học có 'ĐIỂM YẾU', hãy cố gắng lồng ghép vào câu hỏi hoặc ví dụ để ôn tập.
            
            KIẾN THỨC CUNG CẤP:
            {contextBuilder}
            
            ĐIỂM YẾU CỦA NGƯỜI HỌC:
            {weakPoints}
            """;
        
        history.AddSystemMessage(systemPrompt);

        var dbMessages = await _chatRepo.GetRecentMessagesAsync(sessionId, 10);
        foreach (var msg in dbMessages)
        {
            if (msg.Role == "user") history.AddUserMessage(msg.Content);
            else history.AddAssistantMessage(msg.Content);
        }

        history.AddUserMessage(userMessage);

        // 3. Save User Message to DB
        await _chatRepo.AddMessageAsync(new ChatMessage
        {
            SessionId = sessionId,
            Role = "user",
            Content = userMessage
        });
        await _chatRepo.SaveChangesAsync();

        // 4. Stream Response
        var fullAssistantResponse = new StringBuilder();
        var streamResults = _chatCompletion.GetStreamingChatMessageContentsAsync(history, cancellationToken: cancellationToken);

        await foreach (var content in streamResults)
        {
            if (content.Content != null)
            {
                fullAssistantResponse.Append(content.Content);
                yield return content.Content;
            }
        }

        // 5. Save Assistant Message to DB
        await _chatRepo.AddMessageAsync(new ChatMessage
        {
            SessionId = sessionId,
            Role = "assistant",
            Content = fullAssistantResponse.ToString()
        });
        await _chatRepo.SaveChangesAsync();
    }
}
