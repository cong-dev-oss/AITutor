using AITutor.Application.Interfaces.Repositories;
using AITutor.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace AITutor.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ITutorAgentService _tutorService;
    private readonly IUserRepository _userRepo;
    private readonly IUserProgressRepository _progressRepo;
    private readonly IChatSessionRepository _chatRepo;

    public ChatHub(
        ITutorAgentService tutorService,
        IUserRepository userRepo,
        IUserProgressRepository progressRepo,
        IChatSessionRepository chatRepo)
    {
        _tutorService = tutorService;
        _userRepo = userRepo;
        _progressRepo = progressRepo;
        _chatRepo = chatRepo;
    }

    public async Task SendMessage(string topicId, string message)
    {
        var userId = Guid.Parse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        
        // 1. Get or Create Session
        var session = await _chatRepo.GetActiveSessionAsync(userId);
        if (session == null || session.TopicId != topicId)
        {
            session = new Domain.Entities.ChatSession
            {
                UserId = userId,
                TopicId = topicId,
                StartedAt = DateTime.UtcNow
            };
            await _chatRepo.AddAsync(session);
            await _chatRepo.SaveChangesAsync();
        }

        // 2. Get User's Weak Points for the topic
        var progress = await _progressRepo.GetByUserAndTopicAsync(userId, topicId);
        var weakPoints = progress?.WeakPoints ?? "[]";

        // 3. Stream Response from AI
        await Clients.Caller.SendAsync("ReceiveMessageChunk", "[START]");
        
        var stream = _tutorService.StreamResponseAsync(userId, session.Id, message, weakPoints, Context.ConnectionAborted);
        
        await foreach (var chunk in stream)
        {
            await Clients.Caller.SendAsync("ReceiveMessageChunk", chunk);
        }

        await Clients.Caller.SendAsync("ReceiveMessageChunk", "[END]");
    }
}
