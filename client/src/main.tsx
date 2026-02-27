import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from "./App";
import "./index.css";
import { registerServiceWorker, requestPersistentStorage } from "./lib/registerSW";

const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith('/api/')) {
    init = init || {};
    if (!init.credentials) {
      init.credentials = "include";
    }
  }
  return originalFetch.call(window, input, init);
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker();
  requestPersistentStorage();
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
