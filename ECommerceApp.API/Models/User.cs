using System.ComponentModel.DataAnnotations;

namespace ECommerceApp.API.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public string FullName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // ✅ SECURITY: Old fields (deprecated, kept for backward compatibility)
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }

    // ✅ SECURITY: Rate limiting fields for password reset
    /// <summary>
    /// Number of password reset requests made by user
    /// Used for rate limiting: max 3 requests per 24 hours
    /// </summary>
    public int PasswordResetRequestCount { get; set; } = 0;

    /// <summary>
    /// Timestamp of last password reset request
    /// Used for rate limiting window
    /// </summary>
    public DateTime? LastPasswordResetRequest { get; set; }

    /// <summary>
    /// Failed login attempts counter
    /// Used for account lockout protection
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// When the account will be unlocked
    /// Set after too many failed login attempts
    /// </summary>
    public DateTime? LockedOutUntil { get; set; }

    // Navigation properties
    public ICollection<Cart> Carts { get; set; } = new List<Cart>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
}

