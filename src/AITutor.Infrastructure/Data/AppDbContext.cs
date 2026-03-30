using AITutor.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AITutor.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<UserProgress> UserProgresses => Set<UserProgress>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<Document>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasOne(d => d.User)
             .WithMany(u => u.Documents)
             .HasForeignKey(d => d.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserProgress>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.User)
             .WithMany(u => u.Progresses)
             .HasForeignKey(p => p.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.Status)
             .HasConversion<string>();
        });

        modelBuilder.Entity<ChatSession>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasOne(s => s.User)
             .WithMany(u => u.ChatSessions)
             .HasForeignKey(s => s.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChatMessage>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasOne(m => m.Session)
             .WithMany(s => s.Messages)
             .HasForeignKey(m => m.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
