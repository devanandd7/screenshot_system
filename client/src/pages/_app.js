import "@/styles/globals.css";
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';

// Simple loading component
const LoadingComponent = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading AI Gallery...</p>
    </div>
  </div>
);

// Dynamically import components that use browser APIs to prevent SSR issues
const AppWithRouter = dynamic(() => import('../components/AppWithRouter'), {
  ssr: false,
  loading: LoadingComponent,
});

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppWithRouter />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }
        }}
      />
    </AuthProvider>
  );
}