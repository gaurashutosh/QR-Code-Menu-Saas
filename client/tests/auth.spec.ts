import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const testEmail = `testuser${randomSuffix}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test User';

  test('Successful Signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Check if we are on the signup page
    await expect(page).toHaveURL(/.*signup/);
    
    // Fill the signup form
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
    
    // Check for success message (toast)
    // The toast message is "Account created successfully!"
    await expect(page.locator('text=Account created successfully!')).toBeVisible({ timeout: 10000 });
  });

  test('Successful Login', async ({ page }) => {
    // Rely on a second signup or a known user. For isolation, let's signup again or use a unique one.
    const loginEmail = `loginuser${Math.floor(Math.random() * 10000)}@example.com`;
    
    // Quick signup for this test
    await page.goto('/signup');
    await page.fill('input[id="name"]', 'Login Test User');
    await page.fill('input[id="email"]', loginEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
    
    // Logout first (assuming there's a logout button or we just go to login)
    await page.goto('/login');
    
    await page.fill('input[id="email"]', loginEmail);
    await page.fill('input[id="password"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
    await expect(page.locator('text=Welcome back!')).toBeVisible({ timeout: 10000 });
  });

  test('Failed Login (Invalid Credentials)', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[id="email"]', 'wrong@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Check for error toast. The component uses "Invalid email or password"
    // Let's use a more flexible matcher for the toast
    await expect(page.locator('div[role="status"], div[aria-live="polite"]')).toContainText('Invalid email or password', { timeout: 10000 });
  });
});

