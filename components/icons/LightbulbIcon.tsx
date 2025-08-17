import * as React from 'react';

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c-1.42 0-2.796-.347-3.995-.97a7.5 7.5 0 0 1-1.07-1.07m11.06-11.06a7.5 7.5 0 0 0-1.07-1.07m-11.06 0a7.5 7.5 0 0 0-1.07 1.07m11.06 11.06a7.5 7.5 0 0 1 1.07 1.07m-11.06 0a7.5 7.5 0 0 1 1.07-1.07" />
  </svg>
);

export default LightbulbIcon;
