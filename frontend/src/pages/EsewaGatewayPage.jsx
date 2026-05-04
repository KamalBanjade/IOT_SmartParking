import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function EsewaGatewayPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paymentId) {
      setError("Missing payment ID");
      return;
    }

    const initiate = async () => {
      try {
        // We use a dynamic URL to ensure mobile devices can reach the backend
        const res = await axios.get(`http://${window.location.hostname}:3000/api/esewa/initiate-by-id/${paymentId}`);
        const data = res.data;
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

        // Exclude payment_url — it's used as form.action, not a form field.
        // Including it would send an unexpected param to eSewa, causing
        // signature mismatch and payment failure.
        const EXCLUDED_KEYS = new Set(['payment_url']);
        Object.entries(data).forEach(([key, val]) => {
          if (EXCLUDED_KEYS.has(key)) return;
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = val;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } catch (err) {
        console.error("eSewa initiation failed:", err);
        setError("Failed to connect to eSewa. Please try again.");
      }
    };

    initiate();
  }, [paymentId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-widest mb-2">Payment Error</h1>
        <p className="text-gray-400 text-sm max-w-xs">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center space-y-6 p-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-[#60bb46]/10 flex items-center justify-center animate-pulse">
           <img src="/Images/esewa.png" alt="eSewa" className="w-12 h-12 object-contain" />
        </div>
        <div className="absolute inset-0 rounded-3xl border-2 border-[#60bb46]/30 animate-ping"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-lg font-black text-white uppercase tracking-[0.3em]">eSewa Gateway</h1>
        <p className="text-[#60bb46] text-[10px] font-black uppercase tracking-widest animate-bounce">Securely Redirecting...</p>
      </div>

      <div className="max-w-xs w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Please do not close this window or press back button.</p>
      </div>
    </div>
  );
}
