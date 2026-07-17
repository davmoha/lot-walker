import api from './api';
import { getQueuedIssues, removeQueuedIssue } from './offlineQueue';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered:', reg.scope);

          // Listen for sync messages from SW
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_ISSUES') {
              replayQueuedIssues();
            }
          });
        })
        .catch((err) => console.warn('SW registration failed:', err));
    });

    // Also replay on reconnect
    window.addEventListener('online', () => {
      console.log('Back online — replaying queued issues…');
      replayQueuedIssues();
    });
  }
}

export async function replayQueuedIssues() {
  const queue = await getQueuedIssues();
  for (const item of queue) {
    try {
      await api.post('/issues', item.payload);
      if (item.id !== undefined) await removeQueuedIssue(item.id);
    } catch (err) {
      console.warn('Failed to replay queued issue:', err);
    }
  }
}
