const { Builder, By, until } = require('selenium-webdriver');

async function testAdminDashboard() {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening EventHub Admin Dashboard...');

        await driver.get('http://localhost:3002');

        // Login as administrator
        await driver.findElement(By.id('loginBtn')).click();

        await driver.findElement(By.id('email'))
            .sendKeys('admin@event.com');

        await driver.findElement(By.id('password'))
            .sendKeys('Admin@123');

        await driver.findElement(By.id('authSubmit')).click();

        // Wait until admin dashboard becomes visible
        await driver.wait(async () => {
            const hidden = await driver.findElement(
                By.id('adminSection')
            ).getAttribute('hidden');

            return hidden === null;
        }, 10000);

               const participantsList = await driver.findElement(
            By.id('participantsList')
        );

        await driver.wait(async () => {
            const text = await participantsList.getText();
            return text.trim().length > 0;
        }, 10000);

        const participants = await participantsList.getText();

        console.log('Participant records:');
        console.log(participants);

        console.log('PASS: Admin login successful.');
        console.log('PASS: Admin dashboard is visible.');
        console.log('PASS: Participant records are displayed.');
    } catch (error) {
        console.log('FAIL:', error.message);
        process.exitCode = 1;
    } finally {
        await driver.quit();
    }
}

testAdminDashboard();