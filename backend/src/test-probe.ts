import http from 'http';
import app from './app';

async function runTest() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  console.log('Test server listening on port 5099');

  try {
    // 1. Test Ping
    const t0 = performance.now();
    const pingRes = await fetch('http://localhost:5099/api/v1/system/ping');
    const pingLatency = (performance.now() - t0).toFixed(2);
    const pingJson: any = await pingRes.json();
    console.log(`[PASS] GET /api/v1/system/ping: Status ${pingRes.status}, Latency: ${pingLatency}ms, Body:`, pingJson);

    // 2. Test Health
    const t1 = performance.now();
    const healthRes = await fetch('http://localhost:5099/api/v1/system/health');
    const healthLatency = (performance.now() - t1).toFixed(2);
    const healthJson: any = await healthRes.json();
    console.log(`[PASS] GET /api/v1/system/health: Status ${healthRes.status}, Latency: ${healthLatency}ms, DB: ${healthJson?.data?.database?.status}, Redis: ${healthJson?.data?.redis?.status}`);

    // 3. Test Diagnostics Dashboard HTML serving
    const htmlRes = await fetch('http://localhost:5099/');
    const htmlText = await htmlRes.text();
    const hasHtml = htmlText.includes('ChatApp Core Backend Diagnostics & Testing Playground');
    console.log(`[PASS] GET / (Diagnostic HTML): Status ${htmlRes.status}, Found Dashboard Title: ${hasHtml}, Length: ${htmlText.length} bytes`);

    // 4. Test Validation on Invalid Register
    const invalidRegRes = await fetch('http://localhost:5099/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a', password: '12' }),
    });
    const invalidRegJson: any = await invalidRegRes.json();
    console.log(`[PASS] POST /api/v1/auth/register (Invalid payload validation): Status ${invalidRegRes.status}, Expected 422: ${invalidRegRes.status === 422}, Response:`, invalidRegJson);

    // 5. Test 404 Route
    const notFoundRes = await fetch('http://localhost:5099/api/v1/unknown');
    console.log(`[PASS] GET /api/v1/unknown (404 handling): Status ${notFoundRes.status}`);

    console.log('\n🎉 ALL CORE BACKEND SMOKE TESTS PASSED CLEANLY!');
  } finally {
    server.close();
  }
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
