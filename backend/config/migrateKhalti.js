import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    await client.connect();
    console.log('🔌 Connected to database for migration...');

    const sql = `
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS pidx VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;
    `;

    await client.query(sql);
    console.log('✅ Payments table updated with Khalti columns');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
