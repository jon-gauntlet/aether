import { test, expect } from '@playwright/test';

let context;
let page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  await page.goto('http://localhost:5174');
  
  // Set up initial state
  await page.getByTestId('username-input').fill('TestUser1');
  
  // Wait for connection status to be visible first
  const connectionStatus = page.getByTestId('connection-status');
  await connectionStatus.waitFor({ state: 'visible', timeout: 10000 });
  
  // Then wait for connected state with longer timeout
  await expect(connectionStatus).toHaveText('Connected', { timeout: 10000 });
});

test.afterEach(async () => {
  // Clear state after each test
  await page.evaluate(() => {
    localStorage.clear();
    if (window.ws) window.ws.close();
  });
});

test.afterAll(async () => {
  await context.close();
});

test('should connect and send messages', async () => {
  // Test message sending
  const messageInput = page.getByTestId('message-input');
  const sendButton = page.getByTestId('send-button');
  
  await messageInput.fill('Test message');
  await sendButton.click();

  // Verify message appears
  const messageList = page.getByTestId('message-list');
  await expect(messageList).toContainText('Test message', { timeout: 5000 });
});

test('should handle connection errors', async () => {
  await page.evaluate(() => {
    window.WS_BASE_URL = 'ws://invalid-url:8000/ws';
  });
  await page.reload();

  const connectionStatus = page.getByTestId('connection-status');
  await expect(connectionStatus).toHaveText('Reconnecting...', { timeout: 5000 });
});

test('should handle channel isolation', async ({ browser }) => {
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  try {
    // Setup second user
    await page2.goto('http://localhost:5174');
    await page2.getByTestId('username-input').fill('TestUser2');
    
    // Wait for connection
    const connectionStatus2 = page2.getByTestId('connection-status');
    await expect(connectionStatus2).toHaveText('Connected', { timeout: 5000 });

    // Switch channels
    await page2.getByTestId('channel-select').selectOption('random');
    await page.getByTestId('channel-select').selectOption('general');

    // Send messages in both channels
    await page.getByTestId('message-input').fill('Message in general');
    await page.getByTestId('send-button').click();

    await page2.getByTestId('message-input').fill('Message in random');
    await page2.getByTestId('send-button').click();

    // Verify message isolation
    await expect(page.getByTestId('message-list')).toContainText('Message in general', { timeout: 5000 });
    await expect(page.getByTestId('message-list')).not.toContainText('Message in random');
    await expect(page2.getByTestId('message-list')).toContainText('Message in random', { timeout: 5000 });
    await expect(page2.getByTestId('message-list')).not.toContainText('Message in general');
  } finally {
    await page2.evaluate(() => {
      localStorage.clear();
      if (window.ws) window.ws.close();
    });
    await context2.close();
  }
}); 