
const { Builder, By, until } = require('selenium-webdriver');

async function testDashboard() {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening EventHub Dashboard...');

        await driver.get('http://localhost:3002');

        await driver.wait(until.titleContains('EventHub'), 10000);

        const title = await driver.getTitle();

        console.log('Page title:', title);
        console.log('PASS: EventHub homepage loaded successfully.');

    } catch (error) {
        console.log('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testDashboard();
