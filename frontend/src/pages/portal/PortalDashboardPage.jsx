import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import PortalNavbar from '../../components/portal/PortalNavbar';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { portalApi } from '../../services/api';

export default function PortalDashboardPage() {
  const { customer } = useCustomerAuth();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    if (customer?.qr_token) {
      QRCode.toDataURL(customer.qr_token, {
        color: { dark: '#000000', light: '#ffffff' },
        width: 200,
        margin: 1
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error(err));
    }
    
    // Fetch 3 most recent sessions
    portalApi.getSessions(1)
      .then(res => setRecentSessions(res.data.slice(0, 3)))
      .catch(err => console.error(err));
      
  }, [customer]);

  if (!customer) return null;

  const points = customer.pointsSummary?.total || 0;
  const progress = Math.min((points / 50) * 100, 100);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <PortalNavbar />
      
      <main className="flex-grow max-w-lg w-full mx-auto p-4 space-y-4">
        
        {/* Welcome Card */}
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
          <h2 className="text-xl font-bold text-text-primary">Hi, {customer.name.split(' ')[0]} 👋</h2>
          <p className="text-text-muted text-sm mt-1">
            Member since {format(new Date(customer.created_at || new Date()), 'MMM yyyy')}
          </p>
        </div>

        {/* Loyalty Points */}
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-status-warning text-2xl font-bold">★ {points}</div>
              <div className="text-text-secondary text-sm">Loyalty Points</div>
            </div>
            <div className="text-text-primary font-medium">{Math.floor(progress)}%</div>
          </div>
          
          <div className="h-2 w-full bg-bg-base rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-status-warning transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {points >= 50 ? (
            <div className="text-status-available text-sm font-medium mt-3">
              🎉 You have a free NPR 25 discount available!
            </div>
          ) : (
            <div className="text-text-muted text-sm">
              {50 - points} points to next reward
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5 flex flex-col items-center text-center">
          <h3 className="font-medium text-text-primary mb-4 w-full text-left">Your Pass</h3>
          {qrCodeDataUrl ? (
            <div className="bg-white p-2 rounded-lg">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-40 h-40" />
            </div>
          ) : (
            <div className="w-40 h-40 bg-bg-elevated rounded-lg flex items-center justify-center text-text-muted">
              Loading...
            </div>
          )}
          <p className="text-xs text-text-muted mt-3">Scan this code at the booth</p>
        </div>

        {/* Recent Sessions */}
        <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-bg-border flex justify-between items-center">
            <h3 className="font-medium text-text-primary">Recent Sessions</h3>
            <Link to="/portal/sessions" className="text-xs text-text-muted hover:text-text-primary transition-colors">
              View All
            </Link>
          </div>
          <div className="divide-y divide-bg-border">
            {recentSessions.length === 0 ? (
              <div className="p-5 text-center text-sm text-text-muted">No parking history yet.</div>
            ) : (
              recentSessions.map(session => (
                <div key={session.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-text-primary font-medium">Slot {session.slot_label}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {format(new Date(session.entry_time), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">
                      {session.amount ? `NPR ${session.amount}` : 'Active'}
                    </div>
                    {session.duration_minutes && (
                      <div className="text-xs text-text-muted mt-0.5">
                        {Math.ceil(session.duration_minutes / 60)}h
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
