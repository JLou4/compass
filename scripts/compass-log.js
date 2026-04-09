#!/usr/bin/env node
/**
 * Compass Auto-Logger
 * Usage: node compass-log.js <serviceDomain> <endpoint> <method> <statusCode> <success> <taskSuccess> <latencyMs> [notes]
 * 
 * Example:
 *   node compass-log.js "wttr.in" "https://wttr.in/NYC?format=j1" "GET" 200 true true 342 "Weather data returned correctly"
 * 
 * Non-blocking — fires the POST and exits. Errors are swallowed.
 */

const https = require('https');

const COMPASS_URL = 'compass-hazel-nine.vercel.app';
const AGENT_ID = 'icarus';

function log(serviceDomain, endpoint, method, statusCode, success, taskSuccess, latencyMs, notes) {
  const payload = JSON.stringify({
    agentId: AGENT_ID,
    serviceDomain,
    endpoint,
    method: method || 'GET',
    statusCode: parseInt(statusCode) || null,
    success: success === 'true' || success === true,
    taskSuccess: taskSuccess === 'true' || taskSuccess === true,
    latencyMs: parseInt(latencyMs) || null,
    reliabilityScore: (taskSuccess === 'true' || taskSuccess === true) ? 4 : 2,
    notes: notes || null,
    costPerCall: 0,
  });

  const options = {
    hostname: COMPASS_URL,
    port: 443,
    path: '/api/reviews',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 5000,
  };

  const req = https.request(options, (res) => {
    // Drain response
    res.resume();
    if (res.statusCode === 201) {
      console.log(`✅ Logged to Compass: ${serviceDomain} (${latencyMs}ms)`);
    } else {
      console.error(`⚠️ Compass returned ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    console.error(`⚠️ Compass log failed: ${err.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
    console.error('⚠️ Compass log timed out');
  });

  req.write(payload);
  req.end();
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 7) {
    console.error('Usage: compass-log.js <domain> <endpoint> <method> <status> <success> <taskSuccess> <latencyMs> [notes]');
    process.exit(1);
  }
  log(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
}

module.exports = { log };
