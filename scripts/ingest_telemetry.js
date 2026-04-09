const https = require('https');

const ENDPOINTS = [
  { domain: 'api.openweathermap.org', url: 'https://api.openweathermap.org/data/2.5/weather', task: 'weather' },
  { domain: 'api.openai.com', url: 'https://api.openai.com/v1/chat/completions', task: 'generation' },
  { domain: 'maps.googleapis.com', url: 'https://maps.googleapis.com/maps/api/geocode/json', task: 'geocoding' },
  { domain: 'api.stripe.com', url: 'https://api.stripe.com/v1/charges', task: 'payment' },
  { domain: 'api.github.com', url: 'https://api.github.com/graphql', task: 'git' }
];

const AGENTS = ['icarus', 'icarus', 'icarus', 'geppetto9000', 'jack'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePayload() {
  const endpoint = randomElement(ENDPOINTS);
  const agentId = randomElement(AGENTS);
  
  // Create synthetic deltas (sometimes it succeeds HTTP, but fails the task)
  const isSuccess = Math.random() > 0.1; // 90% HTTP success
  const isTaskSuccess = isSuccess && Math.random() > 0.15; // 85% task success if HTTP success
  const statusCode = isSuccess ? 200 : (Math.random() > 0.5 ? 500 : 429);
  
  const latency = Math.floor(Math.random() * 800) + 100;
  
  return {
    agentId,
    serviceDomain: endpoint.domain,
    serviceName: endpoint.domain.split('.')[1],
    endpoint: endpoint.url,
    taskCategory: endpoint.task,
    method: 'POST',
    statusCode,
    success: isSuccess,
    taskSuccess: isTaskSuccess,
    latencyMs: latency,
    costPerCall: 0.001,
    reliabilityScore: isTaskSuccess ? 5 : (isSuccess ? 3 : 1),
    notes: `Automated test run by ${agentId}`
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
    console.log("Starting mock ingestion to compass-hazel-nine.vercel.app...");
    for (let i = 0; i < 20; i++) {
        try {
            await sendReview();
            console.log(`[${i+1}/20] Ingested review successfully.`);
        } catch(e) {
            console.error(`[${i+1}/20] Failed:`, e.message);
        }
        // sleep a bit to not hammer
        await new Promise(r => setTimeout(r, 600));
    }
    console.log("Done.");
}

run();
