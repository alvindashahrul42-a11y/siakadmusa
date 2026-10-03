import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-rose-500" />
            <div className="p-8 text-center space-y-5">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border-2 border-red-100">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Terjadi Kesalahan</h2>
                <p className="text-sm text-gray-400 mt-1">Halaman tidak dapat ditampilkan</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-left">
                <p className="text-red-700 text-xs font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Muat Ulang Halaman
                </button>
                <button
                  onClick={() => { this.setState({ error: null }); window.history.back(); }}
                  className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Kembali
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
