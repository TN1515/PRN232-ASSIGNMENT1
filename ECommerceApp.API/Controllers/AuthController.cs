using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ECommerceApp.API.DTOs;
using ECommerceApp.API.Services;

namespace ECommerceApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    // ✅ SECURITY: Inject password reset service with advanced security features
    private readonly IPasswordResetService _passwordResetService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IPasswordResetService passwordResetService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _passwordResetService = passwordResetService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        try
        {
            _logger.LogInformation($"Register request for email: {request.Email}");
            var response = await _authService.RegisterAsync(request);
            
            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Register endpoint");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    /// <summary>
    /// Login user
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        try
        {
            _logger.LogInformation($"Login request for email: {request.Email}");
            var response = await _authService.LoginAsync(request);
            
            if (!response.Success)
            {
                return Unauthorized(response);
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Login endpoint");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    /// <summary>
    /// Get current user (requires authentication)
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst("id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetCurrentUser endpoint");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Request password reset - Uses advanced security with rate limiting
    /// Returns same response regardless of email existence to prevent enumeration attacks
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<ActionResult<Services.PasswordResetResponse>> ForgotPassword(ForgotPasswordRequest request)
    {
        try
        {
            _logger.LogInformation($"Forgot password request for email: {request.Email}");
            
            // Use new security-enhanced service
            var response = await _passwordResetService.RequestPasswordResetAsync(request.Email);
            
            // Always return 200 OK to prevent email enumeration
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ForgotPassword endpoint");
            // Still return 200 OK to prevent enumeration
            return Ok(new Services.PasswordResetResponse
            {
                Success = true,
                Message = "If an account with that email exists, a password reset link has been sent."
            });
        }
    }

    /// <summary>
    /// Reset password with token - Uses advanced security validation
    /// Validates token expiration, single-use, and brute-force protection
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult<Services.PasswordResetResponse>> ResetPassword(ResetPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { message = "Token is required" });
            }

            _logger.LogInformation($"Reset password request with token (first 10 chars): {request.Token.Substring(0, Math.Min(10, request.Token.Length))}...");
            
            // Use new security-enhanced service
            var response = await _passwordResetService.ResetPasswordAsync(request.Token, request.NewPassword, request.ConfirmPassword);
            
            if (!response.Success)
            {
                return BadRequest(response);
            }

            // Response includes user and token from the service
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ResetPassword endpoint");
            return StatusCode(500, new { message = "An error occurred during password reset" });
        }
    }
}
