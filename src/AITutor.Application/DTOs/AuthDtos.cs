namespace AITutor.Application.DTOs;

public record RegisterRequest(string Username, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    Guid UserId,
    string Username,
    string Email,
    string CurrentLevel
);
