// Test concurrent requests to v1/ai endpoint
const API_KEY = 'devora_0bcfdb2c767d01e464e189dcf791d12695dce19c'; // Replace with your API key
const BASE_URL = 'http://localhost:3000';
const MODEL_ID = 'devora-claude-sonnet-4.5'; // Replace with your model

async function makeRequest(requestId) {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${BASE_URL}/api/v1/ai/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [
                    { role: 'user', content: `Test request #${requestId}` }
                ],
                max_tokens: 50
            })
        });

        const duration = Date.now() - startTime;
        const data = await response.json();

        return {
            requestId,
            status: response.status,
            duration,
            success: response.ok,
            error: data.error?.message || null
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            requestId,
            status: 'ERROR',
            duration,
            success: false,
            error: error.message
        };
    }
}

async function testConcurrent(numRequests = 10) {
    console.log(`\n🚀 Testing ${numRequests} concurrent requests...\n`);
    console.log('='.repeat(80));
    
    const startTime = Date.now();
    
    // Create array of promises for concurrent requests
    const promises = Array.from({ length: numRequests }, (_, i) => makeRequest(i + 1));
    
    // Execute all requests concurrently
    const results = await Promise.all(promises);
    
    const totalDuration = Date.now() - startTime;
    
    // Print results
    console.log('\n📊 Results:\n');
    results.forEach(result => {
        const statusIcon = result.success ? '✅' : '❌';
        const statusText = result.success ? 'SUCCESS' : 'FAILED';
        console.log(`${statusIcon} Request #${result.requestId}: ${statusText} (${result.duration}ms) - Status: ${result.status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    // Statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const minDuration = Math.min(...results.map(r => r.duration));
    const maxDuration = Math.max(...results.map(r => r.duration));
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 Statistics:\n');
    console.log(`Total Requests:     ${numRequests}`);
    console.log(`Successful:         ${successful} (${(successful/numRequests*100).toFixed(1)}%)`);
    console.log(`Failed:             ${failed} (${(failed/numRequests*100).toFixed(1)}%)`);
    console.log(`Total Time:         ${totalDuration}ms`);
    console.log(`Average Duration:   ${avgDuration.toFixed(0)}ms`);
    console.log(`Min Duration:       ${minDuration}ms`);
    console.log(`Max Duration:       ${maxDuration}ms`);
    console.log(`Requests/Second:    ${(numRequests / (totalDuration / 1000)).toFixed(2)}`);
    console.log('\n' + '='.repeat(80));
}

// Run tests
const numRequests = process.argv[2] ? parseInt(process.argv[2]) : 10;

console.log('\n🔧 Configuration:');
console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`Model: ${MODEL_ID}`);
console.log(`Base URL: ${BASE_URL}`);

testConcurrent(numRequests).then(() => {
    console.log('\n✨ Test completed!\n');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
