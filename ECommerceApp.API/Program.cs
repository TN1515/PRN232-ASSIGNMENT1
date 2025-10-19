using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ECommerceApp.API.Data;
using ECommerceApp.API.Models;
using ECommerceApp.API.Services;
using DotNetEnv;

// Load .env file if exists
if (File.Exists(".env"))
{
    Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "your-super-secret-key-change-this-in-production-this-should-be-atleast-32-characters");

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true
    };
});

// Add custom services
builder.Services.AddScoped<IAuthService, AuthService>();

// Add Entity Framework with PostgreSQL ONLY - No SQLite fallback
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");
}

Console.WriteLine($"Connecting to PostgreSQL database...");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            if (builder.Environment.IsDevelopment())
            {
                // Development - allow localhost with credentials
                policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "https://prn-232-assignment-1.vercel.app/")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
            else
            {
                // Production - allow any origin for now, can be restricted later
                policy.AllowAnyOrigin()
                      .AllowAnyHeader() 
                      .AllowAnyMethod();
            }
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Enable Swagger for both Development and Production
app.UseSwagger(c => 
{
    c.RouteTemplate = "swagger/{documentname}/swagger.json";
});
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "E-Commerce API V1");
    c.RoutePrefix = "swagger";
});

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("AllowReactApp");

app.UseAuthentication();

app.UseAuthorization();

// Map API controllers
app.MapControllers();

// Serve static files (React frontend)
app.UseDefaultFiles();
app.UseStaticFiles();

// Custom fallback for React routing - exclude API and swagger routes
app.MapWhen(
    context => !context.Request.Path.StartsWithSegments("/api") && 
               !context.Request.Path.StartsWithSegments("/swagger") &&
               !context.Request.Path.StartsWithSegments("/swagger-ui") &&
               !context.Request.Path.StartsWithSegments("/swagger-resources"),
    appBranch => appBranch.MapFallbackToFile("index.html")
);

app.Run();