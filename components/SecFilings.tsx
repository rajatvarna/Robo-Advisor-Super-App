import * as React from 'react';
import type { SecFiling } from '../types';
import DownloadIcon from './icons/DownloadIcon';
import Spinner from './icons/Spinner';

interface SecFilingsProps {
  filings: SecFiling[] | null;
}

const SecFilings: React.FC<SecFilingsProps> = ({ filings }) => {
  return (
    <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg h-full flex flex-col min-h-[444px]">
      <div className="p-4 border-b border-brand-border flex-shrink-0">
        <h3 className="text-lg font-bold text-brand-text">Recent SEC Filings</h3>
      </div>
      <div className="overflow-y-auto p-2 flex-grow">
        {filings === null ? (
            <div className="flex flex-col items-center justify-center h-full">
                <Spinner />
                <p className="mt-2 text-sm text-brand-text-secondary">Loading filings...</p>
            </div>
        ) : filings.length > 0 ? (
          <ul className="space-y-2">
            {filings.map((filing) => (
              <li key={filing.accessionNumber} className="bg-brand-primary p-3 rounded-md border border-brand-border hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-brand-text">{filing.form}</p>
                    <p className="text-xs text-brand-text-secondary">Filed: {filing.filingDate}</p>
                  </div>
                  <a
                    href={filing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Download ${filing.primaryDocument}`}
                    className="p-2 rounded-full hover:bg-brand-accent transition-colors"
                  >
                    <DownloadIcon className="w-5 h-5 text-brand-text-secondary" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-brand-text-secondary">No recent filings found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecFilings;