const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Multitent100@db.vqpifsasrfevhsfskqhl.supabase.co:5432/postgres"
  });

  await client.connect();
  console.log("Connected successfully.");

  try {
    const res = await client.query("SELECT * FROM saas_sectors_config;");
    console.log("\n--- SECTORS IN DATABASE ---");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main().catch(err => console.error(err));
