import { test, expect } from '@playwright/test';

test.describe('CIRCLE WebRTC Audio/Video Call E2E Verification (UC12, SPIKE-RTC-001)', () => {
  test.beforeEach(async ({ context }) => {
    // Grant microphone and camera permissions automatically in headless browser
    await context.grantPermissions(['microphone', 'camera']);
  });

  test('User can see call buttons in channel, start call, view stage modal, and leave call', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');

    // 2. Perform Login with seeded test credentials
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'Password123@!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3000/');

    // 3. Ensure Header is visible
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    // 4. Select a Circle to enter workspace
    const circleCard = page.locator('text=/Truy cập Vòng tròn|dbinh/i').first();
    await expect(circleCard).toBeVisible({ timeout: 10000 });
    await circleCard.click();

    // 5. Verify Call Action buttons exist in channel header
    const audioCallBtn = page.locator('button[title*="thoại"], button[title*="Audio"]').first();
    const videoCallBtn = page.locator('button[title*="video"], button[title*="Video"]').first();

    await expect(audioCallBtn).toBeVisible({ timeout: 15000 });
    await expect(videoCallBtn).toBeVisible({ timeout: 15000 });

    // 6. Click to initiate an Audio Call
    await audioCallBtn.click();

    // 7. Verify Call Stage Modal is rendered
    const callModal = page.locator('text=/Voice Room|thành viên đang tham gia/i').first();
    await expect(callModal).toBeVisible({ timeout: 15000 });

    // Verify control action buttons in Call Stage (Leave / Rời phòng button)
    const leaveBtn = page.locator('button:has-text("Rời phòng")');
    await expect(leaveBtn).toBeVisible({ timeout: 5000 });

    // 8. Click Leave Call (Rời phòng)
    await leaveBtn.click();

    // 9. Verify Call Modal is closed cleanly
    await expect(leaveBtn).not.toBeVisible({ timeout: 5000 });
  });
});
