const { Builder, By, until } = require('selenium-webdriver');

async function testEventRegistration() {
    const driver = await new Builder().forBrowser('chrome').build();

    const email = `eventtest${Date.now()}@gmail.com`;

    try {
        console.log('Opening EventHub...');

        await driver.get('http://localhost:3002');

        // Create a new student account
        await driver.findElement(By.id('registerBtn')).click();

        await driver.findElement(By.id('name'))
            .sendKeys('Event Test Student');

        await driver.findElement(By.id('email')).sendKeys(email);

        await driver.findElement(By.id('password'))
            .sendKeys('Student@123');

        await driver.findElement(By.id('authSubmit')).click();

        // Wait until registration form disappears
        await driver.wait(async () => {
            return await driver.findElement(By.id('authSection'))
                .getAttribute('hidden') !== null;
        }, 10000);

        // Register for the first event
        const registerButton = await driver.findElement(
            By.css('#eventList button')
        );

        await registerButton.click();
        await driver.wait(until.alertIsPresent(), 5000);

const alert = await driver.switchTo().alert();

console.log('Registration message:', await alert.getText());

await alert.accept();

        // Verify registered event appears
        await driver.wait(async () => {
            const text = await driver.findElement(
                By.id('myRegistrationList')
            ).getText();

            return text.includes('Technical Symposium');
        }, 10000);

        console.log('PASS: Student successfully registered for an event.');

    } catch (error) {
        console.log('FAIL:', error.message);
        process.exitCode = 1;
    } finally {
        await driver.quit();
    }
}

testEventRegistration();