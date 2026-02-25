import type { QueueItem } from '@/src/shared/types';

const STATUS_ICONS: Record<QueueItem['status'], string> = {
  pending: '\u25CB',
  running: '\u27F3',
  done: '\u2713',
  failed: '\u2717',
};

const STATUS_COLORS: Record<QueueItem['status'], string> = {
  pending: '#7c809a',
  running: '#9366f0',
  done: '#34a853',
  failed: '#ea4335',
};

const RATIO_LABELS: Record<string, string> = {
  '1:1': 'Square',
  '9:16': 'Portrait',
  '16:9': 'Landscape',
};

interface QueueTabProps {
  bulkText: string;
  onBulkTextChange: (text: string) => void;
  items: QueueItem[];
  isRunning: boolean;
  isPaused: boolean;
  aspectRatio: string | null;
  onStart: () => void;
  onStartOver: () => void;
  onResume: () => void;
  onPause: () => void;
  onStop: () => void;
  onRemoveItem: (id: string) => void;
  onClearItems: () => void;
}

export function QueueTab({
  bulkText,
  onBulkTextChange,
  items,
  isRunning,
  isPaused,
  aspectRatio,
  onStart,
  onStartOver,
  onResume,
  onPause,
  onStop,
  onRemoveItem,
  onClearItems,
}: QueueTabProps) {
  const promptCount = bulkText.split('\n').filter((l) => l.trim() !== '').length;
  const hasItems = items.length > 0;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const hasNewText = promptCount > 0;
  const canResume = pendingCount > 0 || hasNewText;

  return (
    <div>
      {/* Checklist — visible whenever items exist */}
      {hasItems && (
        <div style={{ marginBottom: '12px' }}>
          <ProgressBar items={items} />
          {!isRunning && (
            <div style={{ textAlign: 'right', marginBottom: '8px' }}>
              <button
                onClick={onClearItems}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c809a',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: 0,
                }}
              >
                Clear all
              </button>
            </div>
          )}
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
                flex: 1,
              }}>
                {item.prompt}
              </span>
              {!isRunning && (
                <button
                  onClick={() => onRemoveItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4a4e63',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 2px',
                    lineHeight: '20px',
                    flexShrink: 0,
                  }}
                  title="Remove"
                >
                  {'\u00D7'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Textarea — visible when not running */}
      {!isRunning && (
        <>
          <textarea
            value={bulkText}
            onChange={(e) => onBulkTextChange(e.target.value)}
            placeholder={hasItems
              ? 'Add more prompts...'
              : "Enter prompts, one per line...\n\nExample:\na cat wearing a top hat\na dog surfing a wave\na robot painting a sunset"}
            rows={hasItems ? 12 : 25}
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
            {hasItems && hasNewText
              ? `${promptCount} new prompt${promptCount !== 1 ? 's' : ''} to add`
              : `${promptCount} prompt${promptCount !== 1 ? 's' : ''}`}
          </div>
        </>
      )}

      {!isRunning && aspectRatio && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          marginTop: '4px',
          background: '#141926',
          border: '1px solid #1f2637',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#7c809a',
        }}>
          <span>Aspect ratio:</span>
          <span style={{ color: '#e2e4eb', fontWeight: 600 }}>
            {aspectRatio}
          </span>
          <span style={{ color: '#4a4e63' }}>
            {RATIO_LABELS[aspectRatio]}
          </span>
        </div>
      )}

      {/* Button bar */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {!isRunning && !hasItems && (
          <button
            onClick={onStart}
            disabled={!hasNewText}
            style={{
              flex: 1,
              padding: '10px',
              background: hasNewText ? '#9366f0' : '#141926',
              color: hasNewText ? '#fff' : '#4a4e63',
              border: 'none',
              borderRadius: '6px',
              cursor: hasNewText ? 'pointer' : 'default',
              fontWeight: 'bold',
            }}
          >
            Start
          </button>
        )}
        {!isRunning && hasItems && (
          <>
            <button
              onClick={onStartOver}
              style={{
                flex: 1,
                padding: '10px',
                background: '#141926',
                color: '#e2e4eb',
                border: '1px solid #1f2637',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Start Over
            </button>
            <button
              onClick={onResume}
              disabled={!canResume}
              style={{
                flex: 1,
                padding: '10px',
                background: canResume ? '#9366f0' : '#141926',
                color: canResume ? '#fff' : '#4a4e63',
                border: 'none',
                borderRadius: '6px',
                cursor: canResume ? 'pointer' : 'default',
                fontWeight: 'bold',
              }}
            >
              Resume
            </button>
          </>
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

function ProgressBar({ items }: { items: QueueItem[] }) {
  const total = items.length;
  const done = items.filter((i) => i.status === 'done' || i.status === 'failed').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4eb' }}>
          {done}/{total} completed
        </span>
        <span style={{ fontSize: '12px', color: '#7c809a' }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: '#1a1e2e',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: '3px',
          background: 'linear-gradient(90deg, #7c4dff, #9366f0, #b388ff)',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}
