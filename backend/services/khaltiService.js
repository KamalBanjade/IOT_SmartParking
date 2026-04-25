import axios from 'axios';

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

const khaltiApi = axios.create({
  baseURL: KHALTI_BASE_URL,
  headers: {
    'Authorization': `Key ${KHALTI_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Initiates a Khalti payment
 */
export async function initiatePayment(paymentId, amount, slotLabel, customerInfo) {
  try {
    const payload = {
      return_url: `${FRONTEND_URL}/payment/success`,
      website_url: FRONTEND_URL,
      amount: Math.round(amount * 100), // Convert NPR to paisa
      purchase_order_id: `SPARK-${paymentId}-${Date.now()}`,
      purchase_order_name: `Smart Parking Slot ${slotLabel}`,
      customer_info: {
        name: customerInfo.name || 'Guest Customer',
        email: customerInfo.email || 'customer@example.com',
        phone: customerInfo.phone || '9800000000'
      }
    };

    console.log('[khaltiService] Initiating payment:', payload.purchase_order_id);
    
    const response = await khaltiApi.post('initiate/', payload);
    return response.data; // Returns { pidx, payment_url, expires_at, expires_in }
  } catch (err) {
    console.error('[khaltiService] Initiate error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Verifies a Khalti payment using pidx
 */
export async function verifyPayment(pidx) {
  try {
    const response = await khaltiApi.post('lookup/', { pidx });
    return response.data; // Returns { pidx, total_amount, status, transaction_id, fee, refunded }
  } catch (err) {
    console.error('[khaltiService] Verify error:', err.response?.data || err.message);
    throw err;
  }
}
