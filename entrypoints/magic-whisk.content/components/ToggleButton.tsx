interface ToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const logoUrl = browser.runtime.getURL('/icon/logo.png');

export function ToggleButton({ onClick, isOpen }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: isOpen ? '340px' : '0',
        top: '25%',
        transform: 'translateY(-50%)',
        zIndex: 10000,
        width: '44px',
        height: '44px',
        border: 'none',
        borderRadius: '8px 0 0 8px',
        background: '#0b0e15',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'right 0.3s ease',
        padding: '4px',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.4)',
      }}
      title="Magic Whisk"
    >
      <img
        src={logoUrl}
        alt="Magic Whisk"
        style={{ width: '34px', height: '34px', borderRadius: '6px' }}
      />
    </button>
  );
}
