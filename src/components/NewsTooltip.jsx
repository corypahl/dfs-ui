import React, { useState } from 'react';
import './NewsTooltip.css';

const NewsTooltip = ({ details }) => {
  const [show, setShow] = useState(false);

  return (
    <span className="news-wrapper">
      <span
        onClick={() => setShow(!show)}
        className="news-icon"
        title="Tap for news"
      >
        📰
      </span>
      {show && (
        <div className="news-tooltip">
          {details}
        </div>
      )}
    </span>
  );
};

export default NewsTooltip;
