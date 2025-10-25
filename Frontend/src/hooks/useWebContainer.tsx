import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

interface UseWebContainerResult {
  webcontainer: WebContainer | undefined;
  error: Error | null;
  loading: boolean;
}

// Global singleton instance
let globalWebContainerInstance: WebContainer | null = null;
let globalWebContainerPromise: Promise<WebContainer> | null = null;

export function useWebContainer(): UseWebContainerResult {
  const [webcontainer, setWebcontainer] = useState<WebContainer | undefined>(globalWebContainerInstance || undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!globalWebContainerInstance);

  useEffect(() => {
    // If we already have an instance, use it
    if (globalWebContainerInstance) {
      console.log('✅ [WebContainer] Using existing instance');
      setWebcontainer(globalWebContainerInstance);
      setLoading(false);
      return;
    }

    // If boot is in progress, wait for it
    if (globalWebContainerPromise) {
      console.log('⏳ [WebContainer] Boot in progress, waiting...');
      globalWebContainerPromise
        .then((instance) => {
          console.log('✅ [WebContainer] Using newly booted instance');
          setWebcontainer(instance);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ [WebContainer] Boot failed:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });
      return;
    }

    // Boot new instance and create proper promise
    globalWebContainerPromise = (async () => {
      try {
        console.log('🔧 [WebContainer] Starting boot process...');
        setLoading(true);
        setError(null);

        // Check if SharedArrayBuffer is available
        if (typeof SharedArrayBuffer === 'undefined') {
          const error = new Error('SharedArrayBuffer is not available. Cross-origin isolation is required.');
          console.error('❌ [WebContainer] SharedArrayBuffer not available');
          setError(error);
          setLoading(false);
          throw error;
        }

        console.log('🚀 [WebContainer] Booting new instance...');
        const startTime = Date.now();

        const webcontainerInstance = await WebContainer.boot();
        const bootTime = Date.now() - startTime;
        
        globalWebContainerInstance = webcontainerInstance;
        
        console.log('✅ [WebContainer] Booted successfully in', bootTime, 'ms');
        setWebcontainer(webcontainerInstance);
        setLoading(false);
        
        return webcontainerInstance;
      } catch (err: any) {
        console.error('❌ [WebContainer] Failed to boot:', err.message);
        globalWebContainerPromise = null;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        throw err;
      }
    })();

    // No cleanup needed - we want the singleton to persist
  }, []);

  return { webcontainer, error, loading };
}