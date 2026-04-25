import React, { useState } from 'react';
import Navbar from '../components/shared/Navbar';
import RegisterForm from '../components/user/RegisterForm';

export default function RegisterPage() {
  const [qrCode, setQrCode] = useState(null);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-lg">
          
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Member Registration</h1>
            <p className="text-sm text-text-secondary mt-2">Onboard a new customer to the Smart Parking rewards program.</p>
          </div>

          <div className="bg-bg-surface border border-bg-border rounded-3xl p-10 shadow-2xl shadow-black/20">
            {!qrCode ? (
              <RegisterForm onRegisterSuccess={(data) => setQrCode(data.qrCode)} />
            ) : (
              <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-status-available/10 text-status-available rounded-full flex items-center justify-center mb-6">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                
                <h3 className="text-lg font-bold text-text-primary mb-2">Registration Successful</h3>
                <p className="text-sm text-text-muted mb-8 text-center">A welcome email has been sent. Below is the unique member QR code.</p>
                
                <div className="bg-white p-6 rounded-2xl mb-8 shadow-inner">
                  <img src={qrCode} alt="Member QR Code" className="w-56 h-56 object-contain" />
                </div>
                
                <div className="flex items-center gap-6">
                  <a 
                    href={qrCode} 
                    download="member-qr.png"
                    className="flex items-center gap-2 text-sm font-bold text-accent hover:opacity-80 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download QR
                  </a>
                  <div className="w-px h-4 bg-bg-border"></div>
                  <button 
                    onClick={() => setQrCode(null)}
                    className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                  >
                    Register Another
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
