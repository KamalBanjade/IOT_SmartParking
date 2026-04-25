import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsApi } from '../services/api';
import Navbar from '../components/shared/Navbar';
import { CheckCircle, XCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [paymentData, setPaymentData] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    const pendingStr = localStorage.getItem('pendingPayment');
    
    if (!pidx || !pendingStr) {
      setStatus('error');
      return;
    }

    const pending = JSON.parse(pendingStr);
    
    const verify = async () => {
      try {
        const res = await paymentsApi.verifyKhalti({ 
          pidx, 
          paymentId: pending.paymentId 
        });
        
        if (res.data.success) {
          setPaymentData({
            ...pending,
            pointsEarned: res.data.pointsAwarded,
            transactionId: pidx // pidx is often used as ref
          });
          setStatus('success');
          localStorage.removeItem('pendingPayment');
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

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-md w-full p-8 shadow-2xl">
          
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-text-primary">Confirming Payment...</h2>
              <p className="text-sm text-text-secondary mt-2">We are verifying your transaction with Khalti.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-status-available/10 mb-6 scale-animation">
                <CheckCircle className="h-10 w-10 text-status-available" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Confirmed</h2>
              <p className="text-sm text-text-secondary mb-8">Your parking session has been successfully settled.</p>
              
              <div className="space-y-3 bg-bg-base/50 rounded-xl p-5 mb-8 border border-bg-elevated">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Amount</span>
                  <span className="text-text-primary font-medium">NPR {paymentData?.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Method</span>
                  <span className="text-text-primary font-medium">Khalti</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Transaction ID</span>
                  <span className="text-text-primary font-mono text-[10px] truncate ml-4">{paymentData?.transactionId}</span>
                </div>
                {paymentData?.pointsEarned > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-bg-elevated">
                    <span className="text-text-muted">Points Earned</span>
                    <span className="text-amber-400 font-bold">★ +{paymentData?.pointsEarned}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/')}
                  className="h-11 bg-accent hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Return to Dashboard
                </button>
                <p className="text-[10px] text-text-muted">Redirecting in {countdown}s...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-status-occupied/10 mb-6">
                <XCircle className="h-10 w-10 text-status-occupied" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Failed</h2>
              <p className="text-sm text-text-secondary mb-8">
                Session expired or verification failed. Please try again or pay with cash at reception.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/')}
                  className="h-11 bg-bg-elevated hover:bg-bg-border text-text-primary font-medium rounded-xl border border-bg-border transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .scale-animation {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
