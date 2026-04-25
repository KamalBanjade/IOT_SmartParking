import React, { useState, useEffect } from 'react';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { sessionsApi } from '../../services/api';

export default function SlotTimer({ slotId }) {
  const [entryTime, setEntryTime] = useState(null);
  const [duration, setDuration] = useState('0m');

  useEffect(() => {
    let interval;
    
    sessionsApi.getBySlot(slotId).then(res => {
      if (res.data && res.data.entry_time) {
        setEntryTime(new Date(res.data.entry_time));
      }
    }).catch(err => console.error("Timer fetch error:", err));

    return () => clearInterval(interval);
  }, [slotId]);

  useEffect(() => {
    if (!entryTime) return;

    const updateTimer = () => {
      const now = new Date();
      const mins = differenceInMinutes(now, entryTime);
      const hrs = differenceInHours(now, entryTime);
      
      if (hrs > 0) {
        setDuration(`${hrs}h ${mins % 60}m`);
      } else {
        setDuration(`${mins}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [entryTime]);

  if (!entryTime) return <span className="text-sm font-mono text-text-muted">--:--</span>;

  return (
    <span className="text-xl font-mono text-text-primary">
      {duration}
    </span>
  );
}
