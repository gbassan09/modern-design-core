import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function beforeInstallPromptHandler(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
      console.log("PWA: beforeinstallprompt event captured");
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setVisible(false);
      console.log("PWA installed");
    }

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler as EventListener);
    window.addEventListener("appinstalled", onAppInstalled as EventListener);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log("PWA install choice:", choiceResult);
      // Hide install UI regardless of user choice
      setVisible(false);
      setDeferredPrompt(null);
    } catch (e) {
      console.error("Failed to show install prompt", e);
    }
  };

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999 }}>
      <Button variant="secondary" size="sm" onClick={handleInstall}>
        Instalar Vision scan
      </Button>
    </div>
  );
};

export default InstallPWA;
