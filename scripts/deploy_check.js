const https = require('https');

async function testEndpoint(path) {
    const options = {
        hostname: 'compass-hazel-nine.vercel.app',
        port: 443,
        path: path,
        method: 'GET'
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch(e) {
                         resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

(async () => {
    try {
        console.log("Testing GET /api/reviews?limit=10");
        const res = await testEndpoint('/api/reviews?limit=10');
        console.log("Success. Keys:", Object.keys(res));
    } catch(e) {
        console.error("Error:", e.message);
    }
})();
