using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApp.API.Models;

public class Product
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
    public decimal Price { get; set; }
    
    [Url]
    public string? Image { get; set; }
    
    // Ignore these fields - they exist in DB as text but we don't need them
    [NotMapped]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [NotMapped]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}