import { WidgetApi } from 'matrix-widget-api';

// Initialize widget API
const widgetApi = new WidgetApi();

// Handle presence changes
widgetApi.on('presence', async (event) => {
  if (event.presence === 'away') {
    // AI Agent activation point
    const response = await fetch('/ai/respond', {
      method: 'POST',
      body: JSON.stringify({ status: 'away', userId: event.userId })
    });
  }
});

// Start widget
widgetApi.start(); 