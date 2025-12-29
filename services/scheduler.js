const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');

// Run every weekday (Mon-Fri) at 7:30 AM Santiago time
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Cron pattern: 30 7 * * 1-5 (At 07:30, Monday through Friday)
    // Cron pattern: 30 7 * * 1-5 (At 07:30, Monday through Friday)
    const scraperJob = new CronJob(
        '30 7 * * 1-5',
        async function () {
            console.log('Running scheduled scrape...');
            try {
                await runScraper();
                console.log('Scrape finished successfully.');
            } catch (error) {
                console.error('Error during scheduled scrape:', error);
            }

            console.log('Proceeding to send daily clipping email...');
            await sendDailyClipping();
        },
        null,
        true,
        'America/Santiago'
    );

    console.log('Scheduler started. Scrape/Email job next:', scraperJob.nextDate().toString());
};

module.exports = { initScheduler };
