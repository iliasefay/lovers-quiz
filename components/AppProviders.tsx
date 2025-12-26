"use client";

import { ReactNode } from "react";
import { SocketProvider } from "@/contexts/SocketContext";
import ErrorBoundary from "@/components/ErrorBoundary";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <SocketProvider>{children}</SocketProvider>
    </ErrorBoundary>
  );
}
