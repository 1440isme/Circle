import { test, expect } from '@playwright/test';

test.describe('CIRCLE WebRTC 2-User Calling E2E (UC12)', () => {
  test('User A initiates audio call and User B joins, both see each other, auto ends on last leave with chat summary', async ({ browser }) => {
    // 1. Create context for User A (testuser@circle.local)
    const contextA = await browser.newContext();
    await contextA.grantPermissions(['microphone', 'camera']);
    const pageA = await contextA.newPage();

    // 2. Create context for User B (abc@abc.com)
    const contextB = await browser.newContext();
    await contextB.grantPermissions(['microphone', 'camera']);
    const pageB = await contextB.newPage();

    // Fetch tokens via backend API for User A
    const loginResA = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@circle.local', password: 'Password123@!' }),
    });
    const authDataA = (await loginResA.json()).data;

    // Fetch tokens via backend API for User B
    const loginResB = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'abc@abc.com', password: 'Password123@!' }),
    });
    const authDataB = (await loginResB.json()).data;

    // Set cookies and localStorage for User A
    await contextA.addCookies([
      { name: 'circle_access_token', value: authDataA.tokens.accessToken, domain: 'localhost', path: '/' },
      { name: 'circle_refresh_token', value: authDataA.tokens.refreshToken, domain: 'localhost', path: '/' },
    ]);
    await pageA.addInitScript((auth) => {
      localStorage.setItem('circle_access_token', auth.tokens.accessToken);
      localStorage.setItem('circle_refresh_token', auth.tokens.refreshToken);
      localStorage.setItem('circle_user', JSON.stringify(auth.user));
    }, authDataA);

    // Set cookies and localStorage for User B
    await contextB.addCookies([
      { name: 'circle_access_token', value: authDataB.tokens.accessToken, domain: 'localhost', path: '/' },
      { name: 'circle_refresh_token', value: authDataB.tokens.refreshToken, domain: 'localhost', path: '/' },
    ]);
    await pageB.addInitScript((auth) => {
      localStorage.setItem('circle_access_token', auth.tokens.accessToken);
      localStorage.setItem('circle_refresh_token', auth.tokens.refreshToken);
      localStorage.setItem('circle_user', JSON.stringify(auth.user));
    }, authDataB);

    await pageA.goto('http://localhost:3000/');
    await pageB.goto('http://localhost:3000/');

    await expect(pageA.locator('header')).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('header')).toBeVisible({ timeout: 15000 });

    // Both enter the shared Circle "dbinh, Test User, aaa"
    const circleCardA = pageA.locator('text=/dbinh, Test User/i').first();
    await expect(circleCardA).toBeVisible({ timeout: 15000 });
    await circleCardA.click();

    const circleCardB = pageB.locator('text=/dbinh, Test User/i').first();
    await expect(circleCardB).toBeVisible({ timeout: 15000 });
    await circleCardB.click();

    // Ensure presence rail is loaded for both
    await expect(pageA.locator('button:has-text("Gọi thoại")').first()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('button:has-text("Gọi thoại")').first()).toBeVisible({ timeout: 15000 });

    // User A starts Audio Call from Presence Rail
    const audioCallBtnA = pageA.locator('button:has-text("Gọi thoại")').first();
    await audioCallBtnA.click();

    // User A enters stage modal
    await expect(pageA.locator('text=/Voice Room|thành viên đang tham gia/i').first()).toBeVisible({ timeout: 15000 });

    // User B: verify incoming dialog or column 3 displays active call status
    const incomingDialogBtnB = pageB.locator('[data-testid="accept-incoming-call-btn"]');
    const presenceJoinBtnB = pageB.locator('button:has-text("Tham gia cuộc gọi")').first();

    // Wait for incoming dialog or presence rail join button to appear
    await expect(pageB.locator('[data-testid="accept-incoming-call-btn"], button:has-text("Tham gia cuộc gọi")').first()).toBeVisible({ timeout: 15000 });

    if (await incomingDialogBtnB.isVisible()) {
      await incomingDialogBtnB.click();
    } else {
      await presenceJoinBtnB.click();
    }

    // User B enters stage modal
    await expect(pageB.locator('text=/Voice Room|thành viên đang tham gia/i').first()).toBeVisible({ timeout: 15000 });

    // Verify User A sees 2 participants
    await expect(pageA.locator('text=/2 thành viên đang tham gia/i')).toBeVisible({ timeout: 15000 });

    // Verify User B sees 2 participants
    await expect(pageB.locator('text=/2 thành viên đang tham gia/i')).toBeVisible({ timeout: 15000 });

    // Take screenshot verifying 2-way call stage
    await pageA.screenshot({ path: 'webrtc-2user-call-verified-pageA.png' });
    await pageB.screenshot({ path: 'webrtc-2user-call-verified-pageB.png' });

    // User B leaves call first
    const leaveBtnB = pageB.locator('button:has-text("Rời phòng")');
    await leaveBtnB.click();
    await expect(leaveBtnB).not.toBeVisible({ timeout: 5000 });

    // User A should now see 1 participant left
    await expect(pageA.locator('text=/1 thành viên đang tham gia/i')).toBeVisible({ timeout: 15000 });

    // Count summary cards before last user leaves
    const initialCountA = await pageA.locator('text=/Cuộc gọi thoại kết thúc/i').count();
    const initialCountB = await pageB.locator('text=/Cuộc gọi thoại kết thúc/i').count();

    // User A (last person) leaves call
    const leaveBtnA = pageA.locator('button:has-text("Rời phòng")');
    await leaveBtnA.click();
    await expect(leaveBtnA).not.toBeVisible({ timeout: 5000 });

    // Wait 2s for backend to process end of call and post summary to chat
    await pageA.waitForTimeout(2000);

    // Verify exactly ONE call summary card is appended to chat stream (no duplicate)!
    const summaryCardsA = pageA.locator('text=/Cuộc gọi thoại kết thúc/i');
    await expect(summaryCardsA.first()).toBeVisible({ timeout: 15000 });
    expect(await summaryCardsA.count()).toBe(initialCountA + 1);

    const summaryCardsB = pageB.locator('text=/Cuộc gọi thoại kết thúc/i');
    await expect(summaryCardsB.first()).toBeVisible({ timeout: 15000 });
    expect(await summaryCardsB.count()).toBe(initialCountB + 1);

    // Column 3 presence rail resets back to "Gọi thoại" immediately without needing F5!
    await expect(pageA.locator('button:has-text("Gọi thoại")').first()).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('button:has-text("Gọi thoại")').first()).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
  });

  test('Video call mode: Discord/Messenger wide layout, auto orientation, and summary card', async ({ browser }) => {
    const contextA = await browser.newContext();
    await contextA.grantPermissions(['microphone', 'camera']);
    const pageA = await contextA.newPage();

    const contextB = await browser.newContext();
    await contextB.grantPermissions(['microphone', 'camera']);
    const pageB = await contextB.newPage();

    const loginResA = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@circle.local', password: 'Password123@!' }),
    });
    const authDataA = (await loginResA.json()).data;

    const loginResB = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'abc@abc.com', password: 'Password123@!' }),
    });
    const authDataB = (await loginResB.json()).data;

    await contextA.addCookies([
      { name: 'circle_access_token', value: authDataA.tokens.accessToken, domain: 'localhost', path: '/' },
      { name: 'circle_refresh_token', value: authDataA.tokens.refreshToken, domain: 'localhost', path: '/' },
    ]);
    await pageA.addInitScript((auth) => {
      localStorage.setItem('circle_access_token', auth.tokens.accessToken);
      localStorage.setItem('circle_refresh_token', auth.tokens.refreshToken);
      localStorage.setItem('circle_user', JSON.stringify(auth.user));
    }, authDataA);

    await contextB.addCookies([
      { name: 'circle_access_token', value: authDataB.tokens.accessToken, domain: 'localhost', path: '/' },
      { name: 'circle_refresh_token', value: authDataB.tokens.refreshToken, domain: 'localhost', path: '/' },
    ]);
    await pageB.addInitScript((auth) => {
      localStorage.setItem('circle_access_token', auth.tokens.accessToken);
      localStorage.setItem('circle_refresh_token', auth.tokens.refreshToken);
      localStorage.setItem('circle_user', JSON.stringify(auth.user));
    }, authDataB);

    await pageA.goto('http://localhost:3000/');
    await pageB.goto('http://localhost:3000/');

    const circleCardA = pageA.locator('text=/dbinh, Test User/i').first();
    await expect(circleCardA).toBeVisible({ timeout: 15000 });
    await circleCardA.click();

    const circleCardB = pageB.locator('text=/dbinh, Test User/i').first();
    await expect(circleCardB).toBeVisible({ timeout: 15000 });
    await circleCardB.click();

    // Ensure presence rail is loaded for both
    await expect(pageA.locator('button:has-text("Gọi video")').first()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('button:has-text("Gọi video")').first()).toBeVisible({ timeout: 15000 });

    await pageA.waitForTimeout(1000);

    // User A starts Video Call from Presence Rail
    const videoCallBtnA = pageA.locator('button:has-text("Gọi video")').first();
    await videoCallBtnA.click();

    // User A enters stage modal in Video Call mode
    await expect(pageA.locator('text=/Video Call/i').first()).toBeVisible({ timeout: 15000 });

    // User B receives incoming alert or clicks join in column 3
    const incomingDialogBtnB = pageB.locator('[data-testid="accept-incoming-call-btn"]');
    const presenceJoinBtnB = pageB.locator('button:has-text("Tham gia cuộc gọi")').first();
    await expect(pageB.locator('[data-testid="accept-incoming-call-btn"], button:has-text("Tham gia cuộc gọi")').first()).toBeVisible({ timeout: 15000 });

    if (await incomingDialogBtnB.isVisible()) {
      await incomingDialogBtnB.click();
    } else {
      await presenceJoinBtnB.click();
    }

    // Both see Video Call header & 2 participants
    await expect(pageA.locator('text=/Video Call/i').first()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('text=/Video Call/i').first()).toBeVisible({ timeout: 15000 });
    await expect(pageA.locator('text=/2 thành viên đang tham gia/i')).toBeVisible({ timeout: 15000 });

    // Verify video tags are present
    await expect(pageA.locator('video').first()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('video').first()).toBeVisible({ timeout: 15000 });

    // Take screenshots of video call layout
    await pageA.screenshot({ path: 'webrtc-videocall-layout-pageA.png' });
    await pageB.screenshot({ path: 'webrtc-videocall-layout-pageB.png' });

    // Count summary cards before last user leaves
    const initialVideoCountA = await pageA.locator('text=/Cuộc gọi video kết thúc/i').count();

    // User B leaves
    await pageB.locator('button:has-text("Rời phòng")').click();

    // User A leaves (last person)
    await pageA.locator('button:has-text("Rời phòng")').click();

    await pageA.waitForTimeout(2000);

    // Verify Video call summary card in chat (exactly 1 new message appended)
    const videoSummaryA = pageA.locator('text=/Cuộc gọi video kết thúc/i');
    await expect(videoSummaryA.first()).toBeVisible({ timeout: 15000 });
    expect(await videoSummaryA.count()).toBe(initialVideoCountA + 1);

    await contextA.close();
    await contextB.close();
  });
});
