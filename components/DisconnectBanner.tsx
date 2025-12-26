"use client";

interface DisconnectBannerProps {
  partnerName: string;
  isPartnerConnected: boolean;
}

export default function DisconnectBanner({
  partnerName,
  isPartnerConnected,
}: DisconnectBannerProps) {
  if (isPartnerConnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 py-3 px-4 text-center shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <span className="animate-pulse">⏳</span>
        <span className="font-medium">
          Waiting for {partnerName} to reconnect...
        </span>
        <span className="text-sm">(Timer paused)</span>
      </div>
    </div>
  );
}
