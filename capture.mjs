import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';

(async () => {
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs');
  }

  console.log("Starting Vite dev server...");
  const isWin = process.platform === "win32";
  const vite = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], { stdio: 'inherit' });

  // wait 5 seconds for vite to start
  await new Promise(r => setTimeout(r, 7000));

  console.log("Starting browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    console.log("Bypassing login...");
    await page.evaluate(() => {
      localStorage.setItem("lastLoggedInUser", "admin");
      localStorage.setItem("userProfile_admin", JSON.stringify({name: "admin", bio: "Testing", avatar: "A", theme: "dark"}));
      localStorage.setItem("budget__admin", "1500000");
    });
    
    await page.goto('http://localhost:5173');
    
    console.log("Waiting for splash screen...");
    await page.waitForTimeout(4000); // splash is 3 seconds + 1s buffer
    
    console.log("Taking Home screenshot...");
    await page.screenshot({ path: 'docs/home.png' });
    
    console.log("Taking Restaurants screenshot...");
    await page.click('text=Restaurants');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/restaurants.png' });
    
    console.log("Taking History screenshot...");
    await page.click('text=History');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/history.png' });
    
    console.log("Taking Profile screenshot...");
    await page.click('text=Profile');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/profile.png' });
    
    console.log("Screenshots saved successfully.");
  } catch (error) {
    console.error("Error capturing screenshots:", error);
  } finally {
    await browser.close();
    console.log("Killing Vite...");
    vite.kill();
    process.exit(0);
  }
})();
