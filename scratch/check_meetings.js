const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Manually parse env file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const connectionString = env.DATABASE_URL;

async function checkMeetings() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log('Querying meetings table...');
    const res = await client.query(`
      SELECT *
      FROM meetings
      ORDER BY start_time DESC
    `);
    console.log('Meetings list in DB:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkMeetings();
