using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ECommerceApp.API.Models;
using ECommerceApp.API.Data;
using ECommerceApp.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApp.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    string GenerateJwtToken(User user);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(int id);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<AuthResponse> ResetPasswordAsync(ResetPasswordRequest request);
}

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IConfiguration configuration, ApplicationDbContext context, ILogger<AuthService> logger)
    {
        _configuration = configuration;
        _context = context;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return new AuthResponse { Success = false, Message = "Email and password are required" };
            }

            if (request.Password != request.ConfirmPassword)
            {
                return new AuthResponse { Success = false, Message = "Passwords do not match" };
            }

            if (request.Password.Length < 6)
            {
                return new AuthResponse { Success = false, Message = "Password must be at least 6 characters" };
            }

            // Check if user already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return new AuthResponse { Success = false, Message = "Email already registered" };
            }

            // Create new user
            var now = DateTime.UtcNow;
            var user = new User
            {
                Email = request.Email.ToLower(),
                FullName = request.FullName,
                PasswordHash = HashPassword(request.Password),
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create user cart
            try
            {
                var cart = new Cart { UserId = user.Id, CreatedAt = now, UpdatedAt = now };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Cart created for user: {user.Email}");
            }
            catch (Exception cartEx)
            {
                _logger.LogError(cartEx, "Error creating cart for user");
                // Don't fail registration if cart creation fails, just log it
            }

            _logger.LogInformation($"User registered successfully: {user.Email}");

            return new AuthResponse
            {
                Success = true,
                Message = "Registration successful",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    CreatedAt = user.CreatedAt
                },
                Token = GenerateJwtToken(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration: {Message}", ex.Message);
            var innerExMsg = ex.InnerException?.Message ?? "No inner exception";
            _logger.LogError("Inner exception: {InnerException}", innerExMsg);
            return new AuthResponse { Success = false, Message = $"Registration failed: {ex.Message}" };
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return new AuthResponse { Success = false, Message = "Email and password are required" };
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return new AuthResponse { Success = false, Message = "Invalid email or password" };
            }

            _logger.LogInformation($"User logged in: {user.Email}");

            return new AuthResponse
            {
                Success = true,
                Message = "Login successful",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    CreatedAt = user.CreatedAt
                },
                Token = GenerateJwtToken(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return new AuthResponse { Success = false, Message = "Login failed" };
        }
    }

    public string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "your-super-secret-key-change-this-in-production");
        var tokenHandler = new JwtSecurityTokenHandler();

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim("id", user.Id.ToString()),
                new System.Security.Claims.Claim("email", user.Email),
                new System.Security.Claims.Claim("fullName", user.FullName)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = jwtSettings["Issuer"] ?? "ECommerceApp",
            Audience = jwtSettings["Audience"] ?? "ECommerceApp",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        var hashOfInput = Convert.ToBase64String(SHA256.Create().ComputeHash(Encoding.UTF8.GetBytes(password)));
        return hashOfInput == hash;
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return new ForgotPasswordResponse { Success = false, Message = "Email is required" };
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null)
            {
                // Return success even if user not found for security reasons (don't reveal if email exists)
                return new ForgotPasswordResponse { Success = true, Message = "If the email exists, a reset link will be sent" };
            }

            // Generate reset token
            var resetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            user.ResetToken = resetToken;
            user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1); // Token valid for 1 hour

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Password reset token generated for user: {user.Email}");

            // ✅ SECURITY FIX: Don't expose reset token in response
            // In production, token should be sent via email
            return new ForgotPasswordResponse
            {
                Success = true,
                Message = "If the email exists in our system, a password reset link will be sent to it",
                ResetToken = null  // ✅ Not exposed for security
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password");
            return new ForgotPasswordResponse { Success = false, Message = "An error occurred" };
        }
    }

    public async Task<AuthResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return new AuthResponse { Success = false, Message = "Reset token is required" };
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return new AuthResponse { Success = false, Message = "New password is required" };
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return new AuthResponse { Success = false, Message = "Passwords do not match" };
            }

            if (request.NewPassword.Length < 6)
            {
                return new AuthResponse { Success = false, Message = "Password must be at least 6 characters" };
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ResetToken == request.Token);
            if (user == null)
            {
                return new AuthResponse { Success = false, Message = "Invalid reset token" };
            }

            if (user.ResetTokenExpiry == null || user.ResetTokenExpiry < DateTime.UtcNow)
            {
                return new AuthResponse { Success = false, Message = "Reset token has expired" };
            }

            // Update password and clear reset token
            user.PasswordHash = HashPassword(request.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Password reset successfully for user: {user.Email}");

            return new AuthResponse
            {
                Success = true,
                Message = "Password reset successfully",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    CreatedAt = user.CreatedAt
                },
                Token = GenerateJwtToken(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return new AuthResponse { Success = false, Message = "Password reset failed" };
        }
    }
}
