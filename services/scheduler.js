const { CronJob } = require('cron');
const { runScraper } = require('./scraper');
const { sendDailyClipping } = require('./mailer');


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
