import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { usersApi } from '../../services/api';
import toast from 'react-hot-toast';

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

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-bg-border">
        <h2 className="text-xl font-semibold text-text-primary">{user.name}</h2>
        <p className="text-sm text-text-secondary">{user.phone}</p>
        <p className="text-xs text-text-muted mt-1">
          Member since {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="p-5 flex flex-col items-center border-b border-bg-border bg-bg-elevated/30">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-text-primary flex items-center justify-center">
            <span className="text-amber-400 mr-2">★</span>
            {pointsSummary.total}
          </div>
          <span className="text-xs text-text-muted uppercase tracking-widest">points</span>
        </div>

        <div className="w-full">
          <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden mb-1.5">
            <div 
              className="h-full bg-accent transition-all duration-500" 
              style={{ width: `${pointsSummary.progress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-text-muted text-center">
            {pointsSummary.nextRewardAt - (pointsSummary.total % pointsSummary.nextRewardAt)} points to next reward (50pts = NPR 25 off)
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col items-center">
        {user.qr_token ? (
          <div className="bg-white p-3 rounded-lg mb-4">
            <QRCodeCanvas value={user.qr_token} size={150} level="H" />
          </div>
        ) : (
          <div className="w-[150px] h-[150px] border border-bg-border border-dashed rounded-lg flex items-center justify-center text-text-muted mb-4">
            No QR
          </div>
        )}
        
        <button 
          onClick={handleRegenerate}
          className="w-full h-8 border border-bg-border hover:border-accent text-text-secondary hover:text-text-primary text-xs font-medium rounded transition-colors"
        >
          Regenerate QR
        </button>
      </div>
    </div>
  );
}
