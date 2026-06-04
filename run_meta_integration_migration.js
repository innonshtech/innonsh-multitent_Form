/**
 * run_meta_integration_migration.js
 * ----------------------------
 * Migration runner to create the meta_integrations table in Supabase PostgreSQL.
 * Run using: node run_meta_integration_migration.js
 */

const { Client } = require('pg');

const DB_URL = 'postgresql://postgres:Multitent100@db.vqpifsasrfevhsfskqhl.supabase.co:5432/postgres';

const SQL = `
-- Create Meta Integrations Table
CREATE TABLE IF NOT EXISTS public.meta_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    page_name TEXT,
    page_access_token TEXT NOT NULL,
    form_id TEXT, -- Optional specific Form ID filter
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for fast lookup when a webhook triggers
CREATE INDEX IF NOT EXISTS idx_meta_integrations_page ON public.meta_integrations(page_id);
CREATE INDEX IF NOT EXISTS idx_meta_integrations_form ON public.meta_integrations(form_id);
CREATE INDEX IF NOT EXISTS idx_meta_integrations_org ON public.meta_integrations(org_id);
`;

async function main() {
  const client = new Client({ connectionString: DB_URL });

  console.log('\n🔌 Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!');
  console.log('='.repeat(60));

  try {
    console.log('🏗️  Creating meta_integrations table...');
    await client.query(SQL);
    console.log('✅ Table created successfully!');
  } catch (err) {
    console.error('❌ Migration failed!');
    console.error(`   Error [${err.code}]: ${err.message}`);
    process.exit(1);
  }

  // Verification Check
  console.log('='.repeat(60));
  console.log('🔍 Verifying meta_integrations table in database...\n');
  try {
    const colsRes = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'meta_integrations' AND table_schema = 'public' ORDER BY ordinal_position`
    );
    const cols = colsRes.rows.map(r => `${r.column_name} (${r.data_type})`);
    console.log('📋 Table: meta_integrations');
    cols.forEach(c => console.log(`     - ${c}`));

  } catch (err) {
    console.error('❌ Verification check failed:', err.message);
  }

  await client.end();
  console.log('\n🎉 Migration completed successfully!\n');
}

main().catch(err => {
  console.error('\n💥 Fatal error during migration:', err.message);
  process.exit(1);
});
