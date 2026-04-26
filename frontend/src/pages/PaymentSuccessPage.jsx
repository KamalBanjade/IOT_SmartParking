import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentsApi } from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const verifying = React.useRef(false);

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    const poId = searchParams.get('purchase_order_id');
    const paymentId = poId ? parseInt(poId.split('-')[1], 10) : null;
    
    if (!pidx || !paymentId || verifying.current) {
      if (!verifying.current) setStatus('error');
      return;
    }

    verifying.current = true;
    const verify = async () => {
      try {
        const res = await paymentsApi.verifyKhalti({ 
          pidx, 
          paymentId 
        });
        
        if (res.data.success) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
      <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-sm w-full p-8 shadow-2xl text-center">
        
        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-text-primary">Confirming Payment...</h2>
            <p className="text-sm text-text-secondary mt-2">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-status-available/10 mb-6">
              <CheckCircle className="h-10 w-10 text-status-available" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Successful</h2>
            <p className="text-sm text-text-secondary mb-8">Your parking session has been settled.</p>
            <a 
              href="/portal/dashboard"
              className="inline-block bg-accent hover:bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Return to Dashboard
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-status-occupied/10 mb-6">
              <XCircle className="h-10 w-10 text-status-occupied" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Failed</h2>
            <p className="text-sm text-text-secondary mb-6">
              Verification failed or session expired.
            </p>
            <p className="text-sm font-semibold text-text-primary">Please check the terminal screen or contact staff.</p>
          </>
        )}

      </div>
    </div>
  );
}
