import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './src/index.css';
import './src/custom.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>
    );
} else {
    console.error('Root container not found');
}