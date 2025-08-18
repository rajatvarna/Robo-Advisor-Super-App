
import * as React from 'react';
import type { TranscriptsData } from '../types';
import Spinner from './icons/Spinner';

interface EarningsTranscriptsProps {
  transcriptsData: TranscriptsData | null;
}

const EarningsTranscripts: React.FC<EarningsTranscriptsProps> = ({ transcriptsData }) => {
  if (transcriptsData === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-brand-secondary rounded-lg border border-brand-border">
         <Spinner />
         <p className="mt-4 text-brand-text-secondary">Searching for latest earnings transcripts...</p>
      </div>
    );
  }

  if (transcriptsData.transcripts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-brand-secondary rounded-lg border border-brand-border">
        <p className="text-brand-text-secondary">No recent transcripts found.</p>
      </div>
    );
  }
  
  const { transcripts } = transcriptsData;

  return (
    <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-brand-border">
        <h3 className="text-lg font-bold text-brand-text">Recent Earnings Call Transcripts</h3>
      </div>
      <div className="p-4 space-y-4">
        {transcripts.map((item) => (
          <details key={item.quarter} className="bg-brand-primary p-4 rounded-lg border border-brand-border group">
            <summary className="font-semibold text-brand-text cursor-pointer list-none flex justify-between items-center">
              <div>
                <p>{item.quarter} {item.year}</p>
                <p className="text-xs text-brand-text-secondary font-normal">{item.date}</p>
              </div>
              <svg className="w-5 h-5 text-brand-text-secondary transform group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-4 pt-4 border-t border-brand-border">
              <h4 className="font-bold text-brand-text mb-2">AI Summary</h4>
              <p className="text-sm text-brand-text-secondary mb-4">{item.summary}</p>
              <h4 className="font-bold text-brand-text mb-2">AI Key Quote</h4>
              <blockquote className="text-sm text-brand-text-secondary italic border-l-4 border-brand-accent pl-4 py-2 whitespace-pre-wrap">{item.transcript}</blockquote>
            </div>
          </details>
        ))}
      </div>
      <div className="p-4 border-t border-brand-border">
        <p className="text-xs text-brand-text-secondary">Transcript data provided by Finnhub.</p>
      </div>
    </div>
  );
};

export default EarningsTranscripts;