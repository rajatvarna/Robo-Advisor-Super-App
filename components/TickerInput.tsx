
import * as React from 'react';
import Spinner from './icons/Spinner';
import { tickers } from '../services/tickerData';

interface TickerInputProps {
  onTickerSubmit: (ticker: string) => void;
  isLoading: boolean;
}

const TickerInput: React.FC<TickerInputProps> = ({ onTickerSubmit, isLoading }) => {
  const [inputValue, setInputValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<{ symbol: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const wrapperRef = React.useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length > 0) {
      const filteredSuggestions = tickers
        .filter(t => t.symbol.toLowerCase().startsWith(value.toLowerCase()) || t.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 7); // Limit to 7 suggestions
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (ticker: string) => {
    setInputValue(ticker);
    setShowSuggestions(false);
    onTickerSubmit(ticker);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onTickerSubmit(inputValue.trim().toUpperCase());
      setShowSuggestions(false);
    }
  };
  
  // Close suggestions when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);


  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8 relative" ref={wrapperRef}>
       <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder="Enter stock ticker (e.g., AAPL, GOOGL)"
          className="w-full p-4 pl-5 pr-32 bg-brand-secondary border-2 border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all duration-200 shadow-sm"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="absolute inset-y-0 right-0 m-1.5 px-6 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-lg transition-colors duration-200 disabled:bg-brand-text-secondary disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <Spinner /> : 'Analyze'}
        </button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-brand-secondary border border-brand-border rounded-lg mt-1 overflow-hidden shadow-2xl">
          {suggestions.map(s => (
            <li
              key={s.symbol}
              onClick={() => handleSelect(s.symbol)}
              className="px-4 py-3 cursor-pointer hover:bg-brand-accent hover:text-white"
            >
              <span className="font-bold">{s.symbol}</span>
              <span className="ml-3 text-brand-text-secondary">{s.name}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default TickerInput;