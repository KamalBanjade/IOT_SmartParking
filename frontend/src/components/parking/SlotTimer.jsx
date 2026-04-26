import React, { useState, useEffect } from 'react';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { sessionsApi } from '../../services/api';

export default function SlotTimer({ slotId }) {
  const [display, setDisplay] = useState('...');

  useEffect(() => {
    let interval;
    
    const fetchTimer = () => {
      sessionsApi.getBySlot(slotId).then(res => {
        if (res.data?.entry_time) {
          const entry = new Date(res.data.entry_time);
          const update = () => {
            const totalMinutes = differenceInMinutes(new Date(), entry);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            setDisplay(h > 0 ? `${h}h ${m}m` : `${Math.max(0, m)}m`);
          };
          update();
          interval = setInterval(update, 60000);
        } else {
          setDisplay('--m');
        }
      }).catch(() => {
        setDisplay('--m');
      });
    };

    fetchTimer();
    return () => clearInterval(interval);
  }, [slotId]);

  return (
    <span className="font-mono text-lg font-semibold text-[var(--text-primary)]">
      {display}
    </span>
  );
}
