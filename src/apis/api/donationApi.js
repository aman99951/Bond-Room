import { apiClient } from './client.js';

export const donationApi = {
  createRazorpayOrder: (payload) => apiClient.post('/donations/razorpay/order/', payload, { auth: false }),
  verifyRazorpayPayment: (payload) => apiClient.post('/donations/razorpay/verify/', payload, { auth: false }),
};
