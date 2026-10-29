import { test, expect } from '@playwright/test';

test.describe('Calendar Event Creation & Custom DateTimePicker Verification', () => {
  test('User can open calendar, use drum-roll date & time picker, and create an event', async ({ page }) => {
    page.on('response', (res) => {
      if (res.url().includes('/auth/login') || res.url().includes('/calendar')) {
        console.log(`[API_RESPONSE] ${res.status()} ${res.url()}`);
      }
    });

    // 1. Login
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('testuser@circle.local');
      await page.fill('input[type="password"]', 'Password123@!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2500);
    }

    // 2. Click on the first circle card in the Home Hub
    const circleCard = page.locator('div.group.cursor-pointer, h4:has-text("Test Circle"), h4:has-text("binh hanh")').first();
    await expect(circleCard).toBeVisible({ timeout: 10000 });
    await circleCard.click();
    await page.waitForTimeout(1000);

    // 3. Navigate to Calendar Tool (Sidebar on Desktop, or store on mobile)
    const calendarNavItem = page.locator('aside button:has(svg.lucide-calendar), aside button:has-text("Lịch")').first();
    if (await calendarNavItem.isVisible()) {
      await calendarNavItem.click();
    } else {
      await page.evaluate(() => {
        (window as any).__circleStore?.getState().setActiveCircleView('calendar');
      });
    }
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-01-view.png' });

    // Click future day (e.g. 29) on the main calendar so selectedDate is a future date
    const dayCell = page.locator('button.aspect-square:has-text("29"), button.aspect-square:has-text("30")').first();
    if (await dayCell.isVisible()) {
      await dayCell.click();
      await page.waitForTimeout(400);
    }

    // 4. Open "Tạo sự kiện" Modal
    const createEventBtn = page.locator('button:has-text("Tạo sự kiện"), button:has-text("Lên lịch hẹn mới")').first();
    await expect(createEventBtn).toBeVisible({ timeout: 10000 });
    await createEventBtn.click();
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-02-modal-opened.png' });

    // 5. Click "Bắt đầu lúc *" trigger to open CustomDateTimePicker popover
    const startTrigger = page.locator('label:has-text("Bắt đầu lúc *") + div, label:has-text("Bắt đầu lúc *") ~ div').first();
    await expect(startTrigger).toBeVisible();
    await startTrigger.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-03-picker-popover-opened.png' });

    // 6. Click "Tháng M/YYYY" to expand Month & Year drum-roll wheels
    const monthYearToggle = page.locator('button:has-text("Tháng")').first();
    if (await monthYearToggle.isVisible()) {
      await monthYearToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/calendar-04-month-year-wheel.png' });

      // Click again to collapse back to day grid
      await monthYearToggle.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/e2e/screenshots/calendar-05-day-grid-restored.png' });
    }

    // 7. Click "Xong" button on the top right of the time wheel column
    const doneBtn = page.locator('button:has-text("Xong")').first();
    if (await doneBtn.isVisible()) {
      await doneBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/e2e/screenshots/calendar-06-picker-closed.png' });
    }

    // 8. Fill in Title, Location, and Description
    const titleInput = page.locator('input[placeholder*="Họp đồ án"], input[placeholder*="Ví dụ"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Họp kiểm thử Playwright tự động');
    }

    const locationInput = page.locator('input[placeholder*="địa điểm"], input[placeholder*="Google Meet"]').first();
    if (await locationInput.isVisible()) {
      await locationInput.fill('Google Meet: https://meet.google.com/cir-clee-tst');
    }

    const descInput = page.locator('textarea[placeholder*="Chi tiết"], textarea[placeholder*="nội dung"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Sự kiện tạo tự động từ Playwright script để tinh chỉnh giao diện.');
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-07-form-filled.png' });

    // 9. Submit event creation
    const calendarModal = page.locator('div.fixed').filter({ hasText: 'Lên Lịch Hẹn' });
    const modalText = await calendarModal.innerText();
    console.log('[MODAL_CONTENT]', modalText);

    const submitBtn = calendarModal.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    if (await submitBtn.isDisabled()) {
      console.log('[SUBMIT_IS_DISABLED] why? Form text above shows validation message.');
    } else {
      await submitBtn.click();
      await page.waitForTimeout(2500);
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-08-created-result.png' });

    // 10. Verify created event exists on the page
    await expect(page.locator('text=Họp kiểm thử Playwright tự động').first()).toBeVisible({ timeout: 10000 });
  });
});
