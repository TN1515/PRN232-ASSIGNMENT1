namespace ECommerceApp.API.Models;

/// <summary>
/// Password Reset Token model for secure password reset flow
/// 
/// Security Features:
/// - Single-use tokens (invalidated after use)
/// - Token expiration (1 hour by default)
/// - Hashed token storage (never store plain tokens in database)
/// - Attempt tracking (brute force protection)
/// - Timestamp tracking for audit
/// </summary>
public class PasswordResetToken
{
    /// <summary>
    /// Unique identifier for the token record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User who requested the password reset
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Navigation property to User
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// ✅ SECURITY: Hashed token stored in database
    /// Never store plain tokens in the database
    /// Hashed using SHA256
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Plain token (temporary - only kept in memory, not saved to DB)
    /// This is returned to frontend ONLY ONCE during token generation
    /// After that, it should NEVER be sent again
    /// </summary>
    public string? PlainToken { get; set; }

    /// <summary>
    /// When the token was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the token expires
    /// Default: 1 hour from creation
    /// After this time, token is no longer valid
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// ✅ SECURITY: Whether token has been used
    /// Single-use tokens are invalidated after first use
    /// Prevents replay attacks
    /// </summary>
    public bool IsUsed { get; set; }

    /// <summary>
    /// When the token was used for password reset
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// ✅ SECURITY: Number of validation attempts
    /// Used to detect brute force attacks
    /// Token is invalidated after 5 failed attempts
    /// </summary>
    public int Attempts { get; set; }

    /// <summary>
    /// When the last validation attempt was made
    /// Used for tracking attack patterns
    /// </summary>
    public DateTime? LastAttemptAt { get; set; }

    /// <summary>
    /// IP address that requested the token (if captured)
    /// Optional: Can be used for security auditing
    /// </summary>
    public string? RequestedFromIp { get; set; }

    /// <summary>
    /// User agent of the browser that requested the token
    /// Optional: Can be used for security auditing
    /// </summary>
    public string? RequestedFromUserAgent { get; set; }
}
