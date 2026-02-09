const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');

// Run daily at 7:30 AM Santiago time (Scheduling verified)
const initScheduler = () => {
    console.log('Initializing scheduler...');

    // Job 1: Scraper at 07:00 AM (Daily)
    const scraperJob = new CronJob(
        '0 7 * * *',
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

    // Job 2: Email at 08:15 AM (Daily)
    const emailJob = new CronJob(
        '15 8 * * *',
        async function () {
            console.log('Running scheduled email send (08:15 AM)...');
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

    // Job 3: Heartbeat every 30 minutes to confirm process is alive
    const heartbeatJob = new CronJob(
        '0 */30 * * * *',
        function () {
            console.log(`[Heartbeat] Clipping App is alive - ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`);
        },
        null,
        true,
        'America/Santiago'
    );
};

module.exports = { initScheduler };
