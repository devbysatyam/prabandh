import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; receives a `reset` callback to retry rendering. */
  fallback?: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches render-time errors in its subtree so one broken tab cannot blank the whole app.
 * Only the error class name is logged, never the message or stack (they may contain plan data).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo): void {
    console.error(`[ErrorBoundary] ${error.name}`);
  }

  private readonly reset = (): void => {
    this.setState({ failed: false });
  };

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return (
      <div role="alert" className="card m-6 space-y-3 text-center">
        <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
          Something went wrong
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          This section hit an unexpected problem. Your plan is safe in this browser.
        </p>
        <button type="button" onClick={this.reset} className="btn-primary text-xs">
          Try again
        </button>
      </div>
    );
  }
}
