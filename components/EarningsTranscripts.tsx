
import * as React from 'react';
import type { EarningsTranscript } from '../types';
import Spinner from './icons/Spinner';

interface EarningsTranscriptsProps {
  transcripts: EarningsTranscript[] | null;
}

const EarningsTranscripts: React.FC<EarningsTranscriptsProps> = ({ transcripts }) => {
  if (transcripts === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-brand-secondary rounded-lg border border-brand-border">
         <Spinner />
         <p className="mt-4 text-brand-text-secondary">Searching for latest earnings transcripts...</p>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-brand-secondary rounded-lg border border-brand-border">
        <p className="text-brand-text-secondary">No recent transcripts found.</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-brand-border">
        <h3 className="text-lg font-bold text-brand-text">Recent Earnings Call Transcripts</h3>
      </div>
      <div className="p-4 space-y-4">
        {transcripts.map((item, index) => (
          <a
            key={`${item.year}-q${item.quarter}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-brand-primary p-4 rounded-lg border border-brand-border hover:border-brand-accent transition-colors"
          >
            <div className="font-semibold text-brand-text flex justify-between items-center">
              <div>
                <p>Q{item.quarter} {item.year}</p>
                <p className="text-xs text-brand-text-secondary font-normal">{item.date}</p>
              </div>
              <span className="text-xs font-bold text-brand-accent">View Transcript &rarr;</span>
            </div>
          </a>
        ))}
      </div>
      <div className="p-4 border-t border-brand-border">
        <p className="text-xs text-brand-text-secondary">Transcript data provided by Finnhub.</p>
      </div>
    </div>
  );
};

export default EarningsTranscripts;
