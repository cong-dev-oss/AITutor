namespace AITutor.Application.Interfaces.Services;

public interface ITokenService
{
    string GenerateToken(Guid userId, string username, string email);
    Guid? ValidateToken(string token);
}
