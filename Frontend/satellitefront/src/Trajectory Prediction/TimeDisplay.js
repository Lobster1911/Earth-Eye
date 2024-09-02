import React, { useState, useEffect } from 'react';

const TimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const localTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 3600000); // BST is UTC+1
      setCurrentTime(localTime.toLocaleTimeString('en-GB', { hour12: false }) + '.' + localTime.getMilliseconds());
    }, 1);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.timeDisplay}>
      {currentTime}
    </div>
  );
};

const styles = {
  timeDisplay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: '5px 10px',
    fontSize: '16px',
    fontFamily: 'Monospace'
  }
};

export default TimeDisplay;
