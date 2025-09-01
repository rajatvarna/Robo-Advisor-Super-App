


import * as React from 'react';
import type { Chat } from '@google/genai';
import { createChat, generateFollowUpQuestions } from '../services/geminiService';
// FIX: Imported missing ChatMessage type.
import type { ChatMessage } from '../types';
import Spinner from './icons/Spinner';
import SendIcon from './icons/SendIcon';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XCircleIcon from './icons/XCircleIcon';
import { marked } from 'marked';
import { useApi } from '../contexts/ApiContext';

const Chatbot: React.FC = () => {
    const [chatSession, setChatSession] = React.useState<Chat | null>(null);
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
    const [imageBase64, setImageBase64] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { apiMode, setApiMode, isFallbackMode } = useApi();

    React.useEffect(() => {
        const initChat = () => {
            try {
                const session = createChat(apiMode);
                setChatSession(session);
                setMessages([
                    {
                        id: 'initial-message',
                        role: 'model',
                        text: "Hello! I'm your AI financial assistant. How can I help you today? You can ask me about investment strategies, or upload an image of a stock chart or portfolio for analysis.",
                        recommendedQuestions: [
                            "What are some common investment strategies for beginners?",
                            "Analyze the attached stock chart.",
                            "What do you think of this portfolio allocation?",
                        ]
                    }
                ]);
            } catch (err: any) {
                if (err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
                setError(err.message || 'Failed to initialize the chatbot.');
            }
        };
        initChat();
    }, [apiMode, setApiMode]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(scrollToBottom, [messages]);
    
    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: {
                data: await base64EncodedDataPromise,
                mimeType: file.type,
            },
        };
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setSelectedImage(null);
        setImageBase64(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async (messageText: string) => {
        if (!chatSession || isLoading || (!messageText.trim() && !selectedImage)) return;

        setIsLoading(true);
        setError(null);
        
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: messageText.trim(),
            image: imageBase64,
        };
        const modelMessage: ChatMessage = {
            id: `model-${Date.now()}`,
            role: 'model',
            text: '',
            isTyping: true,
        };

        setMessages(prev => [...prev.map(m => ({ ...m, recommendedQuestions: [] })), userMessage, modelMessage]);
        setInputValue('');
        removeImage();

        if (isFallbackMode) {
            const fallbackText = "I am currently in offline mode due to API limits. I can only provide pre-canned responses. For example, diversification is a good investment strategy.";
            setMessages(prev => prev.map(msg => msg.id === modelMessage.id ? { ...modelMessage, text: fallbackText, isTyping: false } : msg));
            setIsLoading(false);
            return;
        }

        try {
            const contents = [];
            if (selectedImage) {
                const imagePart = await fileToGenerativePart(selectedImage);
                contents.push(imagePart);
            }
            if (messageText.trim()) {
                contents.push({ text: messageText.trim() });
            }

            const stream = await chatSession.sendMessageStream({ message: contents });
            
            let accumulatedText = '';
            for await (const chunk of stream) {
                accumulatedText += chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessage.id ? { ...msg, text: accumulatedText } : msg
                    )
                );
            }
            
            const finalModelMessage: ChatMessage = { ...modelMessage, text: accumulatedText, isTyping: false };
            setMessages(prev => prev.map(msg => msg.id === modelMessage.id ? finalModelMessage : msg));

            const currentHistory = [...messages.filter(m => m.id !== modelMessage.id), userMessage, finalModelMessage];
            const questions = await generateFollowUpQuestions(currentHistory, apiMode);
            
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessage.id ? { ...msg, recommendedQuestions: questions } : msg
                )
            );

        } catch (err: any) {
            const errorMessage = `Sorry, I encountered an error: ${err.message}. Please try again.`;
            if (err.message.includes('QUOTA_EXCEEDED')) {
                setApiMode('opensource');
            }
            setError(errorMessage);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessage.id ? { ...msg, text: errorMessage, isTyping: false } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(inputValue);
    };

    const handleRecommendedQuestionClick = (question: string) => {
        handleSendMessage(question);
    };

    const renderMessageContent = (message: ChatMessage) => {
        const dirtyHtml = marked.parse(message.text, { gfm: true, breaks: true });
        return (
            <div className="space-y-3">
                {message.image && <img src={message.image} alt="User upload" className="mt-2 rounded-lg max-w-xs max-h-64 object-contain" />}
                <div className="chatbot-content" dangerouslySetInnerHTML={{ __html: dirtyHtml as string }} />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto bg-brand-secondary border border-brand-border rounded-lg shadow-2xl animate-fade-in">
            <div className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
                {messages.map((message) => (
                    <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'model' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                                <BotIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-md lg:max-w-lg p-3 rounded-lg ${
                            message.role === 'model' 
                                ? 'bg-brand-primary text-brand-text' 
                                : 'bg-brand-accent text-white'
                        }`}>
                            {message.isTyping ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                                </div>
                            ) : renderMessageContent(message)}
                            {message.recommendedQuestions && message.recommendedQuestions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-brand-border/50 space-y-2">
                                    {message.recommendedQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleRecommendedQuestionClick(q)}
                                            disabled={isLoading}
                                            className="w-full text-left text-xs p-2 rounded-md bg-brand-secondary hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                         {message.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-text-secondary flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-brand-primary" />
                            </div>
                        )}
                    </div>
                ))}
                {error && <div className="text-center text-red-400 p-2 text-sm">{error}</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-brand-border bg-brand-primary rounded-b-lg">
                {imageBase64 && (
                    <div className="mb-2 p-2 bg-brand-secondary rounded-lg relative w-fit">
                        <img src={imageBase64} alt="Selected preview" className="h-20 w-auto rounded-md object-cover" />
                        <button onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-700 rounded-full text-white hover:bg-gray-600">
                           <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex-shrink-0 w-12 h-12 bg-brand-secondary hover:bg-brand-border text-brand-text-secondary hover:text-brand-text rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                        aria-label="Attach image"
                    >
                        <PaperclipIcon className="w-6 h-6"/>
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask a question or upload an image..."
                        className="w-full p-3 bg-brand-secondary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                        disabled={isLoading}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleFormSubmit(e); }}}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                        className="flex-shrink-0 w-12 h-12 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                        aria-label="Send message"
                    >
                        {isLoading ? <Spinner /> : <SendIcon className="w-6 h-6"/>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;