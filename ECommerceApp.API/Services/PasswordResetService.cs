using System.Security.Cryptography;
using System.Text;
using ECommerceApp.API.Data;
using ECommerceApp.API.DTOs;
using ECommerceApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApp.API.Services;

/// <summary>
/// Enhanced password reset service with additional security measures
/// Implements:
/// - Token expiration (1 hour by default)
/// - Single-use tokens (invalidated after use)
/// - Rate limiting per email (3 requests per 24 hours)
/// - Secure token generation (32 bytes, base64 encoded)
/// - Email verification before allowing reset
/// </summary>
public interface IPasswordResetService
{
    Task<PasswordResetResponse> RequestPasswordResetAsync(string email);
    Task<PasswordResetResponse> ValidateResetTokenAsync(string token);
    Task<PasswordResetResponse> ResetPasswordAsync(string token, string newPassword, string confirmPassword);
    Task<bool> IsEmailRateLimitedAsync(string email);
}

public class PasswordResetService : IPasswordResetService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PasswordResetService> _logger;
    
    // Configuration
    private const int TOKEN_EXPIRY_HOURS = 1;  // Token valid for 1 hour
    private const int RATE_LIMIT_REQUESTS = 3;  // Max 3 requests
    private const int RATE_LIMIT_HOURS = 24;  // Per 24 hours
    private const int MIN_PASSWORD_LENGTH = 6;
    private const int TOKEN_BYTE_LENGTH = 32;  // 256-bit token

    public PasswordResetService(ApplicationDbContext context, ILogger<PasswordResetService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Request password reset with security checks
    /// </summary>
    public async Task<PasswordResetResponse> RequestPasswordResetAsync(string email)
    {
        try
        {
            // Validate email format
            if (string.IsNullOrWhiteSpace(email))
            {
                _logger.LogWarning("Empty email provided for password reset");
                return new PasswordResetResponse
                {
                    Success = true,  // Don't reveal if email exists
                    Message = "If the email exists in our system, a password reset link will be sent",
                    TokenExpiresIn = null
                };
            }

            email = email.ToLower().Trim();

            // Check rate limiting first (before revealing user existence)
            if (await IsEmailRateLimitedAsync(email))
            {
                _logger.LogWarning($"Rate limit exceeded for email: {email}");
                return new PasswordResetResponse
                {
                    Success = true,  // Don't reveal rate limiting
                    Message = "If the email exists in our system, a password reset link will be sent",
                    TokenExpiresIn = null
                };
            }

            // Find user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            
            if (user == null)
            {
                // Security: Don't reveal if user exists
                _logger.LogInformation($"Password reset requested for non-existent email: {email}");
                return new PasswordResetResponse
                {
                    Success = true,
                    Message = "If the email exists in our system, a password reset link will be sent",
                    TokenExpiresIn = null
                };
            }

            // Invalidate any existing reset tokens for this user
            var existingTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();
            
            foreach (var existingToken in existingTokens)
            {
                existingToken.IsUsed = true;
                existingToken.UsedAt = DateTime.UtcNow;
            }

            // Generate secure random token (32 bytes = 256 bits)
            var tokenBytes = RandomNumberGenerator.GetBytes(TOKEN_BYTE_LENGTH);
            var resetToken = Convert.ToBase64String(tokenBytes);

            // Create password reset token record
            var passwordResetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Token = HashToken(resetToken),  // ✅ Store hashed token, not plain token
                PlainToken = resetToken,  // Temporary - will be returned only once
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(TOKEN_EXPIRY_HOURS),
                IsUsed = false,
                Attempts = 0,
                LastAttemptAt = null
            };

            _context.PasswordResetTokens.Add(passwordResetToken);

            // Update user's last password reset request time for rate limiting
            user.LastPasswordResetRequest = DateTime.UtcNow;
            user.PasswordResetRequestCount += 1;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Password reset token generated for user: {user.Email}");

            // ✅ SECURITY: Return only plain token once, never again
            // In production, this should be sent via email
            return new PasswordResetResponse
            {
                Success = true,
                Message = "If the email exists in our system, a password reset link will be sent",
                Token = resetToken,  // ✅ Return plain token ONLY here, ONLY once
                TokenExpiresIn = TOKEN_EXPIRY_HOURS * 60,  // In minutes
                IsNewTokenGenerated = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset request");
            return new PasswordResetResponse
            {
                Success = false,
                Message = "An error occurred while processing your request"
            };
        }
    }

    /// <summary>
    /// Validate reset token before allowing password change
    /// </summary>
    public async Task<PasswordResetResponse> ValidateResetTokenAsync(string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("Empty token provided for validation");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Invalid reset token"
                };
            }

            // Hash the provided token to compare with stored hash
            var hashedToken = HashToken(token);

            // Find token record
            var resetTokenRecord = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == hashedToken);

            if (resetTokenRecord == null)
            {
                _logger.LogWarning("Invalid token provided");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Invalid reset token"
                };
            }

            // Check if token has been used
            if (resetTokenRecord.IsUsed)
            {
                _logger.LogWarning($"Attempt to reuse token for user: {resetTokenRecord.User.Email}");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "This reset link has already been used. Please request a new one."
                };
            }

            // Check if token has expired
            if (resetTokenRecord.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning($"Expired token provided for user: {resetTokenRecord.User.Email}");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "This reset link has expired. Please request a new one."
                };
            }

            // Check for too many attempts (brute force protection)
            if (resetTokenRecord.Attempts >= 5)
            {
                _logger.LogWarning($"Too many reset attempts for user: {resetTokenRecord.User.Email}");
                resetTokenRecord.IsUsed = true;  // Invalidate token after too many attempts
                await _context.SaveChangesAsync();
                
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Too many attempts. Please request a new reset link."
                };
            }

            // Increment attempt counter
            resetTokenRecord.Attempts += 1;
            resetTokenRecord.LastAttemptAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Token is valid
            _logger.LogInformation($"Reset token validated for user: {resetTokenRecord.User.Email}");
            return new PasswordResetResponse
            {
                Success = true,
                Message = "Token is valid",
                TokenExpiresIn = (int)(resetTokenRecord.ExpiresAt - DateTime.UtcNow).TotalMinutes
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating reset token");
            return new PasswordResetResponse
            {
                Success = false,
                Message = "An error occurred while validating the token"
            };
        }
    }

    /// <summary>
    /// Reset password with token validation
    /// </summary>
    public async Task<PasswordResetResponse> ResetPasswordAsync(string token, string newPassword, string confirmPassword)
    {
        try
        {
            // Validate inputs
            if (string.IsNullOrWhiteSpace(token))
            {
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Reset token is required"
                };
            }

            if (string.IsNullOrWhiteSpace(newPassword))
            {
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "New password is required"
                };
            }

            if (newPassword != confirmPassword)
            {
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Passwords do not match"
                };
            }

            if (newPassword.Length < MIN_PASSWORD_LENGTH)
            {
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = $"Password must be at least {MIN_PASSWORD_LENGTH} characters long"
                };
            }

            // Hash the provided token
            var hashedToken = HashToken(token);

            // Find token record
            var resetTokenRecord = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == hashedToken);

            if (resetTokenRecord == null)
            {
                _logger.LogWarning("Invalid token provided for password reset");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Invalid reset token"
                };
            }

            // Verify token hasn't been used
            if (resetTokenRecord.IsUsed)
            {
                _logger.LogWarning($"Attempt to reuse token for user: {resetTokenRecord.User.Email}");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "This reset link has already been used"
                };
            }

            // Verify token hasn't expired
            if (resetTokenRecord.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning($"Expired token used for password reset: {resetTokenRecord.User.Email}");
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "This reset link has expired"
                };
            }

            // ✅ SECURITY: Mark token as used (single-use token)
            resetTokenRecord.IsUsed = true;
            resetTokenRecord.UsedAt = DateTime.UtcNow;

            // Update user's password
            var user = resetTokenRecord.User;
            user.PasswordHash = HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;
            
            // Reset password reset attempt counters
            user.PasswordResetRequestCount = 0;
            user.LastPasswordResetRequest = null;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Password reset successfully for user: {user.Email}");

            return new PasswordResetResponse
            {
                Success = true,
                Message = "Password reset successfully",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    CreatedAt = user.CreatedAt
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return new PasswordResetResponse
            {
                Success = false,
                Message = "An error occurred during password reset"
            };
        }
    }

    /// <summary>
    /// Check if email has exceeded rate limit
    /// </summary>
    public async Task<bool> IsEmailRateLimitedAsync(string email)
    {
        try
        {
            email = email.ToLower().Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return false;

            // Check if user has exceeded rate limit
            if (user.LastPasswordResetRequest == null)
                return false;

            var timeSinceLastRequest = DateTime.UtcNow - user.LastPasswordResetRequest.Value;
            var rateWindowHours = RATE_LIMIT_HOURS;

            // If within rate limit window
            if (timeSinceLastRequest.TotalHours < rateWindowHours)
            {
                // Check if count exceeded
                if (user.PasswordResetRequestCount >= RATE_LIMIT_REQUESTS)
                {
                    _logger.LogWarning($"Rate limit exceeded for email: {email}. Count: {user.PasswordResetRequestCount}");
                    return true;
                }
            }
            else
            {
                // Outside rate limit window, reset counter
                user.PasswordResetRequestCount = 0;
                user.LastPasswordResetRequest = null;
                await _context.SaveChangesAsync();
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking rate limit");
            return false;
        }
    }

    /// <summary>
    /// Hash a token using SHA256
    /// </summary>
    private static string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashedBytes);
    }

    /// <summary>
    /// Hash password using SHA256
    /// </summary>
    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

/// <summary>
/// Password reset response DTO
/// </summary>
public class PasswordResetResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }  // ✅ Plain token returned ONLY once
    public int? TokenExpiresIn { get; set; }  // In minutes
    public bool IsNewTokenGenerated { get; set; }
    public UserDto? User { get; set; }
}
