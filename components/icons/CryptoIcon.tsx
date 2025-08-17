
import * as React from 'react';

const CryptoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3H12v2.528M15.12 4.88l-1.03-1.784M16.5 7.5h2.528M18.12 9.12l1.03-1.784M17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25v2.528M10.88 19.12l1.03 1.784M9 16.5H6.472M5.88 14.88l-1.03 1.784m.001-9.784l1.03 1.784M9 7.5h2.528M10.88 5.88l-1.03-1.784" />
  </svg>
);

export default CryptoIcon;
