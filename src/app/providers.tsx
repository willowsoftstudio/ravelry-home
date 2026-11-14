"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// One QueryClient per browser tab (architecture: Discovery, decision D2). Repeated
// filter states are served from this in-session cache with no new /api request (ISC-31).
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
