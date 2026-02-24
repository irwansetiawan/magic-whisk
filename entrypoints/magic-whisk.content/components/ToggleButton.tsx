interface ToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ToggleButton({ onClick, isOpen }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: isOpen ? '340px' : '0',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10000,
        width: '32px',
        height: '64px',
        border: 'none',
        borderRadius: '8px 0 0 8px',
        background: '#1a73e8',
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'right 0.3s ease',
      }}
      title="Magic Whisk"
    >
      {isOpen ? '\u203A' : '\u2039'}
    </button>
  );
}
