import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatusBadge = ({ status }) => {
  // status can be: CONNECTED, CONNECTING, DISCONNECTED, ERROR
  
  if (status === 'CONNECTED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-success/15 text-accent-success border border-accent-success/35">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-ping"></span>
        <Wifi className="w-3.5 h-3.5" />
        <span>Connected</span>
      </div>
    );
  }

  if (status === 'CONNECTING') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-warning/15 text-accent-warning border border-accent-warning/35">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-danger/15 text-accent-danger border border-accent-danger/35">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Connection Lost (Retrying)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-500 border border-gray-500/35">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Disconnected</span>
    </div>
  );
};
export default ConnectionStatusBadge;
