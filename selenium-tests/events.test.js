const { Builder, By, until } = require('selenium-webdriver');

async function testEventListing() {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening EventHub Events...');

        await driver.get('http://localhost:3002');

        const eventList = await driver.findElement(By.id('eventList'));

        await driver.wait(async () => {
            const text = await eventList.getText();
            return text.includes('Technical Symposium') &&
                   text.includes('Cultural Fest') &&
                   text.includes('AI Workshop');
        }, 10000);

        console.log('PASS: All three sample events are displayed.');

    } catch (error) {
        console.log('FAIL:', error.message);
        process.exitCode = 1;
    } finally {
        await driver.quit();
    }
}

testEventListing();