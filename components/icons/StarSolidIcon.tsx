
import * as React from 'react';

const StarSolidIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006a.42.42 0 0 0 .384.285h5.257c1.125 0 1.587 1.554.77 2.21l-4.24 3.07a.42.42 0 0 0-.163.498l1.58 5.148c.313 1.02-.933 1.838-1.848 1.255l-4.24-3.07a.42.42 0 0 0-.498 0l-4.24 3.07c-.914.583-2.161-.235-1.848-1.255l1.58-5.148a.42.42 0 0 0-.163-.498l-4.24-3.07c-.818-.656-.355-2.21.77-2.21h5.257a.42.42 0 0 0 .384-.285l2.082-5.006Z" clipRule="evenodd" />
  </svg>
);

export default StarSolidIcon;
