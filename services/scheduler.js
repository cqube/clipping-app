const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');

// Run every weekday (Mon-Fri) at 7:30 AM Santiago time
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Cron pattern: 30 7 * * 1-5 (At 07:30, Monday through Friday)
    const scraperJob = new CronJob(
        '30 7 * * 1-5',
        async function () {
            console.log('Running scheduled scrape...');
            await runScraper();
        },
        null,
        true,
        'America/Santiago'
    );

    // Cron pattern: 35 7 * * 1-5 (At 07:35, Monday through Friday) - Email
    const emailJob = new CronJob(
        '35 7 * * 1-5',
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
