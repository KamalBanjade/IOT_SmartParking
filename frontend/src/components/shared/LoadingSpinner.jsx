import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
      <p>{text}</p>
    </div>
  );
}
