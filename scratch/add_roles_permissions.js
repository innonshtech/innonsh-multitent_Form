/**
 * scratch/add_roles_permissions.js
 * -------------------
 * Adds roles_permissions column to organizations table.
 */

const { Client } = require('pg');

const DB_URL = 'postgresql://postgres:Multitent100@db.vqpifsasrfevhsfskqhl.supabase.co:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to DB');

  const sql = `ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS roles_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;`;
  await client.query(sql);
  console.log('Column roles_permissions added successfully (if it did not exist).');

  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
