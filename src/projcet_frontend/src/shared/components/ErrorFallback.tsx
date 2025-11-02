import React from 'react';
import { Button, Result } from 'antd';
import { RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    resetErrorBoundary();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="500"
        title="Oops! Something went wrong"
        subTitle={
          <div className="space-y-2">
            <p className="text-gray-600">
              We encountered an unexpected error. Don't worry, our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <summary className="cursor-pointer font-medium text-red-800">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                  {error.message}
                  {error.stack && (
                    <>
                      {'\n\nStack Trace:\n'}
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        }
        extra={
          <div className="flex gap-3 justify-center">
            <Button 
              type="primary" 
              icon={<RefreshCw size={16} />}
              onClick={resetErrorBoundary}
            >
              Try Again
            </Button>
            <Button 
              icon={<Home size={16} />}
              onClick={handleGoHome}
            >
              Go Home
            </Button>
          </div>
        }
      />
    </div>
  );
};