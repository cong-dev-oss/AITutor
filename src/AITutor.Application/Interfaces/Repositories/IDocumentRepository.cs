using AITutor.Domain.Entities;

namespace AITutor.Application.Interfaces.Repositories;

public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid id);
    Task<IEnumerable<Document>> GetByUserIdAsync(Guid userId);
    Task AddAsync(Document document);
    Task UpdateAsync(Document document);
    Task DeleteAsync(Document document);
    Task SaveChangesAsync();
}
