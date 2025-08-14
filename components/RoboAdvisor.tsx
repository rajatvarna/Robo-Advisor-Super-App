
import * as React from 'react';
import { questionnaire } from '../constants';
import { generatePortfolio } from '../services/geminiService';
import type { QuestionnaireAnswers, PortfolioSuggestion } from '../types';
import Spinner from './icons/Spinner';
import AllocationComparison from './AllocationComparison';
import { useApi } from '../contexts/ApiContext';

const initialAnswers: QuestionnaireAnswers = {
  age: '',
  horizon: '',
  goal: '',
  riskTolerance: '',
  liquidity: '',
};

interface RoboAdvisorProps {
  currentAllocation: { name: string; value: number }[];
}

const RoboAdvisor: React.FC<RoboAdvisorProps> = ({ currentAllocation }) => {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>(initialAnswers);
  const [suggestion, setSuggestion] = React.useState<PortfolioSuggestion | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { apiMode, setApiMode } = useApi();

  const handleAnswer = (key: keyof QuestionnaireAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < questionnaire.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await generatePortfolio(answers, apiMode);
      setSuggestion(result);
    } catch (err: any) {
      if (err.message.includes('QUOTA_EXCEEDED')) {
        setApiMode('opensource');
        setError("Live AI quota exceeded. Switched to offline fallback mode for this feature.");
      } else {
        setError('Failed to get suggestion from AI. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetAdvisor = () => {
    setStep(0);
    setAnswers(initialAnswers);
    setSuggestion(null);
    setError(null);
  };

  const renderQuestionnaire = () => {
    const currentQuestion = questionnaire[step];
    return (
      <div className="w-full max-w-2xl mx-auto bg-brand-secondary p-8 rounded-lg shadow-lg border border-brand-border">
        <h2 className="text-2xl font-bold mb-2 text-brand-text">Investment Profile Questionnaire</h2>
        <p className="text-brand-text-secondary mb-6">Step {step + 1} of {questionnaire.length}</p>
        
        <div className="h-1 w-full bg-brand-border rounded-full mb-8">
            <div 
                className="h-1 bg-brand-accent rounded-full transition-all duration-300" 
                style={{ width: `${((step + 1) / questionnaire.length) * 100}%` }}
            ></div>
        </div>

        <h3 className="text-xl mb-4 text-brand-text">{currentQuestion.question}</h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(currentQuestion.key as keyof QuestionnaireAnswers, option)}
              className={`w-full text-left p-4 rounded-md transition-colors duration-200 border ${
                answers[currentQuestion.key as keyof QuestionnaireAnswers] === option
                  ? 'bg-brand-accent border-brand-accent text-white'
                  : 'bg-brand-primary border-brand-border hover:bg-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="px-6 py-2 rounded-md bg-brand-border text-brand-text-secondary disabled:opacity-50 hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          {step < questionnaire.length - 1 ? (
            <button
              onClick={nextStep}
              disabled={!answers[currentQuestion.key as keyof QuestionnaireAnswers]}
              className="px-6 py-2 rounded-md bg-brand-accent text-white disabled:opacity-50 hover:bg-brand-accent-hover transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!answers[currentQuestion.key as keyof QuestionnaireAnswers]}
              className="px-6 py-2 rounded-md bg-green-600 text-white disabled:opacity-50 hover:bg-green-700 transition-colors"
            >
              Get Suggestion
            </button>
          )}
        </div>
      </div>
    );
  };
  
  const renderSuggestion = () => {
    if (!suggestion) return null;
    const { allocation, explanation, riskProfile } = suggestion;
   
    const riskProfileStyles: { [key: string]: string } = {
        'Conservative': 'bg-blue-200 text-blue-800',
        'Income': 'bg-blue-200 text-blue-800',
        'Moderate': 'bg-green-200 text-green-800',
        'Balanced Growth': 'bg-green-200 text-green-800',
        'Moderate Growth': 'bg-green-200 text-green-800',
        'Aggressive': 'bg-orange-200 text-orange-800',
        'Aggressive Growth': 'bg-orange-200 text-orange-800',
    };
    const riskStyle = riskProfileStyles[riskProfile] || 'bg-gray-200 text-gray-800';

    return (
      <div className="w-full max-w-4xl mx-auto bg-brand-secondary p-8 rounded-lg shadow-lg border border-brand-border animate-fade-in">
        <h2 className="text-3xl font-bold mb-2 text-center text-brand-text">Your Personalized Investment Plan</h2>
        <div className="text-center mb-6">
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${riskStyle}`}>
                Risk Profile: {riskProfile}
            </span>
        </div>
        
        <div className="space-y-8">
            <AllocationComparison 
              current={currentAllocation} 
              recommended={allocation} 
            />
            <div>
                <h3 className="text-xl font-bold mb-4 text-brand-text">AI Advisor's Rationale</h3>
                <p className="text-brand-text-secondary leading-relaxed whitespace-pre-wrap">{explanation}</p>
            </div>
        </div>
        
        <div className="text-center mt-8 pt-6 border-t border-brand-border space-x-4">
             <button
              onClick={resetAdvisor}
              className="px-8 py-3 rounded-md bg-brand-secondary border border-brand-border text-brand-text-secondary hover:bg-brand-primary transition-colors"
            >
              Decline & Start Over
            </button>
             <button
              // This button is for show, it doesn't do anything yet.
              onClick={() => alert('Portfolio rebalancing initiated (simulation).')}
              className="px-8 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
            >
              Accept & Rebalance
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      {isLoading ? (
         <div className="flex flex-col items-center justify-center h-64">
           <Spinner />
           <p className="mt-4 text-brand-text-secondary">Our AI is crafting your personal investment plan...</p>
         </div>
      ) : error ? (
        <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
          <p>{error}</p>
          <button
            onClick={resetAdvisor}
            className="mt-4 px-6 py-2 rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : suggestion ? (
        renderSuggestion()
      ) : (
        renderQuestionnaire()
      )}
    </div>
  );
};

export default RoboAdvisor;
