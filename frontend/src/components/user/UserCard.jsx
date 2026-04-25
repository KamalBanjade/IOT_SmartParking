import React from 'react';
import { useParking } from '../../context/ParkingContext';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function UserCard() {
  const { scannedUser, setScannedUser } = useParking();

  if (!scannedUser) return null;

  const { user, pointsSummary } = scannedUser;

  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-text-muted px-5 py-3 border-b border-bg-border flex justify-between items-center">
        <span>Scanned Member</span>
        <button onClick={() => setScannedUser(null)} className="text-text-muted hover:text-text-primary">
          <X className="w-3.5 h-3.5" />
        </button>
      </h3>
      <div className="p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-text-primary">{user.name}</h4>
          <p className="text-xs text-text-secondary mt-1">{user.phone}</p>
        </div>
        
        <div className="py-4 border-t border-b border-bg-border mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-text-primary">
              <span className="text-amber-400 mr-1.5">★</span>
              {pointsSummary?.total || 0}
            </span>
            {pointsSummary?.discountAvailable && (
              <span className="bg-green-400/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                ✓ Discount available
              </span>
            )}
          </div>
          
          <div className="w-full">
            <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden mb-1.5">
              <div 
                className="h-full bg-accent transition-all duration-500" 
                style={{ width: `${pointsSummary?.progress || 0}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-text-muted flex justify-between">
              <span>Progress: {pointsSummary?.progress || 0}%</span>
              <span>{Math.max(0, 50 - ((pointsSummary?.total || 0) % 50))} pts to reward</span>
            </p>
          </div>
        </div>

        <Link 
          to={`/member/${user.id}`}
          className="w-full h-8 flex items-center justify-center border border-bg-border hover:border-accent text-text-secondary hover:text-text-primary text-xs font-medium rounded transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
