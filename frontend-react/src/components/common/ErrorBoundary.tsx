import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : 'Erro inesperado' };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <div className="text-3xl">💥</div>
          <p className="mt-3 text-lg font-semibold text-gray-900">Algo deu errado</p>
          {this.state.message && (
            <p className="mt-2 max-w-xl text-sm text-gray-600">{this.state.message}</p>
          )}
          <p className="mt-4 text-xs text-gray-400">Tente recarregar a página ou refazer a ação.</p>
        </div>
      );
    }

    return this.props.children;
  }
}