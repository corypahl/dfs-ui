import React, { useState } from 'react';

const InjuryIcon = ({ details }) => {
  const [show, setShow] = useState(false);

  return (
    <span style={{ position: 'relative' }}>
      <span
        onClick={() => setShow(!show)}
        style={{ marginLeft: '6px', cursor: 'pointer' }}
        title="Tap for injury info"
      >
        🚑
      </span>
      {show && (
        <div
          style={{
            position: 'absolute',
            top: '1.5em',
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            padding: '6px',
            borderRadius: '6px',
            zIndex: 999,
            width: '200px',
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {details}
        </div>
      )}
    </span>
  );
};

export default InjuryIcon;
