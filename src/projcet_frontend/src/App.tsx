import React from 'react';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router';
import InboxPanel from './components/inbox/InboxPanel';
import GlobalLoadingOverlay from './shared/components/GlobalLoadingOverlay';
import './styles/style.css';

function App() {
  return (
    <AppProviders>
      <div className="App">
        <AppRouter />
        <InboxPanel />
        
        <GlobalLoadingOverlay />
      </div>
    </AppProviders>
  );
}

export default App;
