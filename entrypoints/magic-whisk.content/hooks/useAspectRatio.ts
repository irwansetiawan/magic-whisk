import { useState, useEffect } from 'react';
import { getSelectedAspectRatio } from '@/src/automation/selectors';

/** Polls Whisk's DOM to detect the currently selected aspect ratio. */
export function useAspectRatio() {
  const [ratio, setRatio] = useState<string | null>(null);

  useEffect(() => {
    const poll = () => {
      const detected = getSelectedAspectRatio();
      if (detected) setRatio(detected);
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, []);

  return ratio;
}
