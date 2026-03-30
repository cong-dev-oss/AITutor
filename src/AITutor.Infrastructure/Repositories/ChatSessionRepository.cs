using AITutor.Application.Interfaces.Repositories;
using AITutor.Domain.Entities;
using AITutor.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AITutor.Infrastructure.Repositories;

public class ChatSessionRepository : IChatSessionRepository
{
    private readonly AppDbContext _db;
    public ChatSessionRepository(AppDbContext db) => _db = db;

    public Task<ChatSession?> GetByIdAsync(Guid id) =>
        _db.ChatSessions.Include(s => s.Messages).FirstOrDefaultAsync(s => s.Id == id);

    public Task<ChatSession?> GetActiveSessionAsync(Guid userId) =>
        _db.ChatSessions
           .Where(s => s.UserId == userId && s.EndedAt == null)
           .OrderByDescending(s => s.StartedAt)
           .FirstOrDefaultAsync();

    public async Task AddAsync(ChatSession session) =>
        await _db.ChatSessions.AddAsync(session);

    public async Task AddMessageAsync(ChatMessage message) =>
        await _db.ChatMessages.AddAsync(message);

    public async Task<IEnumerable<ChatMessage>> GetRecentMessagesAsync(Guid sessionId, int count = 10) =>
        await _db.ChatMessages
                 .Where(m => m.SessionId == sessionId)
                 .OrderByDescending(m => m.CreatedAt)
                 .Take(count)
                 .OrderBy(m => m.CreatedAt)
                 .ToListAsync();

    public Task UpdateAsync(ChatSession session)
    {
        _db.ChatSessions.Update(session);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
