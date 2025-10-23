/**
 * Loading Configuration
 * Adjust these values to control loading behavior across the application
 */

export const loadingConfig = {
  // Minimum loading time in milliseconds to ensure loading state is visible to users
  // This creates a better UX by preventing too-quick loading states
  MINIMUM_LOADING_TIME: 2000, // 2 seconds

  // Maximum loading time before showing a timeout error
  // This prevents infinite loading states
  MAXIMUM_LOADING_TIME: 30000, // 30 seconds
};

/**
 * Usage in components:
 * 
 * import { loadingConfig } from '../config/loadingConfig';
 * 
 * const startTime = Date.now();
 * const response = await api.call();
 * const elapsedTime = Date.now() - startTime;
 * const remainingDelay = Math.max(0, loadingConfig.MINIMUM_LOADING_TIME - elapsedTime);
 * if (remainingDelay > 0) {
 *   await new Promise(resolve => setTimeout(resolve, remainingDelay));
 * }
 */
