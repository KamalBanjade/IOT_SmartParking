import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSocket } from '../../hooks/useSocket';
import { portalApi } from '../../services/api';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function KhaltiSelfPay({ paymentId, amount, slotLabel, onSuccess, onCancel }) {
  const { socket } = useSocket();
  
  const [status, setStatus] = useState('idle'); // idle | loading | showing | confirmed | expired | error
  const [qrUrl, setQrUrl] = useState(null);
  const [activePaymentId, setActivePaymentId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [confirmedData, setConfirmedData] = useState(null);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    initiate();
  }, [paymentId]);

  async function initiate() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);

    setStatus('loading');
    try {
      const res = await portalApi.initiatePayment(paymentId);
      const { payment_url, paymentId: pid } = res.data;

      setQrUrl(payment_url);
      setActivePaymentId(pid);
      setStatus('showing');
      setTimeLeft(300);

      // Countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(pollRef.current);
            setStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Polling fallback
      pollRef.current = setInterval(async () => {
        try {
          const s = await portalApi.getPaymentStatus(pid);
          if (s.data.status === 'paid') {
            handleConfirmed({
              paymentId: pid,
              amount: s.data.amount,
              method: 'khalti',
              pointsAwarded: Math.floor(s.data.amount / 10)
            });
          }
        } catch(e) {}
      }, 3000);

    } catch(e) {
      setStatus('error');
    }
  }

  // Socket.IO — listen for paymentConfirmed
  useEffect(() => {
    if (!socket || status !== 'showing') return;

    const handleSocketPaymentConfirmed = (data) => {
      if (data.paymentId === activePaymentId) {
        handleConfirmed(data);
      }
    };

    socket.on('paymentConfirmed', handleSocketPaymentConfirmed);

    return () => socket.off('paymentConfirmed', handleSocketPaymentConfirmed);
  }, [socket, status, activePaymentId]);

  function handleConfirmed(data) {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setConfirmedData(data);
    setStatus('confirmed');
    setTimeout(() => {
      if (onSuccess) onSuccess(data);
    }, 2000);
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-t border-bg-border bg-bg-surface/50">
        <Loader2 className="w-6 h-6 text-accent animate-spin mb-2" />
        <p className="text-sm text-text-secondary">Generating payment QR...</p>
      </div>
    );
  }

  if (status === 'showing') {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

    return (
      <div className="flex flex-col items-center text-center p-6 border-t border-bg-border bg-bg-surface/50">
        <p className="text-sm font-medium text-text-primary mb-4">Scan with Khalti App</p>
        
        <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
          <QRCodeCanvas value={qrUrl} size={180} level="M" includeMargin={false} />
        </div>
        
        <p className="text-2xl font-bold text-text-primary mb-2">NPR {amount}</p>
        
        <div className="flex flex-col items-center gap-1 mb-4">
          <p className="text-xs text-text-muted font-mono">⏱ Expires in {timeString}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full bg-status-available animate-pulse"></div>
            <p className="text-xs text-text-muted">Waiting for payment...</p>
          </div>
        </div>
        
        <button 
          onClick={onCancel}
          className="text-xs text-text-secondary hover:text-text-primary underline mt-2"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-t border-bg-border bg-bg-surface/50">
        <CheckCircle className="w-12 h-12 text-status-available mb-3" />
        <p className="text-lg font-medium text-status-available mb-2">✓ Payment Complete!</p>
        <p className="text-sm text-text-primary">NPR {confirmedData?.amount || amount} paid via Khalti</p>
        {(confirmedData?.pointsAwarded > 0) && (
          <p className="text-xs font-bold text-amber-400 mt-2">★ +{confirmedData.pointsAwarded} points earned</p>
        )}
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-t border-bg-border bg-bg-surface/50">
        <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
          <p className="text-2xl">⏳</p>
        </div>
        <p className="text-sm text-text-muted mb-4">QR expired — tap to try again</p>
        <button 
          onClick={initiate}
          className="bg-accent hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
        <button 
          onClick={onCancel}
          className="text-xs text-text-secondary hover:text-text-primary underline mt-3"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-t border-bg-border bg-bg-surface/50">
        <XCircle className="w-12 h-12 text-status-occupied mb-3" />
        <p className="text-sm text-status-occupied font-medium mb-4">Could not generate QR</p>
        <button 
          onClick={initiate}
          className="border border-bg-border hover:bg-bg-elevated text-text-primary text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
        <button 
          onClick={onCancel}
          className="text-xs text-text-secondary hover:text-text-primary underline mt-3"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null;
}
