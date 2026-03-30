using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using AITutor.Frontend;
using MudBlazor.Services;
using Blazored.LocalStorage;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// ─── API Base Address ──────────────────────────────────────────────────────────
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("http://localhost:5000/") });

// ─── MudBlazor & Storage Services ──────────────────────────────────────────────
builder.Services.AddMudServices();
builder.Services.AddBlazoredLocalStorage();

await builder.Build().RunAsync();
