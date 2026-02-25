import { useRef, useEffect } from 'react';
import type { LogEntry } from '@/src/shared/types';

const TYPE_COLORS: Record<LogEntry['type'], string> = {
  info: '#7c809a',
  success: '#34a853',
  error: '#ea4335',
};

interface LogsTabProps {
  logs: LogEntry[];
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

export function LogsTab({ logs }: LogsTabProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  if (logs.length === 0) {
    return (
      <div style={{ color: '#4a4e63', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>
        No logs yet. Start a queue to see processing events.
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      fontSize: '12px',
      lineHeight: '1.6',
    }}>
      {logs.map((entry, i) => (
        <div key={i} style={{ color: TYPE_COLORS[entry.type], wordBreak: 'break-word' }}>
          <span style={{ color: '#4a4e63' }}>[{formatTime(entry.timestamp)}]</span>{' '}
          {entry.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
