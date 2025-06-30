import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './src/index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <AppErrorBoundary>
            <App />
        </AppErrorBoundary>
    );
} else {
    console.error('Root container not found');
}