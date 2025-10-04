using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ECommerceApp.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
