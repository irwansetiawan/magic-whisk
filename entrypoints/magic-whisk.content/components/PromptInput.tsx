import { useRef, useEffect } from 'react';
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

interface PromptInputProps {
  item: QueueItem;
  onChangePrompt: (prompt: string) => void;
  onRemove: () => void;
  disabled: boolean;
}

export function PromptInput({ item, onChangePrompt, onRemove, disabled }: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [item.prompt]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '8px',
    }}>
      <textarea
        ref={textareaRef}
        value={item.prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        disabled={disabled}
        placeholder="Enter prompt..."
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          overflow: 'hidden',
          background: '#141926',
          border: '1px solid #1f2637',
          borderRadius: '6px',
          color: '#e2e4eb',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          lineHeight: '1.4',
        }}
      />
      <span
        style={{
          color: STATUS_COLORS[item.status],
          fontSize: '16px',
          lineHeight: '36px',
          minWidth: '20px',
          textAlign: 'center',
        }}
        title={item.error || item.status}
      >
        {STATUS_ICONS[item.status]}
      </span>
      {!disabled && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#4a4e63',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: '36px',
          }}
          title="Remove prompt"
        >×</button>
      )}
    </div>
  );
}
