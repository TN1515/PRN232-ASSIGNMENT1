using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ECommerceApp.API.Data;
using ECommerceApp.API.DTOs;
using ECommerceApp.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("id");
        return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
    }

    /// <summary>
    /// Get current user's cart
    /// </summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            // Create empty cart for new user
            cart = new Cart { UserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            id = cart.Id,
            items = cart.CartItems.Select(ci => new
            {
                id = ci.Id,
                productId = ci.ProductId,
                product = new
                {
                    id = ci.Product.Id,
                    name = ci.Product.Name,
                    price = ci.Product.Price,
                    image = ci.Product.Image
                },
                quantity = ci.Quantity,
                unitPrice = ci.UnitPrice,
                subtotal = ci.Quantity * ci.UnitPrice,
                addedAt = ci.AddedAt
            }).ToList(),
            total = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice),
            createdAt = cart.CreatedAt,
            updatedAt = cart.UpdatedAt
        });
    }

    /// <summary>
    /// Add item to cart
    /// </summary>
    [Authorize]
    [HttpPost("items")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
    {
        if (dto.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be greater than 0" });

        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
            return NotFound(new { message = "Product not found" });

        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart { UserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == dto.ProductId);
        CartItem cartItem;
        
        if (existingItem != null)
        {
            existingItem.Quantity += dto.Quantity;
            cartItem = existingItem;
        }
        else
        {
            cartItem = new CartItem
            {
                CartId = cart.Id,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                UnitPrice = product.Price,
                AddedAt = DateTime.UtcNow
            };
            _context.CartItems.Add(cartItem);
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Return the cart item with product details
        return Ok(new
        {
            id = cartItem.Id,
            cartId = cartItem.CartId,
            productId = cartItem.ProductId,
            product = new
            {
                id = product.Id,
                name = product.Name,
                price = product.Price,
                image = product.Image
            },
            quantity = cartItem.Quantity,
            unitPrice = cartItem.UnitPrice,
            addedAt = cartItem.AddedAt
        });
    }

    /// <summary>
    /// Update cart item quantity
    /// </summary>
    [Authorize]
    [HttpPut("items/{itemId}")]
    public async Task<IActionResult> UpdateCartItem(int itemId, [FromBody] UpdateCartItemDto dto)
    {
        if (dto.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be greater than 0" });

        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Cart.UserId == userId);

        if (cartItem == null)
            return NotFound(new { message = "Cart item not found" });

        cartItem.Quantity = dto.Quantity;
        cartItem.Cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cart item updated successfully" });
    }

    /// <summary>
    /// Remove item from cart
    /// </summary>
    [Authorize]
    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> RemoveFromCart(int itemId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Cart.UserId == userId);

        if (cartItem == null)
            return NotFound(new { message = "Cart item not found" });

        _context.CartItems.Remove(cartItem);
        cartItem.Cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Item removed from cart successfully" });
    }

    /// <summary>
    /// Clear cart
    /// </summary>
    [Authorize]
    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { message = "User not found" });

        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return NotFound(new { message = "Cart not found" });

        _context.CartItems.RemoveRange(cart.CartItems);
        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cart cleared successfully" });
    }
}

public class AddToCartDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateCartItemDto
{
    public int Quantity { get; set; }
}
