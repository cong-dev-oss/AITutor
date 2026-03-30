namespace AITutor.Domain.Entities;

public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string CurrentLevel { get; set; } = "A1"; // A1, A2, B1, B2, C1, C2
    public string LearningStyle { get; set; } = "Example"; // Example, Theory
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserProgress> Progresses { get; set; } = new List<UserProgress>();
    public ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
