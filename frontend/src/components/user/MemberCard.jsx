import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { usersApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Download, RefreshCw, Star, ShieldCheck } from 'lucide-react';

export default function MemberCard({ user, pointsSummary, onQrUpdate }) {
  if (!user || !pointsSummary) return null;

  const handleRegenerate = async () => {
    try {
      const res = await usersApi.regenerateQr(user.id);
      onQrUpdate(res.data.qrToken);
      toast.success("New QR generated");
    } catch (err) {
      toast.error("Failed to regenerate QR");
    }
  };

  const progress = Math.min(100, ((pointsSummary.total % (pointsSummary.nextRewardAt || 50)) / (pointsSummary.nextRewardAt || 50)) * 100);
  const toNext = (pointsSummary.nextRewardAt || 50) - (pointsSummary.total % (pointsSummary.nextRewardAt || 50));

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass rounded-2xl border border-border p-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-3xl font-bold text-accent mb-4">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{user.name}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{user.phone}</p>
        {user.email && <p className="text-xs text-[var(--text-muted)] mt-1">{user.email}</p>}
        
        <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-customer/10 border border-customer/20 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-customer" />
          <span className="text-[10px] font-bold text-customer uppercase tracking-wider">Verified Member</span>
        </div>
      </div>

      {/* Loyalty Card */}
      <div className="glass rounded-2xl border border-border p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Star className="w-20 h-20 text-pending" />
        </div>
        
        <div className="flex items-baseline gap-2 mb-4">
          <Star className="w-5 h-5 text-pending fill-pending" />
          <span className="text-3xl font-bold text-[var(--text-primary)] font-mono">{pointsSummary.total}</span>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Points</span>
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-700" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>{pointsSummary.total % (pointsSummary.nextRewardAt || 50)} / {pointsSummary.nextRewardAt || 50} pts</span>
            <span>{toNext} more to next reward</span>
          </div>
        </div>

        {pointsSummary.discountAvailable && (
          <div className="mt-6 p-4 bg-available/10 border border-available/20 rounded-xl">
            <p className="text-xs font-semibold text-available">🎉 Reward Available!</p>
            <p className="text-[10px] text-available/80 mt-1">This member is eligible for a discount on their next session.</p>
          </div>
        )}
      </div>

      {/* QR Code Pass */}
      <div className="glass rounded-2xl border border-border p-6 flex flex-col items-center">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-6 self-start">Member Parking Pass</p>
        
        <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/20 mb-6">
          <QRCodeCanvas 
            value={user.qr_token} 
            size={160} 
            level="H" 
            id="member-qr"
          />
        </div>

        <div className="flex gap-4 w-full">
          <button 
            onClick={() => {
              const canvas = document.getElementById('member-qr');
              const link = document.createElement('a');
              link.download = `${user.name}-qr.png`;
              link.href = canvas.toDataURL();
              link.click();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-elevated border border-border text-sm font-semibold text-[var(--text-primary)] hover:bg-border transition-colors"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button 
            onClick={handleRegenerate}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-elevated border border-border text-sm font-semibold text-[var(--text-primary)] hover:bg-border transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
