import React from 'react';
import { useParking } from '../../context/ParkingContext';
import { Link } from 'react-router-dom';
import { X, ExternalLink, Star, ShieldCheck } from 'lucide-react';

export default function UserCard() {
  const { scannedUser, setScannedUser } = useParking();

  if (!scannedUser) {
    return (
      <div className="p-8 text-center glass rounded-2xl border border-border border-dashed">
        <p className="text-xs text-[var(--text-muted)] italic">No member scanned yet</p>
      </div>
    );
  }

  const { user, pointsSummary } = scannedUser;

  return (
    <div className="glass rounded-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="px-5 py-3 border-b border-border flex justify-between items-center bg-elevated/30">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Scanned Member</span>
        <button 
          onClick={() => setScannedUser(null)} 
          className="p-1 rounded-lg hover:bg-elevated text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl font-bold text-accent flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</h4>
            <ShieldCheck className="w-3 h-3 text-customer" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{user.phone}</p>
        </div>
        <Link 
          to={`/member/${user.id}`} 
          className="p-2 rounded-xl border border-border text-[var(--text-muted)] hover:text-accent hover:border-accent/30 transition-all"
          title="View Profile"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="px-5 py-4 bg-elevated/20 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-pending fill-pending" />
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-none">{pointsSummary?.total ?? 0}</p>
            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">Points</p>
          </div>
        </div>
        {pointsSummary?.discountAvailable && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-available/10 text-available border border-available/20 font-bold uppercase tracking-wide animate-pulse">
            Reward Ready
          </span>
        )}
      </div>
    </div>
  );
}
