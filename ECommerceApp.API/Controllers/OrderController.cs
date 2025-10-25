using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ECommerceApp.API.Data;
using ECommerceApp.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrderController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("id");
        if (userIdClaim != null)
        {
            if (int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
        }
        
        // Log for debugging
        var allClaims = User.Claims.Select(c => $"{c.Type}:{c.Value}").ToList();
        System.Diagnostics.Debug.WriteLine($"❌ GetCurrentUserId failed. Available claims: {string.Join(", ", allClaims)}");
        
        return 0;
    }

    /// <summary>
    /// Get all orders for current user
    /// </summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetUserOrders()
    {
        try
        {
            var userId = GetCurrentUserId();
            System.Diagnostics.Debug.WriteLine($"📥 GetUserOrders called. Extracted UserId: {userId}");
            
            if (userId == 0)
            {
                System.Diagnostics.Debug.WriteLine($"❌ GetUserOrders failed: userId is 0");
                return Unauthorized(new { message = "User not found" });
            }

            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            System.Diagnostics.Debug.WriteLine($"✅ GetUserOrders succeeded. Found {orders.Count} orders for userId {userId}");

            return Ok(orders.Select(o => new
            {
                id = o.Id,
                orderNumber = o.OrderNumber,
                status = o.Status.ToString(),
                totalAmount = o.TotalAmount,
                items = o.OrderItems.Select(oi => new
                {
                    id = oi.Id,
                    productId = oi.ProductId,
                    productName = oi.Product.Name,
                    quantity = oi.Quantity,
                    unitPrice = oi.UnitPrice,
                    subtotal = oi.Quantity * oi.UnitPrice
                }).ToList(),
                orderDate = o.OrderDate,
                paidDate = o.PaidDate,
                shippedDate = o.ShippedDate,
                deliveredDate = o.DeliveredDate
            }).ToList());
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"❌ GetUserOrders exception: {ex.Message}");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific order
    /// </summary>
    [Authorize]
    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetOrder(int orderId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        return Ok(new
        {
            id = order.Id,
            orderNumber = order.OrderNumber,
            status = order.Status.ToString(),
            totalAmount = order.TotalAmount,
            items = order.OrderItems.Select(oi => new
            {
                id = oi.Id,
                productId = oi.ProductId,
                productName = oi.Product.Name,
                quantity = oi.Quantity,
                unitPrice = oi.UnitPrice,
                subtotal = oi.Quantity * oi.UnitPrice
            }).ToList(),
            orderDate = order.OrderDate,
            paidDate = order.PaidDate,
            shippedDate = order.ShippedDate,
            deliveredDate = order.DeliveredDate
        });
    }

    /// <summary>
    /// Create order from cart
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateOrder()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "User not found" });

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.CartItems.Any())
                return BadRequest(new { message = "Cart is empty" });

            // Create order
            var order = new Order
            {
                UserId = userId,
                OrderNumber = "ORD" + DateTime.UtcNow.Ticks,
                TotalAmount = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice),
                Status = OrderStatus.Pending,
                OrderDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Create order items from cart items
            foreach (var cartItem in cart.CartItems)
            {
                var orderItem = new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    Quantity = cartItem.Quantity,
                    UnitPrice = cartItem.UnitPrice
                };
                order.OrderItems.Add(orderItem);
            }

            _context.Orders.Add(order);

            // Clear cart
            _context.CartItems.RemoveRange(cart.CartItems);
            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Order created successfully",
                order = new
                {
                    id = order.Id,
                    orderNumber = order.OrderNumber,
                    status = order.Status.ToString(),
                    totalAmount = order.TotalAmount,
                    orderDate = order.OrderDate
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ CreateOrder error: {ex.Message}");
            Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = "Failed to create order", error = ex.Message });
        }
    }

    /// <summary>
    /// Update order status (admin only)
    /// </summary>
    [Authorize]
    [HttpPut("{orderId}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] UpdateOrderStatusDto dto)
    {
        // For now, allow any authenticated user to update their own orders
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        if (order == null)
            return NotFound(new { message = "Order not found" });

        if (Enum.TryParse<OrderStatus>(dto.Status, out var status))
        {
            order.Status = status;

            // Update status dates
            if (status == OrderStatus.Paid)
                order.PaidDate = DateTime.UtcNow;
            else if (status == OrderStatus.Shipped)
                order.ShippedDate = DateTime.UtcNow;
            else if (status == OrderStatus.Delivered)
                order.DeliveredDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Order status updated successfully" });
        }

        return BadRequest(new { message = "Invalid order status" });
    }

    /// <summary>
    /// Cancel order
    /// </summary>
    [Authorize]
    [HttpPut("{orderId}/cancel")]
    public async Task<IActionResult> CancelOrder(int orderId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        if (order == null)
            return NotFound(new { message = "Order not found" });

        if (order.Status != OrderStatus.Pending)
            return BadRequest(new { message = "Only pending orders can be cancelled" });

        order.Status = OrderStatus.Cancelled;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Order cancelled successfully" });
    }
}

public class UpdateOrderStatusDto
{
    public string? Status { get; set; }
}
