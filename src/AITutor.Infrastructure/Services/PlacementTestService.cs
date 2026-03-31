using AITutor.Application.Interfaces.Services;
using AITutor.Application.DTOs;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text.Json;

namespace AITutor.Infrastructure.Services;

public class PlacementTestService
{
    private readonly IVectorDbService _vectorDb;
    private readonly IChatCompletionService _chatCompletion;

    public PlacementTestService(IVectorDbService vectorDb, IChatCompletionService chatCompletion)
    {
        _vectorDb = vectorDb;
        _chatCompletion = chatCompletion;
    }

    public async Task<List<QuestionDto>> GenerateTestAsync(string topic = "General English")
    {
        // 1. Get random context from Vector DB (if any)
        await _vectorDb.EnsureCollectionExistsAsync("Knowledge_Base_Ollama");
        var contextResults = await _vectorDb.SearchAsync("Knowledge_Base_Ollama", topic, topK: 5);
        var context = string.Join("\n", contextResults.Select(r => r.ChunkText));

        // 2. Prompt LLM to generate 5 multiple choice questions
        var prompt = $$"""
            Dựa trên kiến thức sau (hoặc kiến thức chung nếu không có):
            {{context}}

            Hãy tạo 5 câu hỏi trắc nghiệm tiếng Anh để đánh giá trình độ (A1-C1). 
            Trả về định dạng JSON duy nhất là một mảng các đối tượng (TẤT CẢ TÊN THUỘC TÍNH PHẢI VIẾT THƯỜNG):
            [
              {
                "question": "...",
                "options": ["A", "B", "C", "D"],
                "correctIndex": 0,
                "explanation": "..."
              }
            ]
            Chỉ trả về JSON, không thêm văn bản khác.
            """;

        var response = await _chatCompletion.GetChatMessageContentAsync(prompt);
        var json = response.Content ?? "[]";
        
        // Clean JSON if LLM added backticks
        json = json.Replace("```json", "").Replace("```", "").Trim();

        try
        {
            var serializerOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<QuestionDto>>(json, serializerOptions) ?? new();
        }
        catch
        {
            return new(); // Fallback empty
        }
    }
}
