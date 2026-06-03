const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Multitent100@db.vqpifsasrfevhsfskqhl.supabase.co:5432/postgres"
  });

  await client.connect();
  console.log("Connected successfully.");

  try {
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("\n--- PUBLIC TABLES ---");
    console.log(tables.rows.map(r => r.table_name));

    // For any table matching sector, show its columns
    const sectorTables = tables.rows.filter(r => r.table_name.includes('sector') || r.table_name.includes('saas'));
    for (const st of sectorTables) {
      const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public' 
        ORDER BY ordinal_position;
      `, [st.table_name]);
      console.log(`\n--- COLUMNS IN ${st.table_name} ---`);
      console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main().catch(err => console.error(err));
