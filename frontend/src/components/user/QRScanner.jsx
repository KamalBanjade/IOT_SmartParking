import React, { useState, useEffect, useRef } from 'react';
import { useParking } from '../../context/ParkingContext';
import { usersApi } from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Camera, Type, ScanLine, Loader2, X, Upload, Smartphone, CheckCircle2 } from 'lucide-react';

export default function QRScanner() {
  const { setScannedUser } = useParking();
  const [tab, setTab] = useState('upload'); 
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMounted = useRef(true);

  const handleScan = async (qrToken) => {
    if (!qrToken.trim()) return;
    setLoading(true);
    try {
      const res = await usersApi.scan(qrToken);
      if (isMounted.current) {
        setScannedUser(res.data);
        setSuccessFlash(true);
        setTimeout(() => isMounted.current && setSuccessFlash(false), 800);
        toast.success(`Verified: ${res.data.user.name}`);
        setToken('');
      }
    } catch (err) {
      toast.error('QR code not recognized');
      setScannedUser(null);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleScan(token);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const containerId = "file-reader-hidden";
    const html5QrCode = new Html5Qrcode(containerId);
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);
    } catch (err) {
      toast.error("Could not find a valid QR code in image");
    } finally {
      if (isMounted.current) setLoading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let html5QrCode = null;

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn("Scanner stop error:", e);
        }
        scannerRef.current = null;
      }
    };

    const initScanner = async () => {
      if (tab === 'camera') {
        const container = document.getElementById("reader");
        if (!container) return;
        container.innerHTML = ""; 

        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              if (!loading && !successFlash) {
                handleScan(decodedText);
              }
            }
          );
        } catch (err) {
          console.warn("Camera failed:", err);
        }
      }
    };

    if (tab === 'camera') {
      initScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMounted.current = false;
      stopScanner();
    };
  }, [tab]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden group/scanner">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-customer/5 blur-3xl pointer-events-none" />
      
      {/* Integrated Tab Bar */}
      <div className="flex bg-[var(--bg-elevated)]/50 rounded-2xl p-1 mb-4 border border-[var(--bg-border)]/50">
        <TabButton 
          active={tab === 'upload'} 
          onClick={() => setTab('upload')} 
          icon={<Upload className="w-4 h-4" />} 
          label="File"
        />
        <TabButton 
          active={tab === 'camera'} 
          onClick={() => setTab('camera')} 
          icon={<Camera className="w-4 h-4" />} 
          label="Live"
        />
        <TabButton 
          active={tab === 'manual'} 
          onClick={() => setTab('manual')} 
          icon={<Type className="w-4 h-4" />} 
          label="Token"
        />
      </div>
      
      <div className="min-h-[220px] flex flex-col justify-center relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-[var(--bg-surface)]/60 backdrop-blur-[4px] flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-customer animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-customer">Processing</span>
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <div 
            className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--bg-border)] rounded-[2rem] p-10 hover:border-customer/50 hover:bg-customer/5 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current.click()}
          >
            <div className="w-16 h-16 bg-customer/10 text-customer rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-[var(--text-primary)]">Upload Member QR</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-bold uppercase tracking-widest opacity-60">PNG, JPG or SVG</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
            <div id="file-reader-hidden" className="hidden"></div>
          </div>
        )}

        {tab === 'camera' && (
          <div className="relative">
            <div className={`rounded-[2rem] overflow-hidden border-2 transition-all duration-700 bg-black relative shadow-xl ${successFlash ? 'border-available' : 'border-[var(--bg-border)] group-hover/scanner:border-customer/30'}`}>
               <div id="reader" className="w-full aspect-square"></div>
               {successFlash && (
                 <div className="absolute inset-0 bg-available/20 flex items-center justify-center animate-in fade-in duration-300">
                    <CheckCircle2 className="w-16 h-16 text-available drop-shadow-2xl" />
                 </div>
               )}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2.5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-customer opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-customer"></span>
              </span>
              Camera Monitoring Active
            </div>
          </div>
        )}

        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 px-2">
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-1">Manual Verification</label>
              <input
                type="text"
                autoFocus
                className="w-full bg-[var(--bg-elevated)] border-2 border-[var(--bg-border)] rounded-2xl h-14 px-5 text-sm font-black text-[var(--text-primary)] focus:border-customer focus:outline-none transition-all placeholder:text-[var(--text-muted)]/30 tracking-widest"
                placeholder="TOKEN"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full h-14 bg-customer hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-customer/20 disabled:opacity-50 active:scale-95"
            >
              Verify Identity
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-[var(--bg-surface)] text-customer shadow-sm font-bold border border-[var(--bg-border)]/30' 
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
      }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{label}</span>
    </button>
  );
}
