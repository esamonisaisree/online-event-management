const { Builder, By, until } = require('selenium-webdriver');

async function testStudentRegistration() {
    const driver = await new Builder().forBrowser('chrome').build();
    const email = `selenium${Date.now()}@gmail.com`;

    try {
        console.log('Opening EventHub...');

        await driver.get('http://localhost:3002');

        await driver.findElement(By.id('registerBtn')).click();

        await driver.wait(
            until.elementIsVisible(driver.findElement(By.id('name'))),
            5000
        );

        await driver.findElement(By.id('name')).sendKeys('Selenium Student');
        await driver.findElement(By.id('email')).sendKeys(email);
        await driver.findElement(By.id('password')).sendKeys('Student@123');

        await driver.findElement(By.id('authSubmit')).click();

        await driver.wait(async () => {
            return await driver.findElement(By.id('authSection'))
                .getAttribute('hidden') !== null;
        }, 10000);

        console.log('PASS: Student registration workflow completed.');

    } catch (error) {
        console.log('FAIL:', error.message);
        process.exitCode = 1;
    } finally {
        await driver.quit();
    }
}

testStudentRegistration();
