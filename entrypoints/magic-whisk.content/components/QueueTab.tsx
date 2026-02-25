import type { QueueItem } from '@/src/shared/types';

const STATUS_ICONS: Record<QueueItem['status'], string> = {
  pending: '○',
  running: '⟳',
  done: '✓',
  failed: '✗',
};

const STATUS_COLORS: Record<QueueItem['status'], string> = {
  pending: '#7c809a',
  running: '#9366f0',
  done: '#34a853',
  failed: '#ea4335',
};

interface QueueTabProps {
  bulkText: string;
  onBulkTextChange: (text: string) => void;
  items: QueueItem[];
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function QueueTab({
  bulkText,
  onBulkTextChange,
  items,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onStop,
}: QueueTabProps) {
  const promptCount = bulkText.split('\n').filter((l) => l.trim() !== '').length;

  return (
    <div>
      {!isRunning && (
        <>
          <textarea
            value={bulkText}
            onChange={(e) => onBulkTextChange(e.target.value)}
            placeholder={"Enter prompts, one per line...\n\nExample:\na cat wearing a top hat\na dog surfing a wave\na robot painting a sunset"}
            rows={10}
            style={{
              width: '100%',
              resize: 'vertical',
              background: '#141926',
              border: '1px solid #1f2637',
              borderRadius: '6px',
              color: '#e2e4eb',
              padding: '10px',
              fontSize: '13px',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            fontSize: '12px',
            color: '#7c809a',
            marginTop: '6px',
            marginBottom: '12px',
          }}>
            {promptCount} prompt{promptCount !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {isRunning && items.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '6px 0',
                borderBottom: '1px solid #1a1e2e',
              }}
            >
              <span style={{
                color: STATUS_COLORS[item.status],
                fontSize: '14px',
                minWidth: '18px',
                textAlign: 'center',
                lineHeight: '20px',
              }}>
                {STATUS_ICONS[item.status]}
              </span>
              <span style={{
                fontSize: '13px',
                color: item.status === 'running' ? '#e2e4eb' : '#7c809a',
                lineHeight: '20px',
                wordBreak: 'break-word',
              }}>
                {item.prompt}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {!isRunning && (
          <button
            onClick={onStart}
            disabled={promptCount === 0}
            style={{
              flex: 1,
              padding: '10px',
              background: promptCount > 0 ? '#9366f0' : '#141926',
              color: promptCount > 0 ? '#fff' : '#4a4e63',
              border: 'none',
              borderRadius: '6px',
              cursor: promptCount > 0 ? 'pointer' : 'default',
              fontWeight: 'bold',
            }}
          >
            Start
          </button>
        )}
        {isRunning && (
          <>
            <button
              onClick={onPause}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f9ab00',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onStop}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ea4335',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
