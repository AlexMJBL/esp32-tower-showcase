using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using TowerGarden.Application.Interfaces;
using TowerGarden.Application.UseCases;
using TowerGarden.Infrastructure.Mqtt;
using TowerGarden.Infrastructure.Persistence;
using TowerGarden.Infrastructure.Simulator;
using TowerGarden.WebApi.Controllers;
using TowerGarden.WebApi.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. SERVICES LOGIQUES ET INFRASTRUCTURE
// ==========================================

// Enregistrement du State Store en mémoire (doit être Singleton pour conserver les données)
builder.Services.AddSingleton<IDeviceStateStore, InMemoryDeviceStateStore>();

// Enregistrement des Cas d'Utilisation (Use Cases - Application Layer)
builder.Services.AddScoped<GetDeviceStateQuery>();
builder.Services.AddScoped<UpdatePumpCommand>();
builder.Services.AddScoped<UpdateLightCommand>();
builder.Services.AddScoped<ProcessSensorReadingCommand>();

// Diffusion temps réel (SignalR Bridge)
builder.Services.AddSingleton<ISensorHubDispatcher, SensorHubDispatcher>();

// Enregistrement du client MQTT (double usage : singleton et HostedService)
builder.Services.AddSingleton<MqttClientService>();
builder.Services.AddSingleton<IMqttClientService>(sp => sp.GetRequiredService<MqttClientService>());

// ==========================================
// 2. CONFIGURATION DE LA SÉCURITÉ ET JWT (OWASP A02:2021)
// ==========================================

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = AuthController.Issuer,
        ValidAudience = AuthController.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AuthController.SecurityKey))
    };

    // Configuration spécifique pour SignalR : extraction du JWT depuis la QueryString
    // Les WebSockets du navigateur ne supportent pas l'envoi d'en-têtes HTTP personnalisés "Authorization"
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/sensors"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ==========================================
// 3. SERVICES D'ARRIÈRE-PLAN (HOSTED SERVICES)
// ==========================================

// L'ordre d'enregistrement définit l'ordre de démarrage (DIP) :
// 1. Le Broker MQTT démarre en premier pour écouter sur le port 1883
builder.Services.AddHostedService<EmbeddedMqttBroker>();

// 2. Le client du Backend se connecte au Broker avec identifiants
builder.Services.AddHostedService(sp => sp.GetRequiredService<MqttClientService>());

// 3. Le simulateur matériel démarre et se connecte au Broker
builder.Services.AddHostedService<DeviceSimulator>();

// ==========================================
// 4. COUCHE WEB & SIGNALR
// ==========================================

builder.Services.AddControllers();
builder.Services.AddSignalR();

// Configuration des politiques CORS pour autoriser le client React
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Requis pour SignalR
    });
});

var app = builder.Build();

// Configuration du pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("CorsPolicy");

app.UseRouting();

// Middleware d'authentification et d'autorisation dans le bon ordre (OWASP A01:2021)
app.UseAuthentication();
app.UseAuthorization();

// Mappage des contrôleurs REST et du Hub SignalR
app.MapControllers();
app.MapHub<SensorHub>("/hubs/sensors");

// Lancement de l'application
app.Run();
