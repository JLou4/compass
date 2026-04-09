const https = require('https');

async function fetchFromClaw() {
  return new Promise((resolve, reject) => {
    https.get('https://claw-collective2.vercel.app/api/reviews?limit=3000', (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function fetchServicesFromClaw() {
  return new Promise((resolve, reject) => {
    https.get('https://claw-collective2.vercel.app/api/services', (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function processLog(oldLog) {
  // mapping snake_case -> camelCase expected by the new endpoints
  return {
    agentId: oldLog.agent_id || 'icarus',
    serviceDomain: oldLog.service_domain || 'unknown',
    serviceName: oldLog.service_domain ? oldLog.service_domain.split('.')[0] : 'unknown',
    endpoint: oldLog.endpoint || 'unknown',
    taskCategory: oldLog.task_category || 'general',
    method: oldLog.method || 'POST',
    statusCode: oldLog.status_code || 200,
    success: oldLog.success || false,
    taskSuccess: oldLog.task_success || false,
    latencyMs: oldLog.latency_ms || 0,
    costPerCall: oldLog.cost_per_call ? Number(oldLog.cost_per_call) : 0,
    reliabilityScore: oldLog.reliability_score || 0,
    notes: `Migrated from claw-collective2: ${oldLog.notes || ''}`
  };
}

async function sendReview(payload) {
  const postData = JSON.stringify(payload);
  const options = {
    hostname: 'compass-hazel-nine.vercel.app',
    port: 443,
    path: '/api/reviews',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          resolve(`HTTP ${res.statusCode}: ${data}`); // just log to keep going
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log("Fetching logs from claw-collective2...");
  const data = await fetchFromClaw();
  const reviews = data.reviews || [];
  console.log(`Found ${reviews.length} logs to migrate. Starting batch ingestion...`);
  
  let successCount = 0;
  for (let i = 0; i < reviews.length; i++) {
        try {
            const transformed = processLog(reviews[i]);
            await sendReview(transformed);
            successCount++;
            if(i % 50 === 0) console.log(`[${i}/${reviews.length}] processing...`);
        } catch(e) {
            console.error(`[${i}/${reviews.length}] Error:`, e.message);
        }
        await new Promise(r => setTimeout(r, 50)); 
  }

  console.log(`Finished migrating ${successCount} logs. Triggering rollup...`);

  const rollupOptions = {
    hostname: 'compass-hazel-nine.vercel.app',
    port: 443,
    path: '/api/rollup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0
    }
  };

  await new Promise((resolve, reject) => {
      const q = https.request(rollupOptions, (res) => {
          let chunks = '';
          res.on('data', (c) => chunks+=c);
          res.on('end', () => {
              console.log('Rollup Result:', chunks);
              resolve();
          });
      });
      q.on('error', reject);
      q.end();
  });

  console.log("Migration script complete.");
}

run();
