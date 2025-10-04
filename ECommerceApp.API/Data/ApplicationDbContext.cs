using Microsoft.EntityFrameworkCore;
using ECommerceApp.API.Models;

namespace ECommerceApp.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Description).IsRequired().HasMaxLength(1000);
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            // PostgreSQL compatible default values
            entity.Property(p => p.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(p => p.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // PostgreSQL specific configurations
            entity.Property(p => p.Id).UseIdentityColumn();
        });

    }
}