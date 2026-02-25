import type { Settings } from '@/src/shared/types';

interface SettingsTabProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
}

export function SettingsTab({ settings, onUpdateSettings }: SettingsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Delay between generations */}
      <div>
        <label style={{ display: 'block', marginBottom: '4px', color: '#a0a3b5', fontSize: '13px' }}>
          Delay between generations: {settings.delayBetweenGenerations / 1000}s
        </label>
        <input
          type="range"
          min={1000}
          max={15000}
          step={1000}
          value={settings.delayBetweenGenerations}
          onChange={(e) => onUpdateSettings({ delayBetweenGenerations: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>

      {/* Auto-download toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: '#a0a3b5', fontSize: '13px' }}>Auto-download images</label>
        <button
          onClick={() => onUpdateSettings({ autoDownload: !settings.autoDownload })}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            background: settings.autoDownload ? '#9366f0' : '#1f2637',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            left: settings.autoDownload ? '22px' : '2px',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Download folder name */}
      <div>
        <label style={{ display: 'block', marginBottom: '4px', color: '#a0a3b5', fontSize: '13px' }}>
          Download folder name
        </label>
        <input
          type="text"
          value={settings.downloadFolder}
          onChange={(e) => onUpdateSettings({ downloadFolder: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            background: '#141926',
            border: '1px solid #1f2637',
            borderRadius: '6px',
            color: '#e2e4eb',
            fontSize: '13px',
          }}
        />
      </div>
    </div>
  );
}
