import { test, expect } from '@playwright/test';

test.describe('CIRCLE Chat Messaging & Viewport E2E Verification', () => {
  test('User can open chat, view messages, send new message, and view stays at bottom', async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[CHAT_HOOK]') || text.includes('[DEBUG_')) {
        console.log('[BROWSER_LOG]', text);
      }
    });

    // 1. Visit Login page
    await page.goto('/login');

    // 2. Perform Login
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'Password123@!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3000/');

    // 3. Ensure Header is visible
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    // 4. Select a Circle (from home card or sidebar)
    const circleCard = page.locator('text=/Truy cập Vòng tròn|dbinh/i').first();
    await expect(circleCard).toBeVisible({ timeout: 10000 });
    await circleCard.click();

    // 5. Verify Chat Composer is visible
    const composer = page.locator('textarea');
    await expect(composer).toBeVisible({ timeout: 15000 });

    // 6. Inspect scroll container and composer sticky positioning
    const messageContainer = page.locator('div.flex-1.overflow-y-auto, div.flex-1.min-h-0.overflow-y-auto').first();
    await expect(messageContainer).toBeVisible();

    // Send a unique test message
    const uniqueText = `Playwright E2E verification message [${Date.now()}]`;
    await composer.fill(uniqueText);
    // Send multiple messages to test overflow scrolling and bottom alignment
    for (let i = 1; i <= 6; i++) {
      const text = `Test message #${i} [${Date.now()}]`;
      await composer.fill(text);
      await composer.press('Enter');
      await expect(composer).toHaveValue('', { timeout: 5000 });
      await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 5000 });
    }

    const lastUnique = `Final message #${Date.now()}`;
    await composer.fill(lastUnique);
    await composer.press('Enter');
    await expect(composer).toHaveValue('', { timeout: 5000 });
    await expect(page.locator(`text=${lastUnique}`)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    // Check scroll position and all messages
    const scrollInfo = await messageContainer.evaluate((el) => ({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    console.log('Scroll Info after sending:', scrollInfo);

    // Verify messages list has multiple items and did NOT wipe out history
    const bubbleCount = await page.locator('div.group.relative.flex.flex-col').count();
    console.log('Total message bubbles rendered:', bubbleCount);
    expect(bubbleCount).toBeGreaterThan(6);

    // Verify container scrollHeight is greater than clientHeight and scrolled to bottom
    expect(scrollInfo.scrollHeight).toBeGreaterThan(scrollInfo.clientHeight);
    const distanceFromBottom = scrollInfo.scrollHeight - scrollInfo.scrollTop - scrollInfo.clientHeight;
    console.log('Distance from bottom:', distanceFromBottom);
    expect(distanceFromBottom).toBeLessThan(150);

    await page.screenshot({ path: 'tests/e2e/chat-after-multiple.png', fullPage: false });
  });
});
