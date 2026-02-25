import { useState } from 'react';
import type { ResultItem } from '@/src/shared/types';

interface GalleryTabProps {
  results: ResultItem[];
  downloadFolder: string;
}

export function GalleryTab({ results, downloadFolder }: GalleryTabProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadSelected = () => {
    selected.forEach((id) => {
      const item = results.find((r) => r.id === id);
      if (item) {
        browser.runtime.sendMessage({
          type: 'DOWNLOAD_IMAGE',
          payload: {
            imageUrl: item.imageUrl,
            filename: `${item.prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}-${item.id.slice(0, 8)}.png`,
            folder: downloadFolder,
          },
        });
      }
    });
  };

  if (results.length === 0) {
    return <div style={{ color: '#7c809a', textAlign: 'center', padding: '32px 0' }}>No results yet. Run some prompts first.</div>;
  }

  return (
    <div>
      {selected.size > 0 && (
        <button
          onClick={downloadSelected}
          style={{
            width: '100%',
            padding: '8px',
            background: '#9366f0',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          Download {selected.size} selected
        </button>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleSelect(item.id)}
            style={{
              border: selected.has(item.id) ? '2px solid #9366f0' : '2px solid transparent',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#141926',
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.prompt}
              style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }}
            />
            <div style={{
              padding: '6px',
              fontSize: '11px',
              color: '#7c809a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
