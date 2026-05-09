import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destFolder = path.join(__dirname, '../../screenshot v2');

(async () => {
  console.log('Starting puppeteer...');
  // Add some arguments to make it faster/more stable in headless
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();
  
  // High quality mobile viewport for marketing
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the login form to be fully rendered
    await page.waitForSelector('#phone', { timeout: 10000 });
    
    // 1. Screenshot Login
    await page.screenshot({ path: path.join(destFolder, '01-login-marketing.png') });
    console.log('Saved 01-login-marketing.png');

    // Fill in login
    await page.type('#phone', '9810000000');
    // Ensure we are clicking the 'Send OTP' button (the submit button inside the form)
    await page.click('form button[type="submit"]');
    
    // Wait for OTP field
    await page.waitForSelector('#otp', { timeout: 10000 });
    await page.type('#otp', '123456');
    
    // Click Verify OTP
    await page.click('form button[type="submit"]');
    
    // Wait for the dashboard to load (wait for any typical dashboard element)
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    // 2. Screenshot Dashboard
    await page.screenshot({ path: path.join(destFolder, '02-dashboard-marketing.png') });
    console.log('Saved 02-dashboard-marketing.png');
    
    // Go to Reports
    console.log('Navigating to Reports...');
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
    
    // Give it a small delay for animations to finish
    await new Promise(r => setTimeout(r, 1000));
    
    // 3. Screenshot AI Report
    await page.screenshot({ path: path.join(destFolder, '03-ai-report-marketing.png') });
    console.log('Saved 03-ai-report-marketing.png');

  } catch (error) {
    console.error('Error during capture:', error);
  } finally {
    await browser.close();
    console.log('Done.');
  }
})();
