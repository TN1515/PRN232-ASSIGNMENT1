using Microsoft.EntityFrameworkCore;
using ECommerceApp.API.Models;

namespace ECommerceApp.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }

    public DbSet<User> Users { get; set; }

    public DbSet<Cart> Carts { get; set; }

    public DbSet<CartItem> CartItems { get; set; }

    public DbSet<Order> Orders { get; set; }

    public DbSet<OrderItem> OrderItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Description).IsRequired().HasMaxLength(1000);
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            
            // Ignore CreatedAt and UpdatedAt - they exist in DB as text, we don't need them
            entity.Ignore(p => p.CreatedAt);
            entity.Ignore(p => p.UpdatedAt);
            
            // PostgreSQL specific configurations
            entity.Property(p => p.Id).UseIdentityColumn();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FullName).IsRequired();
            // Configure CreatedAt and UpdatedAt with value converters for TEXT columns
            entity.Property(u => u.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),  // Convert DateTime to ISO 8601 string for storage
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            entity.Property(u => u.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            
            // PostgreSQL specific configurations
            entity.Property(u => u.Id).UseIdentityColumn();
            
            // Index for faster email lookups
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.UserId).IsRequired();
            // Configure CreatedAt and UpdatedAt with value converters
            entity.Property(c => c.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            entity.Property(c => c.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            
            // PostgreSQL specific configurations
            entity.Property(c => c.Id).UseIdentityColumn();
            
            // Foreign key relationship
            entity.HasOne(c => c.User)
                  .WithMany(u => u.Carts)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(ci => ci.Id);
            entity.Property(ci => ci.CartId).IsRequired();
            entity.Property(ci => ci.ProductId).IsRequired();
            entity.Property(ci => ci.Quantity).IsRequired();
            entity.Property(ci => ci.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
            // Configure AddedAt with value converter
            entity.Property(ci => ci.AddedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            
            // PostgreSQL specific configurations
            entity.Property(ci => ci.Id).UseIdentityColumn();
            
            // Foreign key relationships
            entity.HasOne(ci => ci.Cart)
                  .WithMany(c => c.CartItems)
                  .HasForeignKey(ci => ci.CartId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(ci => ci.Product)
                  .WithMany()
                  .HasForeignKey(ci => ci.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.UserId).IsRequired();
            entity.Property(o => o.OrderNumber).IsRequired();
            entity.Property(o => o.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(o => o.Status).IsRequired();
            // Configure timestamp fields with value converters
            entity.Property(o => o.OrderDate)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            entity.Property(o => o.PaidDate)
                .HasConversion(
                    v => v != null ? v.Value.ToString("o") : (string?)null,
                    v => v != null ? DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind) : (DateTime?)null);
            entity.Property(o => o.ShippedDate)
                .HasConversion(
                    v => v != null ? v.Value.ToString("o") : (string?)null,
                    v => v != null ? DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind) : (DateTime?)null);
            entity.Property(o => o.DeliveredDate)
                .HasConversion(
                    v => v != null ? v.Value.ToString("o") : (string?)null,
                    v => v != null ? DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind) : (DateTime?)null);
            entity.Property(o => o.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            entity.Property(o => o.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.ToString("o"),
                    v => DateTime.Parse(v, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind));
            
            // PostgreSQL specific configurations
            entity.Property(o => o.Id).UseIdentityColumn();
            
            // Foreign key relationship
            entity.HasOne(o => o.User)
                  .WithMany(u => u.Orders)
                  .HasForeignKey(o => o.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique index on OrderNumber
            entity.HasIndex(o => o.OrderNumber).IsUnique();
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(oi => oi.Id);
            entity.Property(oi => oi.OrderId).IsRequired();
            entity.Property(oi => oi.ProductId).IsRequired();
            entity.Property(oi => oi.Quantity).IsRequired();
            entity.Property(oi => oi.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
            
            // PostgreSQL specific configurations
            entity.Property(oi => oi.Id).UseIdentityColumn();
            
            // Foreign key relationships
            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(oi => oi.Product)
                  .WithMany()
                  .HasForeignKey(oi => oi.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

    }
}