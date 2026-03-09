
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function test() {
    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        console.log("Browser launched.");
        const page = await browser.newPage();
        await page.setContent('<h1>Test PDF</h1><p>If you see this, puppeteer is working.</p>');
        const outputPath = path.join(__dirname, 'test.pdf');
        await page.pdf({ path: outputPath, format: 'A4' });
        console.log("PDF generated at:", outputPath);
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error("Puppeteer Test Failed:", err);
        if (browser) await browser.close();
        process.exit(1);
    }
}

test();
