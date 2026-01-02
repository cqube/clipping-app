const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');

// Run every weekday (Mon-Fri) at 7:30 AM Santiago time
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Job 1: Scraper at 07:00 AM (Mon-Fri)
    const scraperJob = new CronJob(
        '0 7 * * 1-5',
        async function () {
            console.log('Running scheduled scrape (07:00 AM)...');
            try {
                await runScraper();
                console.log('Scheduled scrape finished.');
            } catch (error) {
                console.error('Error during scheduled scrape:', error);
            }
        },
        null,
        true,
        'America/Santiago'
    );

    // Job 2: Email at 07:55 AM (Mon-Fri)
    const emailJob = new CronJob(
        '55 7 * * 1-5',
        async function () {
            console.log('Running scheduled email send (07:55 AM)...');
            try {
                await sendDailyClipping();
                console.log('Scheduled email sent.');
            } catch (error) {
                console.error('Error during scheduled email:', error);
            }
        },
        null,
        true,
        'America/Santiago'
    );

    console.log('Scheduler started.');
    console.log('Next Scrape:', scraperJob.nextDate().toString());
    console.log('Next Email:', emailJob.nextDate().toString());
};

module.exports = { initScheduler };
