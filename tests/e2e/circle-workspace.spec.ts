import { test, expect } from '@playwright/test';

test('Capture circle workspace and inspect layout and themes', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'testuser@circle.local');
  await page.fill('input[type="password"]', 'Password123@!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  // Click on the circle card to enter active circle
  const circleCard = page.locator('text=dbinh, Test User, aaa').first();
  if (await circleCard.isVisible()) {
    await circleCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/10-circle-workspace.png' });
  }

  // Force Light mode and take screenshot
  await page.evaluate(() => {
    localStorage.setItem('circle_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/11-circle-workspace-light.png' });

  // Open System Settings in light mode
  const avatarBtn = page.locator('header .relative button').last();
  await avatarBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/12-avatar-menu-light.png' });

  const settingsBtn = page.locator('button:has-text("Cài đặt hệ thống")');
  await settingsBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/13-system-settings-light.png' });

  // Force Dark mode and capture both workspace and settings modal
  await page.evaluate(() => {
    localStorage.setItem('circle_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/15-system-settings-dark.png' });

  // Close modal via X button and capture dark workspace
  const closeXBtn = page.locator('div[role="dialog"] button, .fixed button').filter({ has: page.locator('svg.lucide-x') }).first();
  if (await closeXBtn.isVisible()) {
    await closeXBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/14-circle-workspace-dark.png' });

  // Switch to Moments Feed view
  const momentsNavItem = page.locator('button:has-text("Khoảnh khắc"), button:has-text("Khoảnh khắc thường ngày")').first();
  if (await momentsNavItem.isVisible()) {
    await momentsNavItem.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/16-moments-feed-dark.png' });

    // Also take light mode moments feed
    await page.evaluate(() => {
      localStorage.setItem('circle_theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/17-moments-feed-light.png' });
  }

  // Open Circle Settings Modal
  const circleSettingsBtn = page.locator('button:has-text("Cài đặt Vòng tròn"), button:has-text("Cài đặt")').first();
  if (await circleSettingsBtn.isVisible()) {
    await circleSettingsBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/18-circle-settings-tab1-chatinfo.png' });

    // Tab 3: Thông báo & Quyền riêng tư (with standard Phone & Video icons)
    const privacyTab = page.locator('button:has-text("Thông báo & Quyền riêng tư")');
    if (await privacyTab.isVisible()) {
      await privacyTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/19-circle-settings-tab3-privacy.png' });
    }

    // Tab 4: Thiết lập Vòng tròn
    const circleSettingsTab = page.locator('button:has-text("Thiết lập Vòng tròn")');
    if (await circleSettingsTab.isVisible()) {
      await circleSettingsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/20-circle-settings-tab4-settings.png' });
    }

    // Tab 5: Trợ giúp & Báo cáo
    const supportTab = page.locator('button:has-text("Trợ giúp & Báo cáo")');
    if (await supportTab.isVisible()) {
      await supportTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/21-circle-settings-tab5-reports.png' });
    }

    // Dark mode circle settings modal (Tab 3)
    await page.evaluate(() => {
      localStorage.setItem('circle_theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    if (await privacyTab.isVisible()) {
      await privacyTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/22-circle-settings-tab3-privacy-dark.png' });
    }
  }
});

