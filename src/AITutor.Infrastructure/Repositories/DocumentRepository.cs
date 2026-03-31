using AITutor.Application.Interfaces.Repositories;
using AITutor.Domain.Entities;
using AITutor.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AITutor.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly AppDbContext _db;
    public DocumentRepository(AppDbContext db) => _db = db;

    public Task<Document?> GetByIdAsync(Guid id) =>
        _db.Documents.FirstOrDefaultAsync(d => d.Id == id);

    public async Task<IEnumerable<Document>> GetByUserIdAsync(Guid userId) =>
        await _db.Documents.Where(d => d.UserId == userId).ToListAsync();

    public async Task AddAsync(Document document) =>
        await _db.Documents.AddAsync(document);

    public Task UpdateAsync(Document document)
    {
        _db.Documents.Update(document);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Document document)
    {
        _db.Documents.Remove(document);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
