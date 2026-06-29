'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: 'var(--ry-green)' }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <p className="mt-4 text-xs text-red-500 font-mono max-w-sm break-all">{this.state.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
