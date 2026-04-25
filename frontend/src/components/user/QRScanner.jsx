import React, { useState, useEffect, useRef } from 'react';
import { useParking } from '../../context/ParkingContext';
import { usersApi } from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Camera, Type, Upload } from 'lucide-react';

export default function QRScanner() {
  const { setScannedUser } = useParking();
  const [tab, setTab] = useState('camera'); 
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
        setTimeout(() => isMounted.current && setSuccessFlash(false), 1000);
        toast.success(`Member identified: ${res.data.user.name}`);
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
    const html5QrCode = new Html5Qrcode("file-reader-hidden");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);
    } catch (err) {
      toast.error("Could not find a valid QR code");
    } finally {
      if (isMounted.current) setLoading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let html5QrCode = null;

    const initScanner = async () => {
      if (tab === 'camera') {
        // Double check if container exists
        const container = document.getElementById("reader");
        if (!container) return;
        container.innerHTML = ""; // Hard clear

        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
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

    initScanner();

    return () => {
      isMounted.current = false;
      if (html5QrCode) {
        const cleanup = async () => {
          try {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
            html5QrCode.clear();
            const container = document.getElementById("reader");
            if (container) container.innerHTML = "";
          } catch (e) {
            console.error("Cleanup error", e);
          }
        };
        cleanup();
      }
    };
  }, [tab]);

  return (
    <div>
      <div className="px-5 py-3 border-b border-bg-border flex justify-between items-center">
        <h3 className="text-[10px] uppercase tracking-widest text-text-muted">
          QR Service
        </h3>
        <div className="flex bg-bg-elevated p-1 rounded-lg">
          <button 
            onClick={() => setTab('camera')}
            className={`p-1.5 rounded transition-all ${tab === 'camera' ? 'bg-bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            title="Use Camera"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setTab('upload')}
            className={`p-1.5 rounded transition-all ${tab === 'upload' ? 'bg-bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            title="Upload Image"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setTab('manual')}
            className={`p-1.5 rounded transition-all ${tab === 'manual' ? 'bg-bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            title="Manual Entry"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="p-5 min-h-[180px] flex flex-col justify-center">
        {tab === 'camera' && (
          <div className="relative">
            {/* We wrap reader in a container that we can absolutely control */}
            <div className="rounded-xl overflow-hidden border-2 border-bg-border bg-black relative">
               <div id="reader" className="w-full"></div>
               {successFlash && (
                 <div className="absolute inset-0 bg-status-available/20 animate-pulse pointer-events-none"></div>
               )}
            </div>
            <p className="text-center text-[10px] text-text-muted mt-3">Camera View Active</p>
          </div>
        )}

        {tab === 'upload' && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-bg-border rounded-xl p-8 hover:border-accent transition-colors cursor-pointer"
               onClick={() => fileInputRef.current.click()}>
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs text-text-primary font-medium">Upload QR Image</p>
            <p className="text-[10px] text-text-muted mt-1">PNG, JPG or SVG</p>
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

        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase tracking-tighter">Enter Token Manually</label>
              <input
                type="text"
                autoFocus
                className="w-full bg-bg-base border border-bg-border rounded-lg h-10 px-3 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
                placeholder="16-character token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full h-10 bg-text-primary text-bg-base hover:bg-text-secondary text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Identity"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
