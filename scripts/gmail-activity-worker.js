/**
 * Standalone worker to trigger the Next.js API endpoint for Auto-Activity.
 * Run this via PM2 or a terminal: `node scripts/gmail-activity-worker.js`
 */

const PORT = process.env.PORT || 3000;
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

console.log('🤖 Starting Gmail Activity Poller...');
console.log(`📡 Target API: http://127.0.0.1:${PORT}/api/cron/run-activity`);

async function triggerActivity() {
    try {
        console.log(`[${new Date().toISOString()}] Polling for due accounts...`);
        const res = await fetch(`http://127.0.0.1:${PORT}/api/cron/run-activity`, { method: 'POST' });
        
        if (res.ok) {
            const data = await res.json();
            if (data.executed > 0) {
                console.log(`✅ Activity completed for ${data.executed} account(s):`, JSON.stringify(data.results, null, 2));
            } else {
                console.log(`⏳ No accounts due for activity currently.`);
            }
        } else {
            console.error(`❌ HTTP Error: ${res.status} ${res.statusText}`);
        }
    } catch (err) {
        console.error(`⚠️ Network Error: Could not reach API. Ensure Next.js is running on port ${PORT}! (${err.message})`);
    }
}

// Run immediately for testing bypass etc.
triggerActivity();

// Set interval
setInterval(triggerActivity, INTERVAL_MS);
