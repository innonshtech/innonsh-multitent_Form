/**
 * run_created_by_migration.js
 * ----------------------------
 * 1. Adds created_by column to public.leads referencing public.users(id).
 * 2. Adds created_by_role column to public.leads.
 * Run with: node run_created_by_migration.js
 */

const { Client } = require('pg');

const DB_URL = 'postgresql://postgres:Multitent100@db.vqpifsasrfevhsfskqhl.supabase.co:5432/postgres';

const MIGRATIONS = [
  {
    name: 'Add created_by column to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;`
  },
  {
    name: 'Add created_by_role column to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50) DEFAULT 'sales_rep';`
  }
];

async function main() {
  const client = new Client({ connectionString: DB_URL });

  console.log('\n🔌 Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!\n');
  console.log('='.repeat(60));

  console.log('🛠️ Running migrations to add ownership fields...');
  console.log('='.repeat(60));
  for (const migration of MIGRATIONS) {
    try {
      await client.query(migration.sql);
      console.log(`✅ ${migration.name}`);
    } catch (err) {
      if (err.code === '42701' || err.code === '42P07' || err.code === '42710') {
        console.log(`⚠️  ${migration.name} — Already exists (skipped)`);
      } else {
        console.error(`❌ Migration Failed: ${migration.name}`);
        console.error(`   Error [${err.code}]: ${err.message}`);
        await client.end();
        process.exit(1);
      }
    }
  }

  // Set existing leads to have created_by_role = 'sales_rep' if null/not set
  try {
    const res = await client.query(`UPDATE public.leads SET created_by_role = 'sales_rep' WHERE created_by_role IS NULL;`);
    console.log(`✅ Set default role for legacy records (Rows affected: ${res.rowCount || 0})`);
  } catch (err) {
    console.error('⚠️  Failed to set default role for legacy records:', err.message);
  }

  await client.end();
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
