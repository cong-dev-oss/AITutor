using AITutor.Application.Interfaces.Repositories;
using AITutor.Domain.Entities;
using AITutor.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AITutor.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public Task<AppUser?> GetByIdAsync(Guid id) =>
        _db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public Task<AppUser?> GetByEmailAsync(string email) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public Task<AppUser?> GetByUsernameAsync(string username) =>
        _db.Users.FirstOrDefaultAsync(u => u.Username == username);

    public async Task AddAsync(AppUser user) =>
        await _db.Users.AddAsync(user);

    public Task UpdateAsync(AppUser user)
    {
        _db.Users.Update(user);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
