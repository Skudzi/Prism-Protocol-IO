import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected application error',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('Prism Protocol ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#070B12] p-6 text-center text-slate-100">
          <div className="max-w-md rounded-xl border border-rose-500/40 bg-slate-900/90 p-6 shadow-2xl">
            <h1 className="text-lg font-bold text-rose-400">Sync / Runtime Error</h1>
            <p className="mt-2 break-words text-xs text-slate-300">{this.state.message}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 cursor-pointer"
              >
                Reload Prism Protocol
              </button>
              <button
                type="button"
                onClick={() => {
                  void signOut(auth).finally(() => window.location.reload());
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Sign Out &amp; Continue Locally
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
