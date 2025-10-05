using Microsoft.EntityFrameworkCore;
using ECommerceApp.API.Data;
using ECommerceApp.API.Models;
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

// Add Entity Framework
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Replace environment variable placeholders in connection string
if (!string.IsNullOrEmpty(connectionString))
{
    connectionString = connectionString
        .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost")
        .Replace("${DB_DATABASE}", Environment.GetEnvironmentVariable("DB_DATABASE") ?? "ecommerce")
        .Replace("${DB_USERNAME}", Environment.GetEnvironmentVariable("DB_USERNAME") ?? "postgres")
        .Replace("${DB_PASSWORD}", Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "password")
        .Replace("${DB_SSL_MODE}", Environment.GetEnvironmentVariable("DB_SSL_MODE") ?? "Prefer")
        .Replace("${DB_TRUST_SERVER_CERTIFICATE}", Environment.GetEnvironmentVariable("DB_TRUST_SERVER_CERTIFICATE") ?? "false");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (connectionString?.Contains("Host=") == true)
    {
        // PostgreSQL for production
        options.UseNpgsql(connectionString);
    }
    else
    {
        // SQLite for development
        options.UseSqlite(connectionString ?? "Data Source=ecommerce.db");
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
                // Development - allow localhost
                policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
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
app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// Serve static files (React app)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

// Fallback route for SPA
app.MapFallbackToFile("index.html");

// Database is already migrated manually, no need to auto-migrate
// Use 'dotnet ef database update' command for migrations

app.Run();
