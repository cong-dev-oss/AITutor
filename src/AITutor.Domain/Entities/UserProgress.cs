namespace AITutor.Domain.Entities;

public class UserProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string TopicId { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public ProgressStatus Status { get; set; } = ProgressStatus.NotStarted;
    public string WeakPoints { get; set; } = "[]"; // JSON array of weak points
    public DateTime LastStudiedAt { get; set; } = DateTime.UtcNow;
    public int SessionCount { get; set; } = 0;

    public AppUser User { get; set; } = null!;
}

public enum ProgressStatus
{
    NotStarted,
    InProgress,
    Mastered
}
