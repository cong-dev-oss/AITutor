using System.Text;
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
using Microsoft.SemanticKernel.Connectors.Google;
using Microsoft.SemanticKernel.Connectors.Ollama;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using OllamaSharp;

var builder = WebApplication.CreateBuilder(args);

// ─── AI Configuration ─────────────────────────────────────────────────────────
var aiConfig = builder.Configuration.GetSection("AI");
var chatConfig = aiConfig.GetSection("Chat");
var embedConfig = aiConfig.GetSection("Embedding");

var kernelBuilder = Kernel.CreateBuilder();

// 1. Setup Chat Completion
if (chatConfig["Provider"] == "Gemini")
{
#pragma warning disable SKEXP0070
    kernelBuilder.AddGoogleAIGeminiChatCompletion(
        modelId: chatConfig["ModelId"]!,
        apiKey: chatConfig["ApiKey"]!,
        apiVersion: GoogleAIVersion.V1);
#pragma warning restore SKEXP0070
}
else if (chatConfig["Provider"] == "OpenAI")
{
    kernelBuilder.AddOpenAIChatCompletion(chatConfig["ModelId"]!, chatConfig["ApiKey"]!);
}
else if (chatConfig["Provider"] == "Ollama")
{
#pragma warning disable SKEXP0070
    // Cấu hình Timeout thông qua HttpClient cho Ollama
    builder.Services.AddHttpClient("OllamaClient", client => {
        client.BaseAddress = new Uri(chatConfig["Host"]!);
        client.Timeout = TimeSpan.FromMinutes(5);
    });

    kernelBuilder.AddOllamaChatCompletion(
        modelId: chatConfig["ModelId"]!,
        endpoint: new Uri(chatConfig["Host"]!));
#pragma warning restore SKEXP0070
}

// 2. Setup Embedding Generation
if (embedConfig["Provider"] == "OpenAI")
{
#pragma warning disable SKEXP0010
    kernelBuilder.AddOpenAITextEmbeddingGeneration(embedConfig["ModelId"]!, embedConfig["ApiKey"]!);
#pragma warning restore SKEXP0010
}
else if (embedConfig["Provider"] == "Gemini")
{
#pragma warning disable SKEXP0070
    kernelBuilder.AddGoogleAIEmbeddingGeneration(
        modelId: embedConfig["ModelId"]!,
        apiKey: embedConfig["ApiKey"]!,
        apiVersion: GoogleAIVersion.V1); 
#pragma warning restore SKEXP0070
}
else if (embedConfig["Provider"] == "Ollama")
{
#pragma warning disable SKEXP0070
    kernelBuilder.AddOllamaTextEmbeddingGeneration(
        modelId: embedConfig["ModelId"]!,
        endpoint: new Uri(embedConfig["Host"]!));
#pragma warning restore SKEXP0070
}

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
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
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
