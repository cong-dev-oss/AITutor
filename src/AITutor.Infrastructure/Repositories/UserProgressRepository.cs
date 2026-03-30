using AITutor.Application.Interfaces.Repositories;
using AITutor.Domain.Entities;
using AITutor.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AITutor.Infrastructure.Repositories;

public class UserProgressRepository : IUserProgressRepository
{
    private readonly AppDbContext _db;
    public UserProgressRepository(AppDbContext db) => _db = db;

    public Task<UserProgress?> GetByUserAndTopicAsync(Guid userId, string topicId) =>
        _db.UserProgresses.FirstOrDefaultAsync(p => p.UserId == userId && p.TopicId == topicId);

    public async Task<IEnumerable<UserProgress>> GetByUserIdAsync(Guid userId) =>
        await _db.UserProgresses.Where(p => p.UserId == userId).ToListAsync();

    public async Task AddAsync(UserProgress progress) =>
        await _db.UserProgresses.AddAsync(progress);

    public Task UpdateAsync(UserProgress progress)
    {
        _db.UserProgresses.Update(progress);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
