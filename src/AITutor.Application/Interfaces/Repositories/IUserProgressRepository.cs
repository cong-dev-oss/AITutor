using AITutor.Domain.Entities;

namespace AITutor.Application.Interfaces.Repositories;

public interface IUserProgressRepository
{
    Task<UserProgress?> GetByUserAndTopicAsync(Guid userId, string topicId);
    Task<IEnumerable<UserProgress>> GetByUserIdAsync(Guid userId);
    Task AddAsync(UserProgress progress);
    Task UpdateAsync(UserProgress progress);
    Task SaveChangesAsync();
}
