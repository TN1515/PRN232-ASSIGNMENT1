using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ECommerceApp.API.Data;
using ECommerceApp.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public PaymentController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("id");
        return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
    }

    /// <summary>
    /// Create PayOS payment link
    /// </summary>
    [Authorize]
    [HttpPost("create-payment-link")]
    public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentLinkDto dto)
    {
        try
        {
            Console.WriteLine("🔵 PaymentController.CreatePaymentLink called");
            Console.WriteLine($"📦 OrderId: {dto.OrderId}, Amount: {dto.Amount}");
            
            var userId = GetCurrentUserId();
            Console.WriteLine($"👤 UserId: {userId}");
            
            if (userId == 0)
                return Unauthorized(new { message = "User not found" });

            // Verify order exists and belongs to user
            var order = await _context.Orders
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

            if (order == null)
                return NotFound(new { message = "Order not found" });

            // For now, return a mock PayOS payment link
            // In production, you would call PayOS API here
            var transactionId = Guid.NewGuid().ToString();
            // Redirect to local payment callback (test mode)
            // Code: 0 = Success, 1 = Failed, 2 = Cancelled, 3 = Pending
            var checkoutUrl = $"http://localhost:3000/payment-callback?code=0&id={order.Id}&cancel=0";
            var qrCode = $"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='white'/%3E%3Ctext x='50' y='100' font-size='16'%3ETest QR Code%3C/text%3E%3C/svg%3E";

            // Store payment link info in order
            order.PayosTransactionId = transactionId;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                checkoutUrl = checkoutUrl,
                qrCode = qrCode,
                transactionId = transactionId
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Verify PayOS payment
    /// </summary>
    [Authorize]
    [HttpGet("verify/{paymentId}")]
    public async Task<IActionResult> VerifyPayment(string paymentId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "User not found" });

            // Find order by ID (paymentId is actually the order ID for testing)
            int.TryParse(paymentId, out var orderId);
            
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                return NotFound(new { message = "Payment not found" });

            // Update order status to Paid if it's not already paid
            if (order.Status != OrderStatus.Paid)
            {
                order.Status = OrderStatus.Paid;
                order.PaidDate = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Order {orderId} payment verified - Status updated to Paid");
            }

            // Return verification response
            return Ok(new
            {
                success = true,
                status = order.Status.ToString(),
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                amount = order.TotalAmount,
                paidAt = order.PaidDate
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ VerifyPayment error: {ex.Message}");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Check payment status
    /// </summary>
    [Authorize]
    [HttpGet("status/{orderId}")]
    public async Task<IActionResult> CheckPaymentStatus(int orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "User not found" });

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                return NotFound(new { message = "Order not found" });

            return Ok(new
            {
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                status = order.Status.ToString(),
                totalAmount = order.TotalAmount,
                paidAt = order.PaidDate
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Handle PayOS webhook callback
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> WebhookCallback([FromBody] PayosWebhookDto dto)
    {
        try
        {
            // Verify webhook signature (implement PayOS signature verification)
            // var isValid = VerifyPayosSignature(dto, Request.Headers);
            // if (!isValid)
            //     return Unauthorized(new { message = "Invalid signature" });

            // Find order by transaction ID
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.PayosTransactionId == dto.Data.TransactionId);

            if (order == null)
                return NotFound(new { message = "Order not found" });

            // Update order status based on payment status
            if (dto.Data.Status == "PAID")
            {
                order.Status = OrderStatus.Paid;
                order.PaidDate = DateTime.UtcNow;
            }
            else if (dto.Data.Status == "CANCELLED")
            {
                order.Status = OrderStatus.Cancelled;
            }

            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class CreatePaymentLinkDto
{
    public int OrderId { get; set; }
    public long Amount { get; set; }
    public string? OrderInfo { get; set; }
    public string? BuyerName { get; set; }
    public string? BuyerEmail { get; set; }
    public string? BuyerPhone { get; set; }
    public string? BuyerAddress { get; set; }
    public string? Description { get; set; }
}

public class PayosWebhookDto
{
    public WebhookData Data { get; set; } = new();
    public string Code { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
}

public class WebhookData
{
    public string TransactionId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string ReferenceCode { get; set; } = string.Empty;
    public long Timestamp { get; set; }
}
