import { useState } from 'react';

export default function ComplexForm() {
  const [selectedOption, setSelectedOption] = useState('');
  
  return (
    <form>
      {/* Missing fieldset and legend for radio group */}
      <div>
        <input
          type="radio"
          name="option"
          value="a"
          checked={selectedOption === 'a'}
          onChange={(e) => setSelectedOption(e.target.value)}
        />
        <input
          type="radio"
          name="option"
          value="b"
          checked={selectedOption === 'b'}
          onChange={(e) => setSelectedOption(e.target.value)}
        />
      </div>

      {/* Missing label and aria-describedby */}
      <div>
        <input
          type="text"
          placeholder="Search..."
        />
        <span>Must be at least 3 characters</span>
      </div>

      {/* Missing required field indication */}
      <div>
        <input
          type="email"
          required
        />
      </div>

      {/* Non-semantic custom dropdown */}
      <div onClick={() => console.log('clicked')}>
        <span>Select an option</span>
        <ul style={{ display: 'none' }}>
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      </div>

      {/* Button without type */}
      <button>Submit</button>
    </form>
  );
}
