import { useState } from 'react';
import { QueueTab } from './QueueTab';
import { GalleryTab } from './GalleryTab';
import { SettingsTab } from './SettingsTab';
import { useQueue } from '../hooks/useQueue';
import { useSettings } from '../hooks/useSettings';

type Tab = 'queue' | 'gallery' | 'settings';

interface PanelProps {
  onClose: () => void;
}

const logoUrl = browser.runtime.getURL('/icon/logo.png');
const bmcQrUrl = browser.runtime.getURL('/icon/bmc-qr.png');

export function Panel({ onClose }: PanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const settingsObj = useSettings();
  const queue = useQueue(settingsObj.settings);

  return (
    <div
      style={{
        position: 'fixed',
        right: '0',
        top: '0',
        width: '340px',
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
        {(['queue', 'gallery', 'settings'] as Tab[]).map((tab) => (
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
            {tab === 'settings' ? '\u2699' : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'queue' && (
          <QueueTab
            items={queue.items}
            isRunning={queue.isRunning}
            isPaused={queue.isPaused}
            onAddItem={queue.addItem}
            onRemoveItem={queue.removeItem}
            onUpdatePrompt={queue.updatePrompt}
            onStart={queue.start}
            onPause={queue.pause}
            onStop={queue.stop}
          />
        )}
        {activeTab === 'gallery' && <GalleryTab results={queue.results} downloadFolder={settingsObj.settings.downloadFolder} />}
        {activeTab === 'settings' && <SettingsTab settings={settingsObj.settings} onUpdateSettings={settingsObj.updateSettings} />}
      </div>

      {/* Support */}
      <div style={{
        borderTop: '1px solid #1f2637',
        background: '#141926',
        padding: '16px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
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
        <a
          href="https://github.com/irwansetiawan/magic-whisk/issues"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '100%',
            padding: '7px',
            background: 'transparent',
            border: '1px solid #1f2637',
            borderRadius: '8px',
            color: '#7c809a',
            fontSize: '11px',
            textDecoration: 'none',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >💡 Feature request or bug? Let us know</a>
      </div>
    </div>
  );
}
