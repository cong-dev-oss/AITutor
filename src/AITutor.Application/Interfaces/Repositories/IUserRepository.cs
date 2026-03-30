using AITutor.Domain.Entities;

namespace AITutor.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<AppUser?> GetByIdAsync(Guid id);
    Task<AppUser?> GetByEmailAsync(string email);
    Task<AppUser?> GetByUsernameAsync(string username);
    Task AddAsync(AppUser user);
    Task UpdateAsync(AppUser user);
    Task SaveChangesAsync();
}
