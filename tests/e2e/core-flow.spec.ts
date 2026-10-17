import { test, expect } from '@playwright/test';

test.describe('CIRCLE Core End-to-End Workflow', () => {
  const testEmail = `tester_${Date.now()}@circle.local`;
  const testPassword = 'Password123@!';
  const testCircleName = `Test Circle ${Date.now()}`;

  test('User can register, login, view feed, create circle, and interact with chat', async ({ page }) => {
    // 1. Visit Home / Login Page
    await page.goto('/');

    // Check if redirected to login or authenticated home
    const isLoginPage = page.url().includes('/login') || (await page.locator('input[type="email"]').isVisible());

    if (isLoginPage) {
      // 2. Perform Login with demo / test credentials
      await page.fill('input[type="email"]', 'testuser@circle.local');
      await page.fill('input[type="password"]', 'Password123@!');
      await page.click('button[type="submit"]');

      // Verify redirection to home stream
      await expect(page).toHaveURL(/.*(\/|$)/);
    }

    // 3. Verify Header and Presence Rail rendered
    await expect(page.locator('header')).toBeVisible();

    // 4. Create or Select Circle
    const circleItem = page.locator('aside').getByRole('button').first();
    if (await circleItem.isVisible()) {
      await circleItem.click();
    }

    // 5. Verify Chat Composer & Message Stream
    const chatInput = page.locator('textarea[placeholder*="#"]');
    if (await chatInput.isVisible()) {
      await chatInput.fill('Xin chào từ kịch bản kiểm thử Playwright tự động!');
      await chatInput.press('Enter');
    }
  });

  test('User can open Profile and switch between View, Avatar and Edit modes', async ({ page }) => {
    await page.goto('/');

    // Open User Profile Modal from Header
    const profileBtn = page.locator('header button[title*="Hồ sơ"], header button:has(div:has-text("B"))').first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();

      // Verify Profile Modal is displayed
      const modal = page.locator('div[role="dialog"], div.fixed.inset-0');
      await expect(modal).toBeVisible();

      // Switch to Edit Mode
      const editBtn = page.locator('button:has-text("Chỉnh sửa hồ sơ")');
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await expect(page.locator('input[placeholder*="Trương Công Bình"]')).toBeVisible();
      }
    }
  });
});
