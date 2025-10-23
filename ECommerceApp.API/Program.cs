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
// ✅ SECURITY: Register password reset service with enhanced security features
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();

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
            policy.WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://127.0.0.1:3000",
                    "https://prn-232-assignment-1.vercel.app",
                    "https://prn-232-assignment-1.vercel.app/",
                    "https://*.vercel.app"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    
    // Additional policy for production - more permissive
    options.AddPolicy("AllowAnyOrigin",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Enable Swagger for both Development and Production
app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    // Redirect HTTP to HTTPS in production
    app.UseHttpsRedirection();
}

// ✅ SECURITY FIX: Add security headers middleware
app.Use(async (context, next) =>
{
    // Prevent MIME type sniffing
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    
    // Prevent clickjacking attacks
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    
    // Enable XSS protection in older browsers
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    
    // HSTS for production
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    
    // Content Security Policy - Basic protection
    context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
    
    // Referrer Policy
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Permissions Policy (formerly Feature Policy)
    context.Response.Headers.Add("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    
    await next();
});

// Use CORS middleware
app.UseCors("AllowReactApp");

app.UseAuthentication();

app.UseAuthorization();

// Serve static files (React frontend)
app.UseDefaultFiles();
app.UseStaticFiles();

// Map API controllers
app.MapControllers();

// Fallback to index.html for React routing
app.MapFallbackToFile("index.html");

app.Run();