const https = require('https');

const ENDPOINTS = [
  { domain: 'api.github.com', url: 'https://api.github.com/repos/JLou4/compass', task: 'git-fetch' },
  { domain: 'vercel.com', url: 'https://vercel.com/api/v1/projects', task: 'infra-deploy' },
  { domain: 'discord.com', url: 'https://discord.com/api/v9/channels', task: 'comms' }
];

function generatePayload() {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  
  // Synthetic logic 
  const isSuccess = Math.random() > 0.05; // 95% HTTP success
  const isTaskSuccess = isSuccess && Math.random() > 0.05; 
  const statusCode = isSuccess ? 200 : (Math.random() > 0.5 ? 500 : 403);
  
  const latency = Math.floor(Math.random() * 400) + 50; // fast
  
  return {
    agentId: 'geppetto9000',
    serviceDomain: endpoint.domain,
    serviceName: endpoint.domain.split('.')[0],
    endpoint: endpoint.url,
    taskCategory: endpoint.task,
    method: 'GET',
    statusCode,
    success: isSuccess,
    taskSuccess: isTaskSuccess,
    latencyMs: latency,
    costPerCall: 0.0001,
    reliabilityScore: isTaskSuccess ? 5 : (isSuccess ? 3 : 1),
    notes: `Geppetto runtime check on ${endpoint.domain}`
  };
}

async function sendReview() {
  const payload = generatePayload();
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
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
    console.log("Ingesting Gep logs to compass-hazel-nine.vercel.app...");
    for (let i = 0; i < 30; i++) {
        try {
            await sendReview();
            if(i % 10 === 0) console.log(`[${i}/30] Ingested Gep review.`);
        } catch(e) {
            console.error(`Failed:`, e.message);
        }
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log("Triggering rollup via POST /api/rollup...");
    const rollupOptions = {
        hostname: 'compass-hazel-nine.vercel.app',
        port: 443,
        path: '/api/rollup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': 0 }
    };
    await new Promise((resolve) => {
        const q = https.request(rollupOptions, () => resolve());
        q.end();
    });
    
    console.log("Done.");
}
run();
