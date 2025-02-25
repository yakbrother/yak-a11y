import { useState } from 'react';

export default function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      {/* Missing aria-expanded and aria-controls */}
      <button onClick={() => setIsOpen(true)}>
        Open Modal
      </button>

      {/* Missing role="dialog" and aria-modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}>
          {/* Missing heading for modal */}
          <p>Modal Content</p>

          {/* Non-descriptive close button */}
          <button onClick={() => setIsOpen(false)}>×</button>
        </div>
      )}
    </div>
  );
}
