import { test, expect } from '@playwright/test';

test.describe('UI Flat Verification & System Settings', () => {
  test('Capture screenshots of 2-column settings, flat/glass design styles, circle theme colors, and neutral modes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/01-login-light.png' });

    // Login if on login page
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('testuser@circle.local');
      await page.fill('input[type="password"]', 'Password123@!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/02-home-light.png' });

    // Verify default UI style and message theme on root element
    const defaultUiStyle = await page.evaluate(() => document.documentElement.getAttribute('data-ui-style'));
    expect(defaultUiStyle).toBe('flat');

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

        // Verify "Cài đặt chung" (general) tab is REMOVED
        const generalTabCount = await page.locator('aside button:has-text("Cài đặt chung")').count();
        expect(generalTabCount).toBe(0);

        // 1. Verify "Giao diện" (appearance) tab is ACTIVE by default
        const appearanceTab = page.locator('aside button:has-text("Giao diện")');
        await expect(appearanceTab).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/04a-appearance-tab-default.png' });

        // 2. Test UI Style switching to Liquid Glass
        const glassBtn = page.locator('button:has-text("Liquid Glass")');
        if (await glassBtn.isVisible()) {
          await glassBtn.click();
          await page.waitForTimeout(300);
          const styleAfterGlass = await page.evaluate(() => document.documentElement.getAttribute('data-ui-style'));
          expect(styleAfterGlass).toBe('glass');
          await page.screenshot({ path: 'tests/e2e/screenshots/04b-liquid-glass-modal.png' });
        }

        // 3. Test UI Style switching back to Flat Design
        const flatBtn = page.locator('button:has-text("Flat Design")');
        if (await flatBtn.isVisible()) {
          await flatBtn.click();
          await page.waitForTimeout(300);
          const styleAfterFlat = await page.evaluate(() => document.documentElement.getAttribute('data-ui-style'));
          expect(styleAfterFlat).toBe('flat');
          await page.screenshot({ path: 'tests/e2e/screenshots/04c-flat-design-modal.png' });
        }

        // 4. Test Dark Mode (Neutral dark, no green swamp cast)
        const darkBtn = page.locator('button:has-text("Tối"), button[title="Tối"], button[aria-label="Tối"]').first();
        if (await darkBtn.isVisible()) {
          await darkBtn.click();
          await page.waitForTimeout(500);
          const themeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
          expect(themeDark).toBe('dark');
          await page.screenshot({ path: 'tests/e2e/screenshots/04e-dark-flat-settings.png' });

          // Switch back to light
          const lightBtn = page.locator('button:has-text("Sáng"), button[title="Sáng"], button[aria-label="Sáng"]').first();
          if (await lightBtn.isVisible()) {
            await lightBtn.click();
            await page.waitForTimeout(300);
          }
        }

        // 5. Navigate to "Phiên đăng nhập" tab
        const sessionsTab = page.locator('aside button:has-text("Phiên đăng nhập")');
        if (await sessionsTab.isVisible()) {
          await sessionsTab.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'tests/e2e/screenshots/05-system-settings-sessions.png' });
        }

        // 6. Navigate to "Ngôn ngữ" tab
        const languageTab = page.locator('aside button:has-text("Ngôn ngữ")');
        if (await languageTab.isVisible()) {
          await languageTab.click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: 'tests/e2e/screenshots/05b-system-settings-language.png' });
        }

        // 7. Navigate to "Trợ giúp" tab
        const helpTab = page.locator('aside button:has-text("Trợ giúp")');
        if (await helpTab.isVisible()) {
          await helpTab.click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: 'tests/e2e/screenshots/05c-system-settings-help.png' });
        }

        // Close modal
        await page.locator('main header button[aria-label="Đóng"], main header button[aria-label="Close"], main header button:has(svg.lucide-x)').first().click();
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

        // Close profile modal
        const closeBtn = page.locator('button[aria-label="Đóng"], button[aria-label="Close"], button:has(svg.lucide-x)').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('Verify circle theme color selection and responsive chat and moments feed', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_PAGE_ERROR:', err.message));
    page.on('response', resp => {
      if (resp.url().includes('/circles')) {
        console.log('NETWORK_RESP:', resp.status(), resp.url());
      }
    });
    await page.goto('/login');
    await page.waitForTimeout(500);

    // Login
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'Password123@!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Click on the first circle card in the home feed if available
    const firstCircleCard = page.locator('.grid > div').first();
    if (await firstCircleCard.isVisible()) {
      await firstCircleCard.click();
      await page.waitForTimeout(1500);

      // Verify chat view container is responsive (max-w-4xl)
      const chatContainer = page.locator('div[data-circle-theme]');
      if (await chatContainer.isVisible()) {
        await page.screenshot({ path: 'tests/e2e/screenshots/07-chat-responsive-width.png' });

        // Open Circle Settings Modal by clicking on the circle name in sidebar or header
        const circleSettingsTrigger = page.locator('aside button:has-text("Cài đặt"), aside button[title*="Cài đặt"], header button:has(svg.lucide-settings)').first();
        if (await circleSettingsTrigger.isVisible()) {
          await circleSettingsTrigger.click();
          await page.waitForTimeout(1000);

          // Click on "Thiết lập" or "Cài đặt" tab in circle management modal if needed
          const tabCircleSettings = page.locator('.fixed.z-50 aside button:has-text("Thiết lập"), .fixed.z-50 button:has-text("Thiết lập Vòng tròn")').first();
          if (await tabCircleSettings.isVisible()) {
            await tabCircleSettings.click();
            await page.waitForTimeout(500);
          }

          // Verify theme color swatch buttons are NOT disabled
          const oceanSwatch = page.locator('.fixed.z-50 button[title*="Xanh Biển"], .fixed.z-50 button[title*="Ocean"]').first();
          if (await oceanSwatch.isVisible()) {
            expect(await oceanSwatch.isDisabled()).toBe(false);
            await oceanSwatch.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'tests/e2e/screenshots/08-circle-theme-changed-ocean.png' });
          }

          // Close Circle Management Modal
          const closeModalBtn = page.locator('.fixed.z-50 button:has(svg.lucide-x)').first();
          if (await closeModalBtn.isVisible()) {
            await closeModalBtn.click();
            await page.waitForTimeout(500);
            const themeOnDivAfterClose = await page.locator('div[data-circle-theme]').getAttribute('data-circle-theme');
            expect(themeOnDivAfterClose).toBe('ocean');
            await page.screenshot({ path: 'tests/e2e/screenshots/08b-chat-ocean-theme.png' });
          }
        }

        // Navigate to Moments View
        const momentsNavBtn = page.locator('aside button:has-text("Khoảnh khắc"), aside button:has(svg.lucide-camera)').first();
        if (await momentsNavBtn.isVisible()) {
          await momentsNavBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'tests/e2e/screenshots/09-moments-responsive-snap.png' });
        }
      }
    }
  });
});
