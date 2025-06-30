
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 dark:bg-red-900/10 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Application Error
            </h1>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Error Details:
                </h2>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto text-red-600 dark:text-red-400">
                  {this.state.error?.message}
                </pre>
              </div>
              {this.state.errorInfo && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Stack Trace:
                  </h2>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto text-gray-600 dark:text-gray-400">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
