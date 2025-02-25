import { useState } from 'react';

export default function DynamicCounter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      {/* Missing aria-label */}
      <button onClick={() => setCount(count + 1)}>
        {count}
      </button>

      {/* Dynamically added content without aria-live */}
      <div>
        {count > 5 && (
          <p>You've clicked a lot!</p>
        )}
      </div>
    </div>
  );
}
