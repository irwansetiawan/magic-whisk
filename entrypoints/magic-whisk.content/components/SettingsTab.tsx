import type { Settings, AspectRatio } from '@/src/shared/types';
import { useAspectRatio } from '../hooks/useAspectRatio';

const RATIOS: { value: AspectRatio; label: string; desc: string }[] = [
  { value: '1:1', label: '1:1', desc: 'Square' },
  { value: '9:16', label: '9:16', desc: 'Portrait' },
  { value: '16:9', label: '16:9', desc: 'Landscape' },
];

interface SettingsTabProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
}

export function SettingsTab({ settings, onUpdateSettings }: SettingsTabProps) {
  const { setRatio } = useAspectRatio(
    settings.aspectRatio,
    (ratio) => onUpdateSettings({ aspectRatio: ratio }),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Aspect ratio */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: '#a0a3b5', fontSize: '13px' }}>
          Aspect ratio
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRatio(r.value)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: settings.aspectRatio === r.value ? '#9366f0' : '#141926',
                border: settings.aspectRatio === r.value ? '1px solid #9366f0' : '1px solid #1f2637',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: settings.aspectRatio === r.value ? '#fff' : '#e2e4eb' }}>
                {r.label}
              </div>
              <div style={{ fontSize: '11px', color: settings.aspectRatio === r.value ? 'rgba(255,255,255,0.7)' : '#7c809a', marginTop: '2px' }}>
                {r.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

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
