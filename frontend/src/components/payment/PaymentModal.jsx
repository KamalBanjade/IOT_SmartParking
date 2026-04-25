import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { sessionsApi, paymentsApi, usersApi } from '../../services/api';
import toast from 'react-hot-toast';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { X, CheckCircle } from 'lucide-react';

export default function PaymentModal() {
  const { activeModal, closeModal, selectedSlot, scannedUser, setScannedUser } = useParking();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('cash');
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (activeModal === 'payment' && selectedSlot) {
      setLoading(true);
      setSuccessData(null);
      sessionsApi.getBySlot(selectedSlot.id)
        .then(res => setSession(res.data))
        .catch(err => {
          console.error(err);
          toast.error("Could not fetch active session");
          closeModal();
        })
        .finally(() => setLoading(false));
    }
  }, [activeModal, selectedSlot, closeModal]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && activeModal === 'payment') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeModal, closeModal]);

  if (activeModal !== 'payment' || !selectedSlot) return null;

  const handleManualExitAndPay = async () => {
    try {
      // 1. Exit session to calculate final amount
      const exitRes = await sessionsApi.exit({ slotId: selectedSlot.id });
      const { payment: pendingPayment } = exitRes.data;
      
      let discountAmount = 0;
      // 2. Apply discount if requested and available
      if (scannedUser?.pointsSummary?.discountAvailable && applyDiscount) {
        const discountRes = await usersApi.applyDiscount(scannedUser.user.id, selectedSlot.id);
        discountAmount = discountRes.data.discountAmount;
        toast.success(`NPR ${discountAmount} discount applied`);
      }
      
      if (method === 'khalti') {
        setLoading(true);
        toast.loading("Redirecting to Khalti...");
        
        // Store info for success page
        localStorage.setItem('pendingPayment', JSON.stringify({
          paymentId: pendingPayment.id,
          slotLabel: selectedSlot.label,
          amount: pendingPayment.amount - discountAmount,
          memberName: scannedUser?.user?.name || null,
          appliedDiscount: discountAmount
        }));
        
        const res = await paymentsApi.initiateKhalti(pendingPayment.id);
        window.location.href = res.data.paymentUrl;
        return;
      }

      // 3. Process Cash Payment
      const payRes = await paymentsApi.pay(pendingPayment.id, method, discountAmount);
      
      setSuccessData({
        amountReceived: Math.max(0, pendingPayment.amount - discountAmount),
        method,
        pointsEarned: payRes.data.pointsAwarded || 0,
        newBalance: scannedUser ? (scannedUser.pointsSummary.total - (discountAmount ? 50 : 0) + (payRes.data.pointsAwarded || 0)) : 0
      });
      
      setTimeout(() => {
        setScannedUser(null);
        closeModal();
      }, 4000);

    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.error || "Payment processing failed");
      setLoading(false);
    }
  };

  const handleDone = () => {
    setScannedUser(null);
    closeModal();
  };

  const renderDuration = (entry) => {
    if (!entry) return '0m';
    const mins = differenceInMinutes(new Date(), new Date(entry));
    const hrs = differenceInHours(new Date(), new Date(entry));
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const calculateOriginalAmount = (entry) => {
    if (!entry) return 0;
    const mins = differenceInMinutes(new Date(), new Date(entry));
    const hrs = Math.max(1, Math.ceil(mins / 60));
    return hrs * 30; // 30 NPR per hour
  };

  const originalAmount = calculateOriginalAmount(session?.entry_time);
  const discountAvailable = scannedUser?.pointsSummary?.discountAvailable;
  const finalAmount = Math.max(0, originalAmount - (discountAvailable && applyDiscount ? 25 : 0));

  if (successData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-sm w-full p-6 relative shadow-2xl text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-status-available/10 mb-4">
            <CheckCircle className="h-6 w-6 text-status-available" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Payment Complete</h2>
          <p className="text-sm text-text-secondary mb-6">
            NPR {successData.amountReceived} received &middot; {successData.method.charAt(0).toUpperCase() + successData.method.slice(1)}
          </p>
          
          <div className="border-t border-b border-bg-elevated py-4 mb-6">
            <p className="text-base font-bold text-text-primary mb-1">
              <span className="text-amber-400 mr-2">🎉</span>
              +{successData.pointsEarned} points earned
            </p>
            {scannedUser && (
              <p className="text-xs text-text-muted">
                New balance: {successData.newBalance} points
              </p>
            )}
          </div>
          
          <button 
            onClick={handleDone}
            className="w-full h-10 border border-bg-border hover:border-accent text-text-primary text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-sm w-full p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={closeModal} className="absolute right-5 top-5 text-text-muted hover:text-text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <h2 className="text-base font-semibold text-text-primary">Process Payment</h2>
          {scannedUser && (
            <p className="text-xs text-text-secondary mt-1">Member: {scannedUser.user.name}</p>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-text-muted text-sm">Loading session...</div>
        ) : !session ? (
          <div className="py-8 text-center text-status-occupied text-sm">No active session found.</div>
        ) : (
          <div className="space-y-6">
            
            {discountAvailable && (
              <div className="bg-status-available/10 border border-status-available/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xs font-medium text-status-available">🎉 Discount available: -NPR 25</span>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={applyDiscount} onChange={() => setApplyDiscount(!applyDiscount)} />
                    <div className={`block w-8 h-5 rounded-full transition-colors ${applyDiscount ? 'bg-status-available' : 'bg-bg-border'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${applyDiscount ? 'transform translate-x-3' : ''}`}></div>
                  </div>
                </label>
              </div>
            )}

            <div className="space-y-0">
              <div className="flex justify-between items-center border-b border-bg-elevated py-2.5">
                <span className="text-xs text-text-secondary">Slot</span>
                <span className="text-sm font-medium text-text-primary">{selectedSlot.label}</span>
              </div>
              <div className="flex justify-between items-center border-b border-bg-elevated py-2.5">
                <span className="text-xs text-text-secondary">Duration</span>
                <span className="text-sm font-medium text-text-primary">{renderDuration(session.entry_time)}</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-xs text-text-secondary">Amount Due</span>
                <div className="text-right">
                  {discountAvailable && applyDiscount && (
                    <span className="text-xs text-text-muted line-through mr-2">NPR {originalAmount}</span>
                  )}
                  <span className="text-xl font-bold text-text-primary">NPR {finalAmount}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-text-muted uppercase tracking-wide mb-3">Payment Method</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMethod('cash')}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${method === 'cash' ? 'border border-accent text-text-primary bg-bg-elevated' : 'border border-bg-border text-text-secondary bg-bg-elevated hover:bg-bg-border'}`}
                >
                  Cash
                </button>
                <button 
                  onClick={() => setMethod('khalti')}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors relative ${method === 'khalti' ? 'border border-accent text-text-primary bg-bg-elevated' : 'border border-bg-border text-text-secondary bg-bg-elevated hover:bg-bg-border'}`}
                >
                  Khalti
                </button>
              </div>
            </div>

            <button 
              onClick={handleManualExitAndPay}
              disabled={loading}
              className="w-full h-10 bg-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (method === 'khalti' ? 'Pay with Khalti' : 'Confirm Payment')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
