import React, { useState, useEffect, useRef } from 'react';
import { useParking } from '../../context/ParkingContext';
import { sessionsApi, paymentsApi, usersApi } from '../../services/api';
import toast from 'react-hot-toast';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { X, CheckCircle, Loader2, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function PaymentModal() {
  const { activeModal, closeModal, selectedSlot, scannedUser, setScannedUser, socket } = useParking();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('cash');
  const [applyDiscount, setApplyDiscount] = useState(true);
  
  // QR states
  const [qrUrl, setQrUrl] = useState(null);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [qrStatus, setQrStatus] = useState('idle'); // idle | loading | showing | confirmed | expired | error
  const [qrTimeLeft, setQrTimeLeft] = useState(300); // 5 min expiry
  
  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (activeModal === 'payment' && selectedSlot) {
      setLoading(true);
      setSuccessData(null);
      setQrStatus('idle');
      setQrUrl(null);
      setCurrentPaymentId(null);
      
      sessionsApi.getBySlot(selectedSlot.id)
        .then(async (res) => {
          const sessionData = res.data;
          setSession(sessionData);
          
          if (sessionData.user_id && !scannedUser) {
            try {
              const userRes = await usersApi.getById(sessionData.user_id);
              const pointsRes = await usersApi.getPointsSummary(sessionData.user_id);
              setScannedUser({
                user: userRes.data,
                pointsSummary: pointsRes.data
              });
            } catch (err) {
              console.error("Failed to fetch user data for session:", err);
            }
          }
          
          setLoading(false);
        })
        .catch(err => {
          toast.error("Failed to load session data");
          closeModal();
        });
    }
  }, [activeModal, selectedSlot, closeModal, scannedUser, setScannedUser]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && activeModal === 'payment') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeModal, closeModal]);

  // Socket listener for payment confirmation
  useEffect(() => {
    if (!socket || !currentPaymentId) return;

    const handlePaymentConfirmed = (data) => {
      if (data.paymentId === currentPaymentId) {
        onPaymentConfirmed(data);
      }
    };

    socket.on('paymentConfirmed', handlePaymentConfirmed);
    return () => {
      socket.off('paymentConfirmed', handlePaymentConfirmed);
    };
  }, [socket, currentPaymentId]);

  // Cleanup polling and timers on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (activeModal !== 'payment' || !selectedSlot) return null;

  const onPaymentConfirmed = (data) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setQrStatus('confirmed');
    setSuccessData({
      amountReceived: data.amount,
      method: data.method,
      pointsEarned: data.pointsAwarded || 0,
      newBalance: scannedUser ? (scannedUser.pointsSummary.total - (applyDiscount ? 50 : 0) + (data.pointsAwarded || 0)) : 0
    });

    setTimeout(() => {
      setScannedUser(null);
      closeModal();
    }, 4000);
  };

  const handleKhaltiClick = async (pendingPayment) => {
    try {
      setQrStatus('loading');

      const res = await paymentsApi.initiateKhalti(pendingPayment.id);
      const { paymentUrl } = res.data;

      setQrUrl(paymentUrl);
      setCurrentPaymentId(pendingPayment.id);
      startQrFlow();
    } catch (err) {
      setQrStatus('error');
      toast.error('Failed to initiate Khalti payment');
    }
  };

  const handleEsewaClick = async (pendingPayment) => {
    try {
      setQrStatus('loading');
      
      // QR URL points to our frontend redirect page
      const paymentUrl = `${window.location.origin}/payment/esewa/pay?payment_id=${pendingPayment.id}`;
      
      setQrUrl(paymentUrl);
      setCurrentPaymentId(pendingPayment.id);
      startQrFlow();
    } catch (err) {
      setQrStatus('error');
      toast.error('Failed to initiate eSewa payment');
    }
  };

  const startQrFlow = () => {
    setQrStatus('showing');
    setQrTimeLeft(300);

    // Start countdown timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setQrTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setQrStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling for payment status
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        if (!currentPaymentId) return;
        const statusRes = await paymentsApi.getStatus(currentPaymentId);
        if (statusRes.data.status === 'paid') {
          onPaymentConfirmed({
            paymentId: currentPaymentId,
            amount: statusRes.data.amount,
            method: method,
            pointsAwarded: Math.floor(statusRes.data.amount / 10),
            memberName: scannedUser?.user?.name || null
          });
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 3000);
  };

  const handleManualExitAndPay = async () => {
    try {
      setLoading(true);

      // End the session and get (or reuse) the payment record.
      // The backend is idempotent: it won't double-end or double-charge.
      const exitRes = await sessionsApi.exit({ slotId: selectedSlot.id });
      const { session: exitedSession, payment: pendingPayment } = exitRes.data;

      if (pendingPayment.status === 'paid') {
        toast.success("Session already paid!");
        onPaymentConfirmed({
          paymentId: pendingPayment.id,
          sessionId: exitedSession?.id,
          slotId: selectedSlot.id,
          slotLabel: selectedSlot.label,
          amount: pendingPayment.amount,
          method: pendingPayment.method || 'cash',
          pointsAwarded: 0
        });
        return;
      }

      // Apply loyalty discount if available
      let discountAmount = 0;
      if (scannedUser?.pointsSummary?.discountAvailable && applyDiscount && exitedSession?.id) {
        try {
          const discountRes = await usersApi.applyDiscount(scannedUser.user.id, exitedSession.id);
          discountAmount = discountRes.data.discountAmount || 0;
          if (discountAmount > 0) toast.success(`NPR ${discountAmount} discount applied`);
        } catch (discErr) {
          console.warn('Discount apply failed:', discErr);
        }
      }

      if (method === 'esewa') {
        setLoading(false);
        handleEsewaClick(pendingPayment);
        return;
      }

      if (method === 'khalti') {
        setLoading(false);
        handleKhaltiClick(pendingPayment);
        return;
      }

      // Process Cash Payment
      const payRes = await paymentsApi.pay(pendingPayment.id, method, discountAmount);

      setSuccessData({
        amountReceived: Math.max(0, (pendingPayment.amount || 0) - discountAmount),
        method,
        pointsEarned: payRes.data.pointsAwarded || 0,
        newBalance: scannedUser
          ? (scannedUser.pointsSummary.total - (discountAmount > 0 ? 50 : 0) + (payRes.data.pointsAwarded || 0))
          : 0
      });

      setTimeout(() => {
        setScannedUser(null);
        closeModal();
      }, 4000);

    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Payment processing failed';
      // If the session is already paid, show a friendly message instead of an error
      if (err.response?.status === 400 && msg.toLowerCase().includes('already')) {
        toast.success('This session is already paid!');
        closeModal();
      } else {
        toast.error(msg);
      }
      setLoading(false);
    }
  };

  const handleDone = () => {
    setScannedUser(null);
    closeModal();
  };

  const renderDuration = (entry, exit) => {
    if (!entry) return '0m';
    const end = exit ? new Date(exit) : new Date();
    const mins = differenceInMinutes(end, new Date(entry));
    const hrs = differenceInHours(end, new Date(entry));
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const calculateOriginalAmount = (entry, exit) => {
    if (!entry) return 0;
    const end = exit ? new Date(exit) : new Date();
    const mins = differenceInMinutes(end, new Date(entry));
    const hrs = Math.max(1, Math.ceil(mins / 60));
    return hrs * 30; // 30 NPR per hour
  };

  const originalAmount = session?.amountDue || calculateOriginalAmount(session?.entry_time, session?.exit_time);
  const discountAvailable = scannedUser?.pointsSummary?.discountAvailable;
  const finalAmount = Math.max(0, originalAmount - (discountAvailable && applyDiscount ? 25 : 0));

  if (successData || qrStatus === 'confirmed') {
    const dataToShow = successData || { amountReceived: finalAmount, method: 'khalti', pointsEarned: 0 };
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-sm w-full p-6 relative shadow-2xl text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-status-available/10 mb-4">
            <CheckCircle className="h-6 w-6 text-status-available" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Payment Complete</h2>
          <p className="text-sm text-text-secondary mb-6">
            NPR {dataToShow.amountReceived} received &middot; {dataToShow.method.charAt(0).toUpperCase() + dataToShow.method.slice(1)}
          </p>
          
          <div className="border-t border-b border-bg-elevated py-4 mb-6">
            <p className="text-base font-bold text-text-primary mb-1">
              <span className="text-amber-400 mr-2">🎉</span>
              +{dataToShow.pointsEarned} points earned
            </p>
            {dataToShow.newBalance !== undefined && (
              <p className="text-xs text-text-muted">
                New balance: {dataToShow.newBalance} points
              </p>
            )}
          </div>
          
          {dataToShow.method === 'khalti' && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-status-available/10 text-status-available text-xs font-semibold rounded-full">
                ✓ Paid via Khalti
              </span>
            </div>
          )}
          
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

  const renderQrState = () => {
    if (qrStatus === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-text-secondary">Generating payment QR...</p>
        </div>
      );
    }
    
    if (qrStatus === 'showing') {
      const mins = Math.floor(qrTimeLeft / 60);
      const secs = qrTimeLeft % 60;
      const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
      const isEsewa = method === 'esewa';
      
      return (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="flex items-center gap-3">
             <img src={isEsewa ? "/Images/esewa.png" : "/Images/khalti.png"} alt={method} className="h-6 object-contain" />
             <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Scan to Pay with {method}</p>
          </div>
          
          <div className="bg-white p-4 rounded-[2rem] inline-block shadow-2xl border-4 border-[var(--bg-elevated)]">
            <QRCodeCanvas value={qrUrl} size={220} level="H" includeMargin={false} />
          </div>
          
          <div className="bg-[var(--bg-elevated)]/50 px-6 py-4 rounded-2xl border border-[var(--bg-border)] w-full">
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Payable Amount</p>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-1 font-mono">NPR {finalAmount.toFixed(2)}</p>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-2">⏱ Session Expires in {timeString}</p>
            <div className="flex items-center gap-2 mt-4 bg-available/10 px-4 py-2 rounded-full border border-available/20">
              <div className="w-2 h-2 rounded-full bg-available animate-pulse"></div>
              <p className="text-[10px] text-available font-black uppercase tracking-widest">Listening for transaction...</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              if (pollingRef.current) clearInterval(pollingRef.current);
              setQrStatus('idle');
            }}
            className="text-[10px] font-black text-[var(--text-muted)] hover:text-accent uppercase tracking-widest transition-colors mt-4"
          >
            &larr; Switch Payment Method
          </button>
        </div>
      );
    }

    if (qrStatus === 'expired') {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-[200px] h-[200px] bg-bg-elevated rounded-xl flex flex-col items-center justify-center">
            <p className="text-sm text-text-muted mb-2">QR Expired</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setQrStatus('idle');
              }}
              className="text-xs text-text-secondary hover:text-text-primary border border-bg-border px-3 py-1.5 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleManualExitAndPay()}
              className="text-xs text-white bg-accent hover:bg-blue-600 px-3 py-1.5 rounded-lg"
            >
              Generate New QR
            </button>
          </div>
        </div>
      );
    }
    
    if (qrStatus === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <p className="text-sm text-status-occupied">Failed to generate QR</p>
          <button 
            onClick={() => setQrStatus('idle')}
            className="text-xs text-text-secondary border border-bg-border px-3 py-1.5 rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return null;
  };

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
          <div className="py-8 text-center text-text-muted text-sm">Processing session...</div>
        ) : !session ? (
          <div className="py-8 text-center text-status-occupied text-sm">No active session found.</div>
        ) : qrStatus !== 'idle' ? (
          renderQrState()
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
                <span className="text-sm font-medium text-text-primary">{renderDuration(session.entry_time, session.exit_time)}</span>
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
                  className={`py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${method === 'cash' ? 'border-2 border-accent text-accent bg-accent/5' : 'border border-bg-border text-text-muted bg-bg-elevated/30 hover:bg-bg-border'}`}
                >
                  Cash
                </button>
                <button 
                  onClick={() => setMethod('khalti')}
                  className={`p-2 rounded-lg transition-all relative flex items-center justify-center h-14 ${method === 'khalti' ? 'border-2 border-[#5c2d91] bg-[#5c2d91]/5' : 'border border-bg-border bg-bg-elevated/30 hover:bg-bg-border'}`}
                >
                  <img src="/Images/khalti.png" alt="Khalti" className="h-8 object-contain" />
                </button>
                <button 
                  onClick={() => setMethod('esewa')}
                  className={`p-2 rounded-lg transition-all relative flex items-center justify-center h-14 ${method === 'esewa' ? 'border-2 border-[#60bb46] bg-[#60bb46]/5' : 'border border-bg-border bg-bg-elevated/30 hover:bg-bg-border'}`}
                >
                  <img src="/Images/esewa.png" alt="eSewa" className="h-8 object-contain" />
                </button>
              </div>
            </div>

            <button 
              onClick={handleManualExitAndPay}
              disabled={loading}
              className={`w-full h-10 text-white text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 ${method === 'esewa' ? 'bg-[#60bb46] hover:bg-[#52a13b]' : 'bg-accent hover:bg-blue-600'}`}
            >
              {method === 'cash' ? 'Confirm Payment' : 'Continue to Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
