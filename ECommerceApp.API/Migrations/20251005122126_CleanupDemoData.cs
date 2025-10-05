using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceApp.API.Migrations
{
    /// <inheritdoc />
    public partial class CleanupDemoData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete all products with via.placeholder.com images (demo data)
            migrationBuilder.Sql("DELETE FROM \"Products\" WHERE \"Image\" LIKE '%via.placeholder.com%'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
