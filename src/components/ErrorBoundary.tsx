import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Evita que un error de render deje la pantalla en blanco (o con la 🔧 del
 * index.html) sin explicación. Muestra el mensaje y permite reintentar.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[TallerPro] Error de render:', error, info.componentStack);
  }

  private reiniciar = () => {
    this.setState({ error: null });
  };

  private recargar = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
          <div className="text-4xl">🔧</div>
          <h1 className="text-lg font-bold text-gray-900">Algo falló al mostrar esta pantalla</h1>
          <p className="text-sm text-gray-600 break-words">{error.message}</p>
          <div className="flex gap-3">
            <button
              onClick={this.reiniciar}
              className="flex-1 rounded-xl bg-blue-600 text-white font-semibold py-3 active:bg-blue-700"
            >
              Reintentar
            </button>
            <button
              onClick={this.recargar}
              className="flex-1 rounded-xl bg-gray-100 text-gray-800 font-semibold py-3 active:bg-gray-200"
            >
              Recargar
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Si el problema continúa, cierra sesión y vuelve a entrar.
          </p>
        </div>
      </div>
    );
  }
}
