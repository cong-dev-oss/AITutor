using AITutor.Infrastructure.Data;
using AITutor.Infrastructure.Services;
using AITutor.Application.Interfaces.Repositories;
using AITutor.Application.Interfaces.Services;
using AITutor.Infrastructure.Repositories;
using AITutor.API.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Embeddings;

var builder = WebApplication.CreateBuilder(args);

// ─── AI Configuration ─────────────────────────────────────────────────────────
var aiConfig = builder.Configuration.GetSection("AI");
var kernelBuilder = Kernel.CreateBuilder();

if (aiConfig["Provider"] == "OpenAI")
{
    kernelBuilder.AddOpenAIChatCompletion(aiConfig["ModelId"]!, aiConfig["ApiKey"]!);
    kernelBuilder.AddOpenAITextEmbeddingGeneration(aiConfig["EmbeddingModelId"]!, aiConfig["ApiKey"]!);
}
// Add other providers here if needed (Gemini, Groq etc via SK connectors)

var kernel = kernelBuilder.Build();
builder.Services.AddSingleton(kernel);
builder.Services.AddSingleton(kernel.GetRequiredService<IChatCompletionService>());
builder.Services.AddSingleton(kernel.GetRequiredService<ITextEmbeddingGenerationService>());

// ─── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtConfig = builder.Configuration.GetSection("Jwt");
var secretKey = jwtConfig["SecretKey"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"],
            ValidAudience = jwtConfig["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
        // Cho phép SignalR đọc JWT từ query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ─── Repositories ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IUserProgressRepository, UserProgressRepository>();
builder.Services.AddScoped<IChatSessionRepository, ChatSessionRepository>();

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IDocumentProcessingService, DocumentProcessingService>();
builder.Services.AddScoped<IVectorDbService, VectorDbService>();
builder.Services.AddScoped<ITutorAgentService, TutorAgentService>();
builder.Services.AddScoped<PlacementTestService>(); // Register the assessment service

// ─── SignalR ──────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── CORS (Cho Blazor WASM dev local) ────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowBlazor", policy =>
        policy.WithOrigins("http://localhost:5173", "https://localhost:7001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ─── Swagger ──────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var app = builder.Build();

// ─── Auto Migrate ──────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// ─── Middleware Pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowBlazor");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
