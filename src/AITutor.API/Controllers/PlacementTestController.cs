using AITutor.Application.Interfaces.Repositories;
using AITutor.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AITutor.API.Controllers;

[Authorize]
[ApiController]
[Route("api/placement-test")]
public class PlacementTestController : ControllerBase
{
    private readonly PlacementTestService _testService;
    private readonly IUserRepository _userRepo;

    public PlacementTestController(PlacementTestService testService, IUserRepository userRepo)
    {
        _testService = testService;
        _userRepo = userRepo;
    }

    [HttpGet("generate")]
    public async Task<IActionResult> Generate([FromQuery] string topic = "General English")
    {
        var questions = await _testService.GenerateTestAsync(topic);
        return Ok(questions);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] int score)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();

        // Cập nhật trình độ dựa trên điểm số (0-5)
        if (score <= 1) user.CurrentLevel = "A1";
        else if (score == 2) user.CurrentLevel = "A2";
        else if (score == 3) user.CurrentLevel = "B1";
        else if (score == 4) user.CurrentLevel = "B2";
        else user.CurrentLevel = "C1";

        await _userRepo.UpdateAsync(user);
        await _userRepo.SaveChangesAsync();

        return Ok(new { newLevel = user.CurrentLevel });
    }
}
