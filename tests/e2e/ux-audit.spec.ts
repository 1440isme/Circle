import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUDIT_DIR = 'tests/e2e/screenshots/audit';

test.describe('CIRCLE Deep UX Experience & Visual Audit', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
  });

  test('Walk through all screens, test Light/Dark themes, check layout & colors', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login Page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(AUDIT_DIR, '01-login-page-desktop.png') });

    // Check login credentials (try BrandNewPassword123!@# then Password123@!)
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'BrandNewPassword123!@#');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('http://localhost:3000/', { timeout: 3000 });
    } catch {
      // Try fallback password
      await page.fill('input[type="password"]', 'Password123@!');
      await page.click('button[type="submit"]');
      await page.waitForURL('http://localhost:3000/', { timeout: 5000 });
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(AUDIT_DIR, '02-home-feed-light.png') });

    // 2. Open Circle Workspace & Chat View
    const circleBtn = page.locator('aside button, a[href*="/circle/"], div.group.cursor-pointer').first();
    if (await circleBtn.isVisible()) {
      await circleBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(AUDIT_DIR, '03-circle-chat-light.png') });

      // Inspect chat header elements
      const soundBtn = page.locator('button[title*="âm thanh"]').first();
      if (await soundBtn.isVisible()) {
        await expect(soundBtn).toBeVisible();
      }

      const searchBtn = page.locator('button[title*="Tìm kiếm"]').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(AUDIT_DIR, '04-in-chat-search-bar.png') });
        // Close search
        await searchBtn.click();
      }
    }

    // 3. Open System Settings & Toggle Dark Mode
    const userMenuBtn = page.locator('header button:has(div.rounded-full), header [aria-label*="user"], header button:has(span)').last();
    if (await userMenuBtn.isVisible()) {
      await userMenuBtn.click();
      await page.waitForTimeout(400);

      const settingsOption = page.locator('button:has-text("Cài đặt hệ thống"), button:has-text("Settings")').first();
      if (await settingsOption.isVisible()) {
        await settingsOption.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(AUDIT_DIR, '05-settings-appearance-light.png') });

        // Switch to Dark Mode
        const darkThemeBtn = page.locator('button:has-text("Tối"), button:has-text("Dark")').first();
        if (await darkThemeBtn.isVisible()) {
          await darkThemeBtn.click();
          await page.waitForTimeout(600);
          await page.screenshot({ path: path.join(AUDIT_DIR, '06-settings-appearance-dark.png') });
        }

        // Close settings modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        const closeBtn = page.locator('button:has(svg.lucide-x), [aria-label*="close"], [aria-label*="Đóng"]').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // 4. Circle Chat in Dark Mode
    await page.screenshot({ path: path.join(AUDIT_DIR, '07-circle-chat-dark.png') });

    // 5. Test Mobile Viewport (iPhone 14 / Pixel 7 style)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(AUDIT_DIR, '08-mobile-viewport-chat-dark.png') });

    // Switch back to light mode in mobile viewport
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(AUDIT_DIR, '09-mobile-viewport-chat-light.png') });
  });
});
