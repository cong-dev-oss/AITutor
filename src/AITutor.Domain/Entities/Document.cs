namespace AITutor.Domain.Entities;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced
    public string Type { get; set; } = "Grammar"; // Grammar, Vocab, Exercise
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsProcessed { get; set; } = false;

    public AppUser User { get; set; } = null!;
}
