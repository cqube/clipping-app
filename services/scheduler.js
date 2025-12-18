const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');

// Run every day at 8:30 AM Santiago time
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Cron pattern: 30 8 * * * (At 08:30)
    const scraperJob = new CronJob(
        '30 8 * * *',
        async function () {
            console.log('Running scheduled scrape...');
            await runScraper();
        },
        null,
        true,
        'America/Santiago'
    );

    // Cron pattern: 35 8 * * * (At 08:35) - Email
    const emailJob = new CronJob(
        '35 8 * * *',
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
