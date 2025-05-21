import React, { useState } from 'react';
const InjuryIcon = ({ details }) => {
  const [show, setShow] = useState(false);

  return (
    <span className="injury-wrapper">
      <span
        onClick={() => setShow(!show)}
        className="injury-icon"
        title="Tap for injury info"
      >
        🚑
      </span>
      {show && (
        <div className="injury-tooltip">
          {details}
        </div>
      )}
    </span>
  );
};

export default InjuryIcon;
