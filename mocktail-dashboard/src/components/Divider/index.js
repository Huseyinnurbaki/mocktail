import React from 'react';
import { Gradient } from 'react-gradient';

const gradients = [
  ['#bd19d6', '#ea7d10'],
  ['#ff2121', '#25c668']
];

const gradientStyle = {
  borderStyle: 'solid',
  borderRadius: '5px',
  borderWidth: '1px',
  borderColor: '#1E262E',
  padding: '8px'
};

const Divider = () => {
  return (
    <Gradient
      gradients={gradients}
      property="background"
      duration={300}
      angle="45deg"
      className={gradientStyle}>
      <div
        style={{
          marginTop: '12px',
          marginBottom: '12px',
          height: '4px',
          width: '100%'
        }}
      />
    </Gradient>
  );
};

export default Divider;
