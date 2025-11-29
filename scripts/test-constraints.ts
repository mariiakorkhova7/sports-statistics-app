// pnpm dlx tsx scripts/test-constraints.ts

const BASE_URL = 'http://localhost:3000/api';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

async function runTests() {
  console.log('\x1b[1mInitializing system stress test...\x1b[0m\n');

  console.log('#1: Authentication');

  await testEndpoint('Register - Weak password', '/auth/register', 'POST', {
    email: 'test_weak@example.com',
    password: '123',
    first_name: 'Test',
    last_name: 'User',
    age: 20,
    sex: 'male',
    skill_level: 'beginner',
    playing_hand: 'right'
  }, (status) => status >= 400, 'Should reject passwords < 6 chars');

  await testEndpoint('Register - Bad email format', '/auth/register', 'POST', {
    email: 'not-an-email',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
    age: 20,
    sex: 'male',
    skill_level: 'beginner',
    playing_hand: 'right'
  }, (status) => status >= 400, 'Should reject invalid email format');

  await testEndpoint('Login - SQL Injection Attempt', '/auth/login', 'POST', {
    email: "' OR '1'='1",
    password: "anything"
  }, (status) => status === 401 || status === 400 || status === 404, 'Should fail login, NOT return 200 or 500');

  console.log('\n#2: Tournaments');
  
  const hugeString = 'A'.repeat(10000);
  
  await testEndpoint('Create - 10k char name', '/tournaments/create', 'POST', {
    name: hugeString,
    start_date: '2025-01-01',
    end_date: '2025-01-02', 
    points_to_win: 21
  }, (status) => status >= 400, 'Should reject huge names');

  await testEndpoint('Create - Empty name', '/tournaments/create', 'POST', {
    name: '',
    start_date: '2025-01-01',
    end_date: '2025-01-02', 
    points_to_win: 21
  }, (status) => status >= 400, 'Should reject empty strings');

  await testEndpoint('Create - End date before start', '/tournaments/create', 'POST', {
    name: 'Some tournament',
    start_date: '2025-02-01',
    end_date: '2025-01-01', 
    points_to_win: 21
  }, (status) => status >= 400, 'Should reject impossible dates');


  console.log('\n#3: Match logic');

  await testEndpoint('Match update - negative score', '/matches/update', 'PUT', {
    matchId: 1, 
    sets: [{ set_number: 1, p1_score: -5, p2_score: 21 }],
    winnerTeamId: 1
  }, (status) => status >= 400, 'Should reject negative scores');

  await testEndpoint('Match Update - Impossible high score', '/matches/update', 'PUT', {
    matchId: 1, 
    sets: [{ set_number: 1, p1_score: 999, p2_score: 997 }],
    winnerTeamId: 1
  }, (status) => status >= 400, 'Should reject unrealistic scores (>30)');


console.log('\n#4: Participation');

  await testEndpoint('Join - Non-existent event', '/tournaments/join', 'POST', {
    eventId: 999999, 
    userId: 1 
  }, (status) => status === 404 || status === 400, 'Should not allow joining phantom events');

  await testEndpoint('Join - Missing data', '/tournaments/join', 'POST', {
    eventId: 1
  }, (status) => status >= 400, 'Should reject incomplete requests');

  
  console.log('\n#5: Bracket generation');

  await testEndpoint('Generate - Non-existent event', '/tournaments/bracket/generate', 'POST', {
    eventId: 999999
  }, (status) => status === 404 || status === 400, 'Should fail gracefully for missing event');

  await testEndpoint('Generate - Missing Event ID', '/tournaments/bracket/generate', 'POST', {
  }, (status) => status >= 400, 'Should require eventId');

console.log('\n#6: Data integrity');

  await testEndpoint('Register - Invalid enum (sex)', '/auth/register', 'POST', {
    email: 'some@example.com',
    password: 'password123',
    first_name: 'Unknown',
    last_name: 'Man',
    age: 25,
    sex: 'unknown',
    skill_level: 'beginner',
    playing_hand: 'right'
  }, (status) => status >= 400, 'Should reject invalid ENUM values');

  await testEndpoint('Register - Invalid age (negative)', '/auth/register', 'POST', {
    email: 'baby@example.com',
    password: 'password123',
    first_name: 'Baby',
    last_name: 'Doe',
    age: -5,
    sex: 'male',
    skill_level: 'beginner',
    playing_hand: 'right'
  }, (status) => status >= 400, 'Should reject negative age');

  console.log('\n\x1b[1mTest run complete.\x1b[0m');
}


async function testEndpoint(
  testName: string, 
  path: string, 
  method: string, 
  body: any, 
  successCondition: (status: number) => boolean,
  failMessage: string
) {
  process.stdout.write(`Testing: ${testName}... `);
  
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (successCondition(res.status)) {
      console.log(`${GREEN}PASS (Status: ${res.status})${RESET}`);
    } else {
      console.log(`${RED}FAIL (Status: ${res.status})${RESET}`);
      console.log(`   Reason: ${failMessage}`);
    }
  } catch (error) {
    console.log(`${RED}ERROR${RESET}`);
    console.log(`   Could not connect to ${BASE_URL}${path}. Is the server running?`);
  }
}

runTests();