using AITutor.Application.DTOs;
using AITutor.Application.Interfaces.Repositories;
using AITutor.Application.Interfaces.Services;
using AITutor.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;

namespace AITutor.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly ITokenService _tokenService;

    public AuthController(IUserRepository userRepo, ITokenService tokenService)
    {
        _userRepo = userRepo;
        _tokenService = tokenService;
    }

    /// <summary>Đăng ký tài khoản mới</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _userRepo.GetByEmailAsync(req.Email) is not null)
            return Conflict(new { message = "Email đã tồn tại." });

        if (await _userRepo.GetByUsernameAsync(req.Username) is not null)
            return Conflict(new { message = "Username đã tồn tại." });

        var user = new AppUser
        {
            Username = req.Username,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user.Id, user.Username, user.Email);
        return Ok(new AuthResponse(token, user.Id, user.Username, user.Email, user.CurrentLevel));
    }

    /// <summary>Đăng nhập và nhận JWT Token</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _userRepo.GetByEmailAsync(req.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        var token = _tokenService.GenerateToken(user.Id, user.Username, user.Email);
        return Ok(new AuthResponse(token, user.Id, user.Username, user.Email, user.CurrentLevel));
    }
}
