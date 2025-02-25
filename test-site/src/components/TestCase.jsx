import { useState } from 'react';

export default function TestCase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [count, setCount] = useState(0);

  // Accessibility issues:
  // 1. Missing ARIA attributes on modal
  // 2. No keyboard handling
  // 3. Missing labels
  // 4. Poor color contrast
  // 5. No focus management
  return (
    <div style={{ padding: '20px' }}>
      {/* Missing label */}
      <input type="text" placeholder="Search..." />
      
      {/* Poor color contrast */}
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ 
          backgroundColor: '#777',
          color: '#999',
          border: 'none',
          padding: '10px',
          margin: '10px'
        }}
      >
        Clicked {count} times
      </button>

      {/* Missing keyboard interaction */}
      <div 
        onClick={() => setIsModalOpen(true)}
        style={{ 
          cursor: 'pointer',
          padding: '10px',
          border: '1px solid black'
        }}
      >
        Open Modal
      </div>

      {/* Missing ARIA attributes and focus management */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            border: '1px solid black'
          }}
        >
          <h2>Modal Content</h2>
          <p>This modal has accessibility issues!</p>
          <div onClick={() => setIsModalOpen(false)}>Close</div>
        </div>
      )}

      {/* Missing alt text */}
      <img src="https://placekitten.com/200/200" />

      {/* Incorrect heading order */}
      <h3>This heading skips h2</h3>

      {/* Empty link */}
      <a href="#"></a>
    </div>
  );
}
