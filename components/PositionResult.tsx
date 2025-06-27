import React from 'react';
import type { AnalysisResult } from '../types.ts';
import { Position } from '../types.ts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PositionResultProps {
    result: AnalysisResult;
}

const getPositionStyles = (position: Position) => {
    switch (position) {
        case Position.BUY:
            return {
                bgColor: 'bg-green-100 dark:bg-green-900/50',
                textColor: 'text-green-800 dark:text-green-300',
                borderColor: 'border-green-400 dark:border-green-600',
                label: 'BUY'
            };
        case Position.SELL:
            return {
                bgColor: 'bg-red-100 dark:bg-red-900/50',
                textColor: 'text-red-800 dark:text-red-300',
                borderColor: 'border-red-400 dark:border-red-600',
                label: 'SELL'
            };
        case Position.HOLD:
            return {
                bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
                textColor: 'text-yellow-800 dark:text-yellow-300',
                borderColor: 'border-yellow-400 dark:border-yellow-600',
                label: 'HOLD'
            };
        default:
            return {
                bgColor: 'bg-gray-100 dark:bg-gray-700',
                textColor: 'text-gray-800 dark:text-gray-300',
                borderColor: 'border-gray-400 dark:border-gray-600',
                label: 'N/A'
            };
    }
};

export const PositionResult: React.FC<PositionResultProps> = ({ result }) => {
    const { position, confidence, reasoning } = result;
    const styles = getPositionStyles(position);
    const labelColor = 'text-gray-600 dark:text-gray-400';

    return (
        <div className={`p-6 rounded-lg border-2 ${styles.borderColor} ${styles.bgColor} shadow-md transition-all duration-300`}>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 className={`text-lg font-semibold ${labelColor} mb-1`}>Recommended Position</h3>
                    <p className={`text-5xl font-extrabold ${styles.textColor}`}>{styles.label}</p>
                </div>
                <div>
                    <h3 className={`text-lg font-semibold ${labelColor} mb-1`}>Confidence Level</h3>
                    <p className={`text-5xl font-extrabold ${styles.textColor}`}>{confidence}</p>
                </div>
            </div>
            <div>
                <h3 className={`text-lg font-semibold ${labelColor} mb-2`}>AI-Generated Reasoning</h3>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{children}</h1>,
                            h2: ({children}) => <h2 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</h3>,
                            p: ({children}) => <p className="mb-2">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="text-sm">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                            em: ({children}) => <em className="italic">{children}</em>,
                            code: ({children}) => <code className="bg-accent px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-900/20 py-2">{children}</blockquote>
                        }}
                    >
                        {result.reasoning}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};