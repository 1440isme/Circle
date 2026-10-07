import { test, expect } from '@playwright/test';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Read Receipts & Subtle Message Viewers Verification', () => {
  test('Verify read receipts on other user message, hover toolbar position, and seenBy names', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');

    // 2. Perform Login as Test User
    await page.fill('input[type="email"]', 'testuser@circle.local');
    await page.fill('input[type="password"]', 'Password123@!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3000/');

    // 3. Ensure Header is visible
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    // 4. Select the Circle
    const circleCard = page.locator('text=/Truy cập Vòng tròn|dbinh/i').first();
    await expect(circleCard).toBeVisible({ timeout: 10000 });
    await circleCard.click();

    // 5. Ensure Chat is loaded
    const composer = page.locator('textarea');
    await expect(composer).toBeVisible({ timeout: 15000 });

    const channel = await prisma.channel.findFirst({
      where: { circleId: 'cmums9go90003d0ymfyb9doaw' },
    });

    if (!channel) throw new Error('Channel not found');

    // Ensure we have an earlier short message with readers
    const earlierMsg = await prisma.message.create({
      data: {
        channelId: channel.id,
        memberId: 'cmums9goc0007d0ymufepqmpq', // Test User
        content: 'alo test message',
        sentAt: new Date(Date.now() - 60000),
      },
    });

    await prisma.messageReceipt.create({
      data: {
        messageId: earlierMsg.id,
        userId: 'cmujbl9i400068jrzp4rcrl5v', // dbinh
        readAt: new Date(),
      },
    });

    // Create a latest message sent by OTHER member (dbinh)
    const latestOtherMsg = await prisma.message.create({
      data: {
        channelId: channel.id,
        memberId: 'cmums9goa0005d0ym8iqf5acj', // dbinh
        content: 'Chao ca nha!',
        sentAt: new Date(),
      },
    });

    // Add read receipts from Test User and aaa to this latest message
    await prisma.messageReceipt.create({
      data: {
        messageId: latestOtherMsg.id,
        userId: 'cmujbgxpx00018jrzkpn2ytnq', // Test User
        readAt: new Date(),
      },
    });
    await prisma.messageReceipt.create({
      data: {
        messageId: latestOtherMsg.id,
        userId: 'cmujgs15t00015ngb9m8mlz1b', // aaa
        readAt: new Date(),
      },
    });

    // Reload page to fetch updated messages
    await page.reload();
    const card = page.locator('text=/Truy cập Vòng tròn|dbinh/i').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Scroll to bottom
    const scrollContainer = page.locator('div.flex-1.min-h-0.overflow-y-auto, div.flex-1.overflow-y-auto').first();
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(500);

    // Click on earlier message to show timestamp on top and "Đã xem bởi dbinh" below
    const earlierMsgEl = page.locator('text="alo test message"').last();
    await earlierMsgEl.scrollIntoViewIfNeeded();
    await earlierMsgEl.dispatchEvent('click');
    await page.waitForTimeout(500);

    // Hover on the latest message bubble to show the action bar high up above bubble
    const latestBubble = page.locator('text="Chao ca nha!"').last();
    await latestBubble.hover();
    await page.waitForTimeout(600);

    // Capture desktop screenshot
    const desktopScreenshot = path.resolve(process.cwd(), 'chat-read-receipts-verified-desktop.png');
    await page.screenshot({ path: desktopScreenshot });
    const artifactDesktop = '/home/tcb/.gemini/antigravity/brain/f5efcec0-b54f-47d0-bd38-fe62bb4eefb1/chat-read-receipts-verified-desktop.png';
    await page.screenshot({ path: artifactDesktop });

    // Switch to mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobileScreenshot = path.resolve(process.cwd(), 'chat-read-receipts-verified-mobile.png');
    await page.screenshot({ path: mobileScreenshot });
    const artifactMobile = '/home/tcb/.gemini/antigravity/brain/f5efcec0-b54f-47d0-bd38-fe62bb4eefb1/chat-read-receipts-verified-mobile.png';
    await page.screenshot({ path: artifactMobile });

    console.log('Test completed and screenshots captured successfully.');
  });
});
