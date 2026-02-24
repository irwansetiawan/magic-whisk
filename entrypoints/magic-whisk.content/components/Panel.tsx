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
        background: '#1e1e1e',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #333',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Magic Whisk</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >{'\u00D7'}</button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
      }}>
        {(['queue', 'gallery', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab ? '#2a2a2a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1a73e8' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#888',
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
    </div>
  );
}
