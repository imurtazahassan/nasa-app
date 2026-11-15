import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  title?: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected rendering error',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-[var(--status-warning)]" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-semibold text-[var(--text)]">
              {this.props.title || 'Telemetry Panel Recovery'}
            </h3>
            <p className="max-w-xs text-[13px] text-[var(--muted)]">{this.state.errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--line)] bg-[var(--raised)] px-3 py-1.5 text-[13px] font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reload Panel</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
