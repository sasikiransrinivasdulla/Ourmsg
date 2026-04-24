"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Optional UX: Show only after 2.5 seconds delay
      setTimeout(() => {
        setIsVisible(true);
      }, 2500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up.
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden flex flex-col items-end gap-2 page-transition-enter">
      {/* Tooltip */}
      <div className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-lg relative animate-pulse">
        Install for better experience
        <div className="absolute -bottom-1 right-6 w-2 h-2 bg-slate-800 rotate-45"></div>
      </div>
      
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 hover:-translate-y-1 hover:shadow-blue-500/30 transition-all active:scale-95"
      >
        <Download className="w-5 h-5" />
        <span className="font-medium text-sm">Install App 📱</span>
      </button>
    </div>
  );
}
