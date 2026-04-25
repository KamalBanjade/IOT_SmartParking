import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initDatabase() {
  console.log('🔌 Connecting to PostgreSQL...');

  try {
    await client.connect();
    console.log(`✅ Connected → ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);
  } catch (err) {
    console.error('❌ Could not connect to database:', err.message);
    console.error('   Make sure PostgreSQL is running and credentials in .env are correct.');
    process.exit(1);
  }

  // Read schema.sql relative to project root
  const schemaPath = path.resolve(__dirname, '../../docs/schema.sql');
  let sql;
  try {
    sql = fs.readFileSync(schemaPath, 'utf8');
  } catch (err) {
    console.error('❌ Could not read schema.sql:', err.message);
    await client.end();
    process.exit(1);
  }

  console.log('📄 Running schema.sql ...\n');

  try {
    await client.query(sql);
  } catch (err) {
    console.error('❌ Schema execution failed:', err.message);
    await client.end();
    process.exit(1);
  }

  // Verify each table exists and report row counts
  const tables = ['parking_slots', 'users', 'parking_sessions', 'payments', 'loyalty_points'];
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ✅ Table "${table}" ready  (${res.rows[0].count} rows)`);
    } catch (err) {
      console.error(`   ❌ Table "${table}" failed:`, err.message);
    }
  }

  console.log('\n🌱 Seed data check — parking_slots:');
  const slots = await client.query(
    'SELECT id, label, status, controller_id FROM parking_slots ORDER BY id'
  );
  slots.rows.forEach((s) =>
    console.log(`   • Slot ${s.id}: [${s.label}] ${s.status} → ${s.controller_id}`)
  );

  console.log('\n🎉 Database initialised successfully!');
  await client.end();
}

initDatabase();
