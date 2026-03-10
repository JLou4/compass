// Test script for Compass API endpoints

const BASE_URL = 'http://localhost:3000';

// Sample review data
const sampleReviews = [
  {
    agentId: 'claude-sonnet-3-5',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    serviceName: 'OpenAI ChatGPT API',
    taskCategory: 'text-generation',
    method: 'POST',
    statusCode: 200,
    success: true,
    taskSuccess: true,
    latencyMs: 1250,
    costPerCall: 0.0045,
    reliabilityScore: 4,
    notes: 'Successful text generation with good quality output'
  },
  {
    agentId: 'claude-sonnet-3-5',
    endpoint: 'https://api.anthropic.com/v1/messages',
    serviceName: 'Anthropic Claude API',
    taskCategory: 'text-generation',
    method: 'POST',
    statusCode: 200,
    success: true,
    taskSuccess: true,
    latencyMs: 980,
    costPerCall: 0.0038,
    reliabilityScore: 5,
    notes: 'Fast response with excellent quality'
  },
  {
    agentId: 'gpt-4-agent',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    serviceName: 'OpenAI ChatGPT API',
    taskCategory: 'code-generation',
    method: 'POST',
    statusCode: 429,
    success: false,
    taskSuccess: false,
    latencyMs: 5000,
    costPerCall: 0.0000,
    reliabilityScore: 2,
    notes: 'Rate limited - too many requests'
  },
  {
    agentId: 'mistral-agent',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    serviceName: 'Mistral AI API',
    taskCategory: 'text-generation',
    method: 'POST',
    statusCode: 200,
    success: true,
    taskSuccess: true,
    latencyMs: 750,
    costPerCall: 0.0025,
    reliabilityScore: 4,
    notes: 'Good performance and cost efficiency'
  }
];

async function createReview(review) {
  try {
    const response = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Created review:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error creating review:', error);
    throw error;
  }
}

async function getReviews(service) {
  try {
    const url = service 
      ? `${BASE_URL}/api/reviews?service=${encodeURIComponent(service)}`
      : `${BASE_URL}/api/reviews`;
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reviews = await response.json();
    console.log(`📊 Retrieved ${reviews.length} reviews${service ? ` for ${service}` : ''}`);
    return reviews;
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    throw error;
  }
}

async function getServices() {
  try {
    const response = await fetch(`${BASE_URL}/api/services`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const services = await response.json();
    console.log(`🏢 Retrieved ${services.length} services`);
    services.forEach(service => {
      console.log(`  - ${service.serviceDomain}: ${service.totalCalls} calls, ${service.successRate}% success`);
    });
    return services;
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    throw error;
  }
}

async function triggerRollup(date) {
  try {
    const url = date 
      ? `${BASE_URL}/api/rollup?date=${date}`
      : `${BASE_URL}/api/rollup`;
      
    const response = await fetch(url, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📈 Rollup completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Error triggering rollup:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Testing Compass API...\n');

  try {
    // Create sample reviews
    console.log('1. Creating sample reviews...');
    for (const review of sampleReviews) {
      await createReview(review);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    // Get all reviews
    console.log('\n2. Fetching all reviews...');
    await getReviews();

    // Get reviews for specific service
    console.log('\n3. Fetching reviews for api.openai.com...');
    await getReviews('api.openai.com');

    // Trigger rollup for today
    console.log('\n4. Triggering daily rollup...');
    await triggerRollup();

    // Get services list
    console.log('\n5. Fetching services list...');
    await getServices();

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🌐 Visit http://localhost:3000 to view the dashboard');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { createReview, getReviews, getServices, triggerRollup };