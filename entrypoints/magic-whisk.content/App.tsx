import { useState } from 'react';
import { ToggleButton } from './components/ToggleButton';
import { Panel } from './components/Panel';

export function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ToggleButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      {isOpen && <Panel onClose={() => setIsOpen(false)} />}
    </>
  );
}
