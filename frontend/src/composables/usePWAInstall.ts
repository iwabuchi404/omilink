import { ref, onMounted, onUnmounted } from 'vue';

export function usePWAInstall() {
  const deferredPrompt = ref<any>(null);
  const isInstallable = ref(false);
  const isStandalone = ref(false);
  const isIOS = ref(false);

  const checkStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    );
  };

  const checkIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  };

  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt.value = e;
    isInstallable.value = true;
  };

  const installApp = async () => {
    if (!deferredPrompt.value) return false;

    // Show the prompt
    deferredPrompt.value.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.value.userChoice;
    
    if (outcome === 'accepted') {
      isInstallable.value = false;
      deferredPrompt.value = null;
      return true;
    }
    return false;
  };

  onMounted(() => {
    isStandalone.value = checkStandalone();
    isIOS.value = checkIOS();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for the app being installed
    window.addEventListener('appinstalled', () => {
      isInstallable.value = false;
      deferredPrompt.value = null;
      isStandalone.value = true;
    });
  });

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });

  return {
    isInstallable,
    isStandalone,
    isIOS,
    installApp
  };
}
