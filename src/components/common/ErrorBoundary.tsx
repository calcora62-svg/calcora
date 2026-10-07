import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-muted-bg/5">
          <div className="max-w-md w-full bg-card border border-border-color rounded-3xl p-8 text-center space-y-6 shadow-lg">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-fg text-sm leading-relaxed">
              We're sorry, but something unexpected happened. Please refresh the page to try again.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs font-mono rounded-xl border border-red-200 dark:border-red-900/50 break-all text-left">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleRefresh}
              className="w-full py-3 px-4 text-sm font-bold bg-primary hover:bg-primary-600 text-white rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
            <p className="text-xs text-muted-fg">
              If the problem continues, please contact us at calcora62@gmail.com
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}