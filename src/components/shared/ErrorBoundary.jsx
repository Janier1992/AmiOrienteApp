
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border-2 border-dashed border-red-200 m-4">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Ha ocurrido un error inesperado en este componente. Por favor intenta recargar.
          </p>
          <Button onClick={this.handleReset} variant="destructive">
            Recargar Página
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-gray-900 text-red-400 rounded text-xs text-left w-full overflow-auto max-w-lg">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
