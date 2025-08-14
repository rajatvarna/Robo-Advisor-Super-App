import * as React from 'react';
import type { FinancialStatementsData } from '../types';
import Spinner from './icons/Spinner';

interface FinancialStatementsProps {
  data: FinancialStatementsData | null;
}

type Tab = 'income' | 'balance' | 'cashflow';

const FinancialStatements: React.FC<FinancialStatementsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('income');

  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-brand-primary rounded-b-lg">
           <Spinner />
           <p className="mt-4 text-brand-text-secondary">Generating financial data with AI...</p>
        </div>
      );
    }
    
    const formatNumber = (num: number) => {
        if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
        if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
        if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
        return num.toString();
    };


    switch (activeTab) {
      case 'income':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-text-secondary">
              <thead className="text-xs text-brand-text uppercase bg-brand-primary">
                <tr>
                  <th scope="col" className="px-6 py-3">Year</th>
                  <th scope="col" className="px-6 py-3 text-right">Revenue</th>
                  <th scope="col" className="px-6 py-3 text-right">Net Income</th>
                </tr>
              </thead>
              <tbody>
                {data.incomeStatement.map(item => (
                  <tr key={item.year} className="border-b border-brand-border">
                    <td className="px-6 py-4 font-medium text-brand-text tabular-nums">{item.year}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.revenue)}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.netIncome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'balance':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-text-secondary">
              <thead className="text-xs text-brand-text uppercase bg-brand-primary">
                <tr>
                  <th scope="col" className="px-6 py-3">Year</th>
                  <th scope="col" className="px-6 py-3 text-right">Total Assets</th>
                  <th scope="col" className="px-6 py-3 text-right">Total Liabilities</th>
                  <th scope="col" className="px-6 py-3 text-right">Total Equity</th>
                </tr>
              </thead>
              <tbody>
                {data.balanceSheet.map(item => (
                  <tr key={item.year} className="border-b border-brand-border">
                    <td className="px-6 py-4 font-medium text-brand-text tabular-nums">{item.year}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.totalAssets)}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.totalLiabilities)}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.totalEquity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'cashflow':
         return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-text-secondary">
              <thead className="text-xs text-brand-text uppercase bg-brand-primary">
                <tr>
                  <th scope="col" className="px-6 py-3">Year</th>
                  <th scope="col" className="px-6 py-3 text-right">Operating</th>
                  <th scope="col" className="px-6 py-3 text-right">Investing</th>
                  <th scope="col" className="px-6 py-3 text-right">Financing</th>
                </tr>
              </thead>
              <tbody>
                {data.cashFlow.map(item => (
                  <tr key={item.year} className="border-b border-brand-border">
                    <td className="px-6 py-4 font-medium text-brand-text tabular-nums">{item.year}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.operatingCashFlow)}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.investingCashFlow)}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatNumber(item.financingCashFlow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
          activeTab === tab 
          ? 'border-b-2 border-brand-accent text-brand-accent' 
          : 'text-brand-text-secondary hover:text-brand-text'
        }`}
      >
        {label}
      </button>
  );

  return (
    <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-brand-border">
        <h3 className="text-lg font-bold text-brand-text">Financial Statements (Last 10 Years, AI Generated)</h3>
      </div>
      <div className="border-b border-brand-border">
        <nav className="flex space-x-2 px-4">
          <TabButton tab="income" label="Income Statement" />
          <TabButton tab="balance" label="Balance Sheet" />
          <TabButton tab="cashflow" label="Cash Flow" />
        </nav>
      </div>
      <div className="p-4">{renderContent()}</div>
    </div>
  );
};

export default FinancialStatements;