
import * as React from 'react';
import { generateEducationalContent } from '../services/geminiService';
import type { EducationalContent } from '../types';
import Spinner from './icons/Spinner';
import { useApi } from '../contexts/ApiContext';

// --- ICONS ---
const ArticleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const VideoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55a1 1 0 011.45.89v4.22a1 1 0 01-1.45.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const PodcastIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const ContentTypeIcon: React.FC<{ type: EducationalContent['type'], className?: string }> = ({ type, className }) => {
    switch(type) {
        case 'Article': return <ArticleIcon className={className} />;
        case 'Video': return <VideoIcon className={className} />;
        case 'Podcast': return <PodcastIcon className={className} />;
        default: return null;
    }
}

const ContentCard: React.FC<{ item: EducationalContent }> = React.memo(({ item }) => (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-brand-secondary rounded-lg border border-brand-border shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
        <div className="h-40 bg-brand-primary flex items-center justify-center">
             <ContentTypeIcon type={item.type} className="w-16 h-16 text-brand-text-secondary opacity-50" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <span className="text-xs font-semibold uppercase text-brand-accent mb-2 flex items-center gap-1.5">
                <ContentTypeIcon type={item.type} className="w-3.5 h-3.5" />
                {item.type}
            </span>
            <h3 className="text-md font-bold text-brand-text mb-2 flex-grow">{item.title}</h3>
            <p className="text-sm text-brand-text-secondary line-clamp-2 mb-3">{item.summary}</p>
            <p className="text-xs text-brand-text-secondary mt-auto">Source: {item.sourceName}</p>
        </div>
    </a>
));


const EducationHub: React.FC = () => {
    const categories = ['All Topics', 'Investing 101', 'Market Analysis', 'FIRE Movement', 'Advanced Strategies', 'Real Estate'];
    const [activeCategory, setActiveCategory] = React.useState(categories[0]);
    const [content, setContent] = React.useState<EducationalContent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { apiMode, setApiMode } = useApi();

    React.useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await generateEducationalContent(activeCategory, apiMode);
                setContent(result);
            } catch (err: any) {
                if (err.message.includes('QUOTA_EXCEEDED')) {
                    setApiMode('opensource');
                    setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
                } else {
                    setError(err.message || 'Failed to load educational content.');
                }
                setContent([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [activeCategory, apiMode, setApiMode]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Education Hub</h1>
                <p className="mt-2 text-brand-text-secondary">Explore curated articles, videos, and podcasts to sharpen your financial knowledge.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                            activeCategory === category
                                ? 'bg-brand-accent text-white'
                                : 'bg-brand-secondary text-brand-text-secondary hover:bg-brand-border hover:text-brand-text'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {isLoading && (
                 <div className="flex flex-col items-center justify-center h-96">
                    <Spinner />
                    <p className="mt-4 text-brand-text-secondary">AI is curating the best content for you...</p>
                </div>
            )}
            
            {error && (
                <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">
                    <p className="font-bold">Could not load content</p>
                    <p>{error}</p>
                </div>
            )}
            
            {!isLoading && !error && content.length === 0 && (
                <div className="text-center my-8 text-brand-text-secondary p-4 bg-brand-secondary rounded-lg max-w-2xl mx-auto">
                    <p className="font-bold">No Content Found</p>
                    <p>The AI couldn't find any content for this category. Please try another one.</p>
                </div>
            )}

            {!isLoading && content.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.map(item => (
                        <ContentCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EducationHub;