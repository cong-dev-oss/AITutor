using AITutor.Domain.Entities;

namespace AITutor.Application.Interfaces.Repositories;

public interface IChatSessionRepository
{
    Task<ChatSession?> GetByIdAsync(Guid id);
    Task<ChatSession?> GetActiveSessionAsync(Guid userId);
    Task AddAsync(ChatSession session);
    Task AddMessageAsync(ChatMessage message);
    Task<IEnumerable<ChatMessage>> GetRecentMessagesAsync(Guid sessionId, int count = 10);
    Task UpdateAsync(ChatSession session);
    Task SaveChangesAsync();
}
