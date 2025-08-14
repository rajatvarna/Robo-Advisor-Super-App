
import * as React from 'react';

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.321h5.365c.507 0 .713.68-.342.986l-4.318 3.138a.563.563 0 0 0-.182.635l1.644 5.332c.194.498-.437.94-1.003.586L12 17.331l-4.52 3.282c-.566.411-1.197-.088-1.003-.586l1.644-5.332a.563.563 0 0 0-.182-.635l-4.318-3.138c-.553-.406-.342-1.186.342-.986h5.365a.563.563 0 0 0 .475-.321L11.48 3.5Z" />
  </svg>
);

export default StarIcon;
