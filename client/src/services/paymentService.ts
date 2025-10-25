import { getApiClient } from '../config/axiosClient';
import { getApiUrl } from '../config/apiConfig';

export interface PaymentLinkRequest {
  orderId: number;
  amount: number;
  orderInfo: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  description: string;
}

export interface PaymentLinkResponse {
  checkoutUrl: string;
  paymentId?: string;
}

const paymentService = {
  /**
   * Create a PayOS payment link for an order
   */
  createPaymentLink: async (data: PaymentLinkRequest): Promise<PaymentLinkResponse> => {
    try {
      console.log('💳 Creating PayOS payment link:', data);
      
      const response = await getApiClient().post(
        getApiUrl('/payment/create-payment-link'),
        data
      );
      
      console.log('✅ Payment link created:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('❌ Failed to create payment link:', err);
      throw err;
    }
  },

  /**
   * Verify payment webhook
   */
  verifyPayment: async (paymentId: string): Promise<any> => {
    try {
      console.log('🔐 Verifying payment:', paymentId);
      
      const response = await getApiClient().get(
        getApiUrl(`/payment/verify/${paymentId}`)
      );
      
      console.log('✅ Payment verified:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('❌ Failed to verify payment:', err);
      throw err;
    }
  },

  /**
   * Check payment status
   */
  checkPaymentStatus: async (orderId: number): Promise<any> => {
    try {
      console.log('📊 Checking payment status:', orderId);
      
      const response = await getApiClient().get(
        getApiUrl(`/payment/status/${orderId}`)
      );
      
      console.log('✅ Payment status:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('❌ Failed to check payment status:', err);
      throw err;
    }
  },

  /**
   * Cancel payment
   */
  cancelPayment: async (paymentId: string): Promise<any> => {
    try {
      console.log('❌ Cancelling payment:', paymentId);
      
      const response = await getApiClient().post(
        getApiUrl(`/payment/cancel/${paymentId}`)
      );
      
      console.log('✅ Payment cancelled:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('❌ Failed to cancel payment:', err);
      throw err;
    }
  },
};

export default paymentService;
