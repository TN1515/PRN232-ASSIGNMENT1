using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ECommerceApp.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Image = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "CreatedAt", "Description", "Image", "Name", "Price", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 10, 3, 15, 25, 2, 27, DateTimeKind.Utc).AddTicks(2067), "Comfortable cotton t-shirt perfect for everyday wear", "https://via.placeholder.com/400x400?text=T-Shirt", "Classic Cotton T-Shirt", 19.99m, new DateTime(2025, 10, 3, 15, 25, 2, 27, DateTimeKind.Utc).AddTicks(2069) },
                    { 2, new DateTime(2025, 10, 3, 15, 25, 2, 27, DateTimeKind.Utc).AddTicks(2074), "Premium quality denim jeans with a perfect fit", "https://via.placeholder.com/400x400?text=Jeans", "Denim Jeans", 79.99m, new DateTime(2025, 10, 3, 15, 25, 2, 27, DateTimeKind.Utc).AddTicks(2075) },
                    { 3, new DateTime(2025, 10, 3, 15, 25, 2, 27, DateTimeKind.Utc).AddTicks(2076), "Cozy wool sweater for cold weather", "https://via.placeholder.com/400x400?text=Sweater", "Wool Sweater", 89.99m, new DateTime(2025, 10, 3, 15, 25, 2, 27, DateTimeKind.Utc).AddTicks(2076) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Products");
        }
    }
}
