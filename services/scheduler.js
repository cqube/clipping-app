const { CronJob } = require('cron');
const { runScraper } = require('./scraper');

// Run every day at 8:00 AM Santiago time
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Cron pattern: 0 8 * * * (At 08:00)
    const job = new CronJob(
        '0 8 * * *',
        async function () {
            console.log('Running scheduled scrape...');
            await runScraper();
        },
        null,
        true,
        'America/Santiago'
    );

    console.log('Scheduler started. Next run:', job.nextDate().toString());
};

module.exports = { initScheduler };
