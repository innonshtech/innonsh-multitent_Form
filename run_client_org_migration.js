/**
 * run_client_org_migration.js
 * ----------------------------
 * 1. Creates public.client_organizations table in PostgreSQL.
 * 2. Alters contacts and deals tables to add organization_id columns.
 * 3. Migrates existing company names into deduplicated client_organizations records and updates relationships.
 * Run with: node run_client_org_migration.js
 */

const { Client } = require('pg');

const DB_URL = 'postgresql://postgres:Multitent100@db.vqpifsasrfevhsfskqhl.supabase.co:5432/postgres';

const MIGRATIONS = [
  {
    name: 'Create client_organizations table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.client_organizations (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        name         VARCHAR(255) NOT NULL,
        website      VARCHAR(255) DEFAULT '',
        industry     VARCHAR(100) DEFAULT '',
        phone        VARCHAR(50) DEFAULT '',
        email        VARCHAR(255) DEFAULT '',
        city         VARCHAR(100) DEFAULT '',
        state        VARCHAR(100) DEFAULT '',
        country      VARCHAR(100) DEFAULT 'India',
        assigned_to  UUID REFERENCES public.users(id) ON DELETE SET NULL,
        custom_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
  },
  {
    name: 'Create unique index on client_organizations (org_id, name)',
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS uq_client_org_org_id_name
        ON public.client_organizations (org_id, TRIM(BOTH FROM name));
    `
  },
  {
    name: 'Enable RLS on client_organizations',
    sql: `ALTER TABLE public.client_organizations ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Add organization_id to contacts',
    sql: `ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.client_organizations(id) ON DELETE SET NULL;`
  },
  {
    name: 'Add organization_id to deals',
    sql: `ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.client_organizations(id) ON DELETE SET NULL;`
  }
];

async function main() {
  const client = new Client({ connectionString: DB_URL });

  console.log('\n🔌 Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!\n');
  console.log('='.repeat(60));

  // Step 1: Run table creation and alter statements
  console.log('🛠️  PART 1: Schema Updates');
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

  // Step 2: Migrate existing data
  console.log('\n📦 PART 2: Data Migration (Migrating contacts and deals company strings)');
  console.log('='.repeat(60));

  try {
    // 1. Fetch contacts with non-empty company
    const contactsRes = await client.query(`
      SELECT id, org_id, company, assigned_to, city, state, country, custom_data 
      FROM public.contacts 
      WHERE company IS NOT NULL AND TRIM(company) != '' AND organization_id IS NULL
    `);
    
    // 2. Fetch deals with non-empty company
    const dealsRes = await client.query(`
      SELECT id, org_id, company, assigned_to, custom_data 
      FROM public.deals 
      WHERE company IS NOT NULL AND TRIM(company) != '' AND organization_id IS NULL
    `);

    console.log(`Found ${contactsRes.rows.length} contacts and ${dealsRes.rows.length} deals to migrate.`);

    const allRecords = [...contactsRes.rows.map(r => ({ ...r, type: 'contact' })), ...dealsRes.rows.map(r => ({ ...r, type: 'deal' }))];

    let migratedOrgs = 0;
    let updatedContacts = 0;
    let updatedDeals = 0;

    for (const record of allRecords) {
      const companyName = record.company.trim();
      const orgId = record.org_id;

      if (!orgId) continue; // Skip orphaned records without tenant ID

      // Find or create Client Organization
      let orgRes = await client.query(
        `SELECT id FROM public.client_organizations WHERE org_id = $1 AND TRIM(name) = $2`,
        [orgId, companyName]
      );

      let clientOrgId;

      if (orgRes.rows.length > 0) {
        clientOrgId = orgRes.rows[0].id;
      } else {
        // Insert new client organization
        const insertRes = await client.query(`
          INSERT INTO public.client_organizations (
            org_id, name, city, state, country, assigned_to, custom_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          orgId,
          companyName,
          record.city || '',
          record.state || '',
          record.country || 'India',
          record.assigned_to || null,
          record.custom_data || {}
        ]);
        clientOrgId = insertRes.rows[0].id;
        migratedOrgs++;
      }

      // Link record to organization_id
      if (record.type === 'contact') {
        await client.query(
          `UPDATE public.contacts SET organization_id = $1 WHERE id = $2`,
          [clientOrgId, record.id]
        );
        updatedContacts++;
      } else {
        await client.query(
          `UPDATE public.deals SET organization_id = $1 WHERE id = $2`,
          [clientOrgId, record.id]
        );
        updatedDeals++;
      }
    }

    console.log(`✅ Data migration completed successfully!`);
    console.log(`   - Created ${migratedOrgs} Client Organizations`);
    console.log(`   - Linked ${updatedContacts} Contacts`);
    console.log(`   - Linked ${updatedDeals} Deals`);

  } catch (err) {
    console.error('❌ Data migration failed:', err.message);
  }

  await client.end();
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
