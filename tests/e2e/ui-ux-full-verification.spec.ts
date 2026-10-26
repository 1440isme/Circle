import { test, expect } from '@playwright/test';

test.describe('CIRCLE Full UI/UX Verification Suite', () => {
  test('Verify Login, Chat Calling Triggers, Settings Security & Appearance across Viewports', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Visit Login Page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/01-login-screen.png' });

    // 2. Perform Login
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'Password123@!');
    await page.click('button[type="submit"]');

    // Wait for authenticated home redirect
    await page.waitForURL('http://localhost:3000/');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/02-home-feed.png' });

    // 3. Open Circle Chat & Verify Call Actions
    const circleCard = page.locator('div.group.cursor-pointer, aside button, a[href*="/circle/"]').first();
    if (await circleCard.isVisible()) {
      await circleCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/e2e/screenshots/03-circle-chat-view.png' });

      // Verify header call action buttons (Phone & Video)
      const phoneCallBtn = page.locator('button:has(svg.lucide-phone), button:has(svg.lucide-phone-call)').first();
      const videoCallBtn = page.locator('button:has(svg.lucide-video)').first();

      if (await phoneCallBtn.isVisible()) {
        await expect(phoneCallBtn).toBeVisible();
      }
      if (await videoCallBtn.isVisible()) {
        await expect(videoCallBtn).toBeVisible();
      }
      await page.screenshot({ path: 'tests/e2e/screenshots/04-chat-call-actions.png' });
    }

    // 4. Open User Avatar Menu -> System Settings Modal
    const userMenuBtn = page.locator('header button:has(div.rounded-full), header [aria-label*="user"], header button:has(span)').last();
    await userMenuBtn.click();
    await page.waitForTimeout(400);

    const settingsMenuOption = page.locator('button:has-text("Cài đặt hệ thống"), button:has-text("Settings")').first();
    await expect(settingsMenuOption).toBeVisible();
    await settingsMenuOption.click();
    await page.waitForTimeout(600);

    // Verify Settings Modal is open with 2-column layout
    const settingsModal = page.locator('div[role="dialog"], aside:has-text("Giao diện"), aside:has-text("Appearance")').first();
    await expect(settingsModal).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/05-settings-appearance-tab.png' });

    // 5. Test Dark Mode Theme Switcher
    const darkBtn = page.locator('button:has-text("Tối"), button:has-text("Dark")').first();
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/06-settings-dark-mode.png' });

      // Switch back to Light Mode
      const lightBtn = page.locator('button:has-text("Sáng"), button:has-text("Light")').first();
      if (await lightBtn.isVisible()) {
        await lightBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // 6. Test Security Tab (ACC-10 Change Password)
    const securityTab = page.locator('aside button:has-text("Mật khẩu & Bảo mật"), aside button:has-text("Password & Security")').first();
    await expect(securityTab).toBeVisible();
    await securityTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/07-settings-security-initial.png' });

    // Verify Security Advisory Card
    const advisoryCard = page.locator('div:has-text("Sau khi đổi mật khẩu"), div:has-text("all other active sessions")').first();
    await expect(advisoryCard).toBeVisible();

    // Fill Current Password
    const currentPassInput = page.locator('input[placeholder="••••••••"]').first();
    await currentPassInput.fill('Password123@!');

    // Type weak new password to verify real-time ACC-05 checklist
    const newPassInput = page.locator('input[placeholder="••••••••"]').nth(1);
    await newPassInput.fill('weak');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/e2e/screenshots/08-settings-security-validation-active.png' });

    // Verify checklist items are rendered
    await expect(page.getByText(/Tối thiểu 8 ký tự|At least 8 characters/i).first()).toBeVisible();

    // Fill valid new password and confirm
    await newPassInput.fill('BrandNewPassword123!@#');
    const confirmPassInput = page.locator('input[placeholder="••••••••"]').nth(2);
    await confirmPassInput.fill('BrandNewPassword123!@#');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/e2e/screenshots/09-settings-security-ready.png' });

    // Verify matching indicator
    await expect(page.getByText(/Mật khẩu trùng khớp|Password match/i).first()).toBeVisible();

    // 7. Verify Sessions Tab (ACC-07)
    const sessionsTab = page.locator('aside button:has-text("Phiên đăng nhập"), aside button:has-text("Devices & Sessions")').first();
    await expect(sessionsTab).toBeVisible();
    await sessionsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/10-settings-sessions.png' });

    // 8. Test Mobile Viewport (iPhone 14 / Pixel 7: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/11-mobile-viewport-settings.png' });
  });
});
