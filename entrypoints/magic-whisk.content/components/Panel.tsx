import { useState, useEffect, useCallback, useRef } from 'react';
import { QueueTab } from './QueueTab';
import { GalleryTab } from './GalleryTab';
import { SettingsTab } from './SettingsTab';
import { LogsTab } from './LogsTab';
import { useQueue } from '../hooks/useQueue';
import { useSettings } from '../hooks/useSettings';
import { useAspectRatio } from '../hooks/useAspectRatio';

type Tab = 'queue' | 'gallery' | 'logs' | 'settings';

interface PanelProps {
  onClose: () => void;
  width: number;
  onResize: (width: number) => void;
}

const logoUrl = browser.runtime.getURL('/icon/logo.png');
const bmcQrUrl = browser.runtime.getURL('/icon/bmc-qr.png');

export function Panel({ onClose, width, onResize }: PanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const settingsObj = useSettings();
  const queue = useQueue(settingsObj.settings);
  const aspectRatio = useAspectRatio();
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      onResize(window.innerWidth - ev.clientX);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onResize]);

  return (
    <div
      style={{
        position: 'fixed',
        right: '0',
        top: '0',
        width: `${width}px`,
        height: '100vh',
        background: '#0b0e15',
        color: '#e2e4eb',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: '-3px',
          top: 0,
          width: '6px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 10001,
        }}
      />
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #1f2637',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoUrl} alt="Magic Whisk" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#e2e4eb' }}>Magic Whisk</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#7c809a',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >{'\u00D7'}</button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1f2637',
      }}>
        {(['queue', 'gallery', 'logs', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab ? '#141926' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #9366f0' : '2px solid transparent',
              color: activeTab === tab ? '#e2e4eb' : '#7c809a',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'settings' ? '\u2699' : tab === 'logs' ? '\u25A3' : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'queue' && (
          <QueueTab
            bulkText={queue.bulkText}
            onBulkTextChange={queue.setBulkText}
            items={queue.items}
            isRunning={queue.isRunning}
            isPaused={queue.isPaused}
            aspectRatio={aspectRatio}
            onStart={queue.start}
            onPause={queue.pause}
            onStop={queue.stop}
          />
        )}
        {activeTab === 'gallery' && <GalleryTab results={queue.results} downloadFolder={settingsObj.settings.downloadFolder} />}
        {activeTab === 'logs' && <LogsTab logs={queue.logs} />}
        {activeTab === 'settings' && <SettingsTab settings={settingsObj.settings} onUpdateSettings={settingsObj.updateSettings} />}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1f2637',
        background: '#141926',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Sponsor section — slides up after 5s, dismissible */}
        <SponsorBanner bmcQrUrl={bmcQrUrl} />

        {/* Always visible */}
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{ fontSize: '10px', color: '#7c809a' }}>Magic Whisk is free and open source.</div>
          <a
            href="https://github.com/irwansetiawan/magic-whisk/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#7c809a',
              fontSize: '11px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >💡 Feature request or bug? Let us know</a>
        </div>
      </div>
    </div>
  );
}

const SPONSOR_DISMISSED_KEY = 'local:sponsorDismissedAt';
const SPONSOR_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function SponsorBanner({ bmcQrUrl }: { bmcQrUrl: string }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until we check storage

  // Check if the banner was dismissed within the last 24h
  useEffect(() => {
    browser.storage.local.get(SPONSOR_DISMISSED_KEY).then((result) => {
      const dismissedAt = result[SPONSOR_DISMISSED_KEY] as number | undefined;
      if (!dismissedAt || Date.now() - dismissedAt > SPONSOR_COOLDOWN_MS) {
        setDismissed(false);
        const timer = setTimeout(() => setVisible(true), 5000);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    browser.storage.local.set({ [SPONSOR_DISMISSED_KEY]: Date.now() });
  };

  if (dismissed) return null;

  return (
    <div style={{
      maxHeight: visible ? '300px' : '0',
      opacity: visible ? 1 : 0,
      transition: 'max-height 0.6s ease, opacity 0.6s ease',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #1f2637',
        position: 'relative',
      }}>
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            color: '#4a4e63',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
            padding: '2px',
          }}
          title="Dismiss"
        >{'\u00D7'}</button>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4eb' }}>Enjoy Magic Whisk?</div>
        <img src={bmcQrUrl} alt="QR code" style={{ width: '120px', height: '120px', borderRadius: '8px' }} />
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <a
            href="https://buymeacoffee.com/irwansetiawan"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '8px',
              background: '#0b0e15',
              border: '1px solid #1f2637',
              borderRadius: '8px',
              color: '#e2e4eb',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >☕ Buy me a coffee</a>
          <a
            href="https://github.com/sponsors/irwansetiawan"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '8px',
              background: '#0b0e15',
              border: '1px solid #1f2637',
              borderRadius: '8px',
              color: '#e2e4eb',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >♥ GitHub Sponsor</a>
        </div>
      </div>
    </div>
  );
}
