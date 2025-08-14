
import * as React from 'react';

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 0 0 9 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 15.75c0-4.418-3.582-8.25-8.25-8.25S3 11.332 3 15.75m16.5 0v.001M6.375 15.75a.75.75 0 0 1-.75-.75V11.25a.75.75 0 0 1 1.5 0v3.75a.75.75 0 0 1-.75.75Zm11.25 0a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-1.5 0v3.75a.75.75 0 0 0 .75.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6m-3 3.75v-3.75" />
  </svg>
);

export default TrophyIcon;
