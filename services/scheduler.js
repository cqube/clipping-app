const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');

// Run every day at 7:00 AM Santiago time
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Cron pattern: 0 7 * * * (At 07:00)
    const scraperJob = new CronJob(
        '0 7 * * *',
        async function () {
            console.log('Running scheduled scrape...');
            await runScraper();
        },
        null,
        true,
        'America/Santiago'
    );

    // Cron pattern: 5 7 * * * (At 07:05) - Email
    const emailJob = new CronJob(
        '5 7 * * *',
        async function () {
            console.log('Running scheduled email job...');
            await sendDailyClipping();
        },
        null,
        true,
        'America/Santiago'
    );

    console.log('Scheduler started. Scrape next:', scraperJob.nextDate().toString());
    console.log('Scheduler started. Email next:', emailJob.nextDate().toString());
};

module.exports = { initScheduler };
