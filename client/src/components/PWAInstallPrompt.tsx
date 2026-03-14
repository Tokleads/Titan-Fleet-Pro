import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed before (for all platforms)
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const dismissedAt = parseInt(dismissedTime, 10);
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < thirtyDaysMs) {
        // Still within 30 day dismissal period
        return;
      }
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 60 seconds (less aggressive)
      setTimeout(() => {
        setShowPrompt(true);
      }, 60000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt if applicable
    if (iOS && !isStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 60000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store timestamp - won't show again for 30 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-2xl p-4 text-white">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Smartphone className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Install Fleet App
                </h3>
                <p className="text-sm text-blue-100 mb-3">
                  {isIOS
                    ? 'Add to your home screen for the best experience'
                    : 'Install our app for offline access and faster loading'}
                </p>

                {isIOS ? (
                  <div className="text-xs text-blue-100 space-y-1">
                    <p>1. Tap the Share button <span className="inline-block">⎘</span></p>
                    <p>2. Scroll down and tap "Add to Home Screen"</p>
                    <p>3. Tap "Add" to confirm</p>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Install Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
