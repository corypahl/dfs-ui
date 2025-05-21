import React, { useState } from 'react';

// Create an icon component that exactly follows the InjuryIcon pattern
const MatchupIcon = ({ matchup, children }) => {
  const [show, setShow] = useState(false);
  
  // We need to convert matchup data to a single string detail
  if (!matchup) return children;
  
  // Create a formatted string from the matchup data
  const { opponent, spread, total, gameTime } = matchup;
  
  // Format time as "7:46 PM" instead of full date
  let timeStr = "TBD";
  if (gameTime) {
    const date = new Date(gameTime);
    timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  
  // Format in the compact format: "STL (7:46 PM) -1.5, OU 7.5"
  const spreadStr = spread >= 0 ? `+${spread}` : `${spread}`;
  const details = `${opponent} (${timeStr}) ${spreadStr}, OU ${total}`;
  
  // Create an icon that mimics the matchup info
  return (
    <span className="injury-wrapper">
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        className="injury-icon"
        title="Tap for matchup info"
      >
        {children}
      </span>
      {show && (
        <div className="injury-tooltip">
          {details}
        </div>
      )}
    </span>
  );
};

export default MatchupIcon;
