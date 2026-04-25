import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import { XCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-status-occupied/10 mb-6">
            <XCircle className="h-10 w-10 text-status-occupied" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Cancelled</h2>
          <p className="text-sm text-text-secondary mb-8">
            The payment process was interrupted. You can try again or settle the payment via cash.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="h-11 bg-accent hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/')}
              className="h-11 bg-bg-elevated hover:bg-bg-border text-text-primary font-medium rounded-xl border border-bg-border transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
