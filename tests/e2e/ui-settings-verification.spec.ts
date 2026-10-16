import { test, expect } from '@playwright/test';

test.describe('UI Flat Verification & System Settings', () => {
  test('Capture screenshots of light/dark themes and modals', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/01-login-light.png' });

    // Login
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'Password123@!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/02-home-light.png' });

    // Find and click avatar button in header
    const avatarBtn = page.locator('header .relative button').last();
    if (await avatarBtn.isVisible()) {
      await avatarBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/03-avatar-menu.png' });

      // Click "Cài đặt hệ thống"
      const settingsOption = page.locator('button:has-text("Cài đặt hệ thống")');
      if (await settingsOption.isVisible()) {
        await settingsOption.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/e2e/screenshots/04-system-settings-modal.png' });

        // Switch to sessions tab
        const sessionsTab = page.locator('button:has-text("Phiên đăng nhập")');
        if (await sessionsTab.isVisible()) {
          await sessionsTab.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'tests/e2e/screenshots/05-system-settings-sessions.png' });
        }

        // Close modal
        await page.locator('button:has-text("Đóng")').first().click();
        await page.waitForTimeout(500);
      }

      // Reopen avatar menu to check profile modal
      await avatarBtn.click();
      await page.waitForTimeout(500);
      const profileOption = page.locator('button:has-text("Hồ sơ cá nhân")');
      if (await profileOption.isVisible()) {
        await profileOption.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/e2e/screenshots/06-profile-modal.png' });
      }
    }
  });
});
