/**
 * Format price to VND currency format
 * @param price - The price amount in VND
 * @returns Formatted price string with VND currency (e.g., "1.234.567 VND")
 */
export const formatPriceVND = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0 VND';
  }

  // Format with thousand separator (.)
  const formatted = numPrice.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${formatted} VND`;
};

/**
 * Convert USD to VND (using approximate exchange rate)
 * @param usdPrice - Price in USD
 * @returns Price in VND
 */
export const usdToVnd = (usdPrice: number | string): number => {
  const numPrice = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
  // Using approximate exchange rate: 1 USD = 24,500 VND
  return Math.round(numPrice * 24500);
};

/**
 * Format USD price directly to VND
 * @param usdPrice - Price in USD
 * @returns Formatted VND string
 */
export const formatUsdToVnd = (usdPrice: number | string): string => {
  return formatPriceVND(usdToVnd(usdPrice));
};
