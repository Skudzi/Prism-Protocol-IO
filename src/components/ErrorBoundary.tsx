import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected runtime error',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Prism Protocol ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-screen items-center justify-center bg-[#070B12] p-6 text-slate-100">
          <div className="w-full max-w-lg rounded-xl border border-rose-500/40 bg-[#0D131F] p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-rose-400">Sync / Runtime Error</h1>
            <p className="mt-2 break-words font-mono text-xs text-slate-300">
              {this.state.errorMessage}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
              >
                Reload Prism Protocol
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Continue Locally
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
