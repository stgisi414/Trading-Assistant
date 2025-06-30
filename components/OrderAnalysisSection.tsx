import React from 'react';
import type { OrderAnalysis } from '../types.ts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OrderAnalysisSectionProps {
    orderAnalysis: OrderAnalysis;
}

export const OrderAnalysisSection: React.FC<OrderAnalysisSectionProps> = ({ orderAnalysis }) => {
    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
            <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-1v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-1c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" />
                </svg>
                Order Analysis
            </h4>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orderAnalysis.stopLoss && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                            <h5 className="font-medium text-red-800 dark:text-red-300 mb-1">Stop Loss</h5>
                            <p className="text-lg font-bold text-red-700 dark:text-red-400">${orderAnalysis.stopLoss.toFixed(2)}</p>
                        </div>
                    )}

                    {orderAnalysis.takeProfit && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <h5 className="font-medium text-green-800 dark:text-green-300 mb-1">Take Profit</h5>
                            <p className="text-lg font-bold text-green-700 dark:text-green-400">${orderAnalysis.takeProfit.toFixed(2)}</p>
                        </div>
                    )}
                </div>

                {orderAnalysis.limitOrders && orderAnalysis.limitOrders.length > 0 && (
                    <div>
                        <h5 className="font-medium text-orange-800 dark:text-orange-300 mb-2">Limit Orders</h5>
                        <div className="space-y-2">
                            {orderAnalysis.limitOrders.map((order, index) => (
                                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            order.type === 'BUY' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                        }`}>
                                            {order.type}
                                        </span>
                                        <span className="font-bold text-blue-700 dark:text-blue-400">${order.price.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 prose prose-xs dark:prose-invert max-w-none">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({children}) => <p className="mb-1">{children}</p>,
                                                ul: ({children}) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                                                li: ({children}) => <li>{children}</li>,
                                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                                code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">{children}</code>,
                                            }}
                                        >
                                            {order.reasoning}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};