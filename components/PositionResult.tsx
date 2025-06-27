import React from 'react';
import type { AnalysisResult } from '../types.ts';
import { Position } from '../types.ts';

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
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{reasoning}</p>
            </div>
        </div>
    );
};