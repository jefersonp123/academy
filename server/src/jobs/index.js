import { markOverduePeriods } from './markOverduePeriods.js';
import { expireInvitations } from './expireInvitations.js';
import { cleanPushSubscriptions } from './cleanPushSubscriptions.js';

const INTERVAL_DAILY_MS = 24 * 60 * 60 * 1000;

export function startJobs() {
  console.log('[jobs] starting scheduled jobs');

  // Run once immediately on boot, then on interval
  runJob('markOverduePeriods', markOverduePeriods);
  runJob('expireInvitations', expireInvitations);
  runJob('cleanPushSubscriptions', cleanPushSubscriptions);

  setInterval(() => runJob('markOverduePeriods', markOverduePeriods), INTERVAL_DAILY_MS);
  setInterval(() => runJob('expireInvitations', expireInvitations), INTERVAL_DAILY_MS);
  setInterval(() => runJob('cleanPushSubscriptions', cleanPushSubscriptions), INTERVAL_DAILY_MS);
}

async function runJob(name, fn) {
  try {
    await fn();
    console.log(`[jobs] ${name} completed`);
  } catch (err) {
    console.error(`[jobs] ${name} failed:`, err.message);
  }
}
