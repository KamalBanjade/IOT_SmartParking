import React, { useState } from 'react';
import { portalApi } from '../services/api';
import toast from 'react-hot-toast';

export default function CheckoutButton({ paymentId, amount, className, children }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Provide paymentId and amount to initiate
      // If we are staff side, we might use operatorApi, but this is usually portalApi.
      // Alternatively, we pass in the API function to use if needed.
      const res = await portalApi.initiateEsewa({ amount, payment_id: paymentId });
      const data = res.data;

      // eSewa requires a real HTML form POST
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.payment_url;
      
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'payment_url') return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = val;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      
    } catch (err) {
      toast.error('Failed to initiate eSewa payment');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePay} 
      disabled={loading}
      className={className || "w-full py-3 bg-[#60bb46] hover:bg-[#52a13b] text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"}
    >
      {loading ? 'Processing...' : children || 'Pay with eSewa'}
    </button>
  );
}
