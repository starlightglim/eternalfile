import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store/index';
import App from './App';
import './index.css';

// Error boundary component for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You can log errors to a service like Sentry here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI when an error occurs
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>The application has encountered an unexpected error.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Reload Application
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-100 rounded">
              <summary>Error Details</summary>
              <p className="text-red-600">{this.state.error && this.state.error.toString()}</p>
              <pre className="mt-2 text-sm overflow-auto">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Add analytics
const initAnalytics = () => {
  // This is a placeholder for integrating an analytics service
  if (process.env.NODE_ENV === 'production') {
    // Initialize analytics only in production
    console.log('Analytics initialized');
    
    // Example: Send initial page view
    const trackPageView = () => {
      // Analytics tracking code would go here
      console.log('Page view tracked:', window.location.pathname);
    };
    
    // Track initial page load
    trackPageView();
    
    // Track route changes
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      trackPageView();
    };
    
    window.addEventListener('popstate', trackPageView);
  }
};

// Initialize app
const initialize = () => {
  // Add any app initialization logic here
  initAnalytics();
  
  // Render the app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <App />
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Start the application
initialize(); 