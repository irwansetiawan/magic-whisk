import type { QueueItem } from '@/src/shared/types';
import { PromptInput } from './PromptInput';

interface QueueTabProps {
  items: QueueItem[];
  isRunning: boolean;
  isPaused: boolean;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdatePrompt: (id: string, prompt: string) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function QueueTab({
  items,
  isRunning,
  isPaused,
  onAddItem,
  onRemoveItem,
  onUpdatePrompt,
  onStart,
  onPause,
  onStop,
}: QueueTabProps) {
  const hasPrompts = items.some((item) => item.prompt.trim() !== '');

  return (
    <div>
      {items.map((item) => (
        <PromptInput
          key={item.id}
          item={item}
          onChangePrompt={(prompt) => onUpdatePrompt(item.id, prompt)}
          onRemove={() => onRemoveItem(item.id)}
          disabled={isRunning && item.status !== 'pending'}
        />
      ))}

      {!isRunning && (
        <button
          onClick={onAddItem}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px dashed #1f2637',
            borderRadius: '6px',
            color: '#7c809a',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          + Add Prompt
        </button>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {!isRunning && (
          <button
            onClick={onStart}
            disabled={!hasPrompts}
            style={{
              flex: 1,
              padding: '10px',
              background: hasPrompts ? '#9366f0' : '#141926',
              color: hasPrompts ? '#fff' : '#4a4e63',
              border: 'none',
              borderRadius: '6px',
              cursor: hasPrompts ? 'pointer' : 'default',
              fontWeight: 'bold',
            }}
          >
            ▶ Start
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
              {isPaused ? '▶ Resume' : '⏸ Pause'}
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
              ■ Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
