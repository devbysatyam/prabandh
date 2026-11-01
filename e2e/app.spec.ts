import { test, expect } from '@playwright/test';

test.describe('Prabandh End-to-End User Journeys', () => {
  test('loads home page and explores demo celebration', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Prabandh/i);

    // Click interactive sample celebration
    const sampleBtn = page.getByRole('button', { name: /Explore Interactive Sample Celebration/i });
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
      await expect(page.getByText(/Sharma & Verma/i)).toBeVisible();
    }
  });

  test('navigates across all celebration sections', async ({ page }) => {
    await page.goto('/');

    const sampleBtn = page.getByRole('button', { name: /Explore Interactive Sample Celebration/i });
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
    }

    // Venues tab
    await page.getByRole('tab', { name: /Venues/i }).click();
    await expect(page.getByText(/Venue Properties & Halls/i)).toBeVisible();

    // Vendors tab
    await page.getByRole('tab', { name: /Vendors/i }).click();
    await expect(page.getByText(/Vendor Sourcing & Contracts/i)).toBeVisible();

    // Budget tab
    await page.getByRole('tab', { name: /Budget/i }).click();
    await expect(page.getByText(/Connected Budget Architecture/i)).toBeVisible();

    // Guests tab
    await page.getByRole('tab', { name: /Guest/i }).click();
    await expect(page.getByText(/Guest List & RSVP Manager/i)).toBeVisible();

    // Timeline tab
    await page.getByRole('tab', { name: /Timeline/i }).click();
    await expect(page.getByText(/Milestone Dependency Timeline/i)).toBeVisible();

    // Runsheet tab
    await page.getByRole('tab', { name: /Day-of/i }).click();
    await expect(page.getByText(/Live Run Sheet/i)).toBeVisible();

    // Analytics tab
    await page.getByRole('tab', { name: /Analytics/i }).click();
    await expect(page.getByText(/Overall Readiness/i)).toBeVisible();
  });
});
