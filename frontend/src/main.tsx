import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { App } from './App';
import './index.css';

// Service worker for offline support
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    console.log('New content available, refresh to update');
  },
  onOfflineReady() {
    console.log('CogniClaim is ready to work offline');
  },
});

// Auto-submit offline drafts on reconnect
import { getPendingDrafts, deleteDraft } from './lib/idb';
import { expenseApi } from './lib/api';

window.addEventListener('online', async () => {
  const drafts = await getPendingDrafts();
  for (const draft of drafts) {
    try {
      await expenseApi.submit({
        amount: draft.amount,
        currency: draft.currency,
        category: draft.category,
        description: draft.description,
        expense_date: draft.expense_date,
        merchant_name: draft.merchant_name,
      });
      await deleteDraft(draft.id);
      console.log('Synced offline draft:', draft.id);
    } catch (err) {
      console.error('Failed to sync draft:', draft.id, err);
    }
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
