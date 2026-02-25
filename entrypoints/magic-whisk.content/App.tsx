import { useState, useEffect, useCallback } from 'react';
import { ToggleButton } from './components/ToggleButton';
import { Panel } from './components/Panel';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 340;

export function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);

  // Push the page content by injecting a <style> tag with !important overrides
  useEffect(() => {
    const id = 'magic-whisk-push';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    if (isOpen) {
      style.textContent = `
        html, body {
          overflow-x: hidden !important;
        }
        #__next {
          position: relative !important;
          width: calc(100vw - ${panelWidth}px) !important;
          overflow: hidden !important;
        }
      `;
    } else {
      style.textContent = '';
    }
    return () => {
      style?.remove();
    };
  }, [isOpen, panelWidth]);

  const handleResize = useCallback((width: number) => {
    setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)));
  }, []);

  return (
    <>
      <ToggleButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} panelWidth={panelWidth} />
      {isOpen && (
        <Panel
          onClose={() => setIsOpen(false)}
          width={panelWidth}
          onResize={handleResize}
        />
      )}
    </>
  );
}
