using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AITutor.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AITutor.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(Guid userId, string username, string email)
    {
        var jwtConfig = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtConfig["Issuer"],
            audience: jwtConfig["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(jwtConfig["ExpiryInHours"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public Guid? ValidateToken(string token)
    {
        try
        {
            var jwtConfig = _config.GetSection("Jwt");
            var handler = new JwtSecurityTokenHandler();
            var validationParams = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["SecretKey"]!)),
                ValidateIssuer = true,
                ValidIssuer = jwtConfig["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtConfig["Audience"],
                ValidateLifetime = true
            };
            var principal = handler.ValidateToken(token, validationParams, out _);
            var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return sub is null ? null : Guid.Parse(sub);
        }
        catch
        {
            return null;
        }
    }
}
