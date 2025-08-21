
import * as React from 'react';

const CrownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 018.638 5.214a8.25 8.25 0 00-6.912 8.19A8.25 8.25 0 0012 21a8.25 8.25 0 0010.274-7.595 8.25 8.25 0 00-6.912-8.19z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l3.55 3.55M21 3l-3.55 3.55" />
    </svg>
);

export default CrownIcon;