import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id SERIAL PRIMARY KEY,
      source VARCHAR(80),
      name VARCHAR(200) NOT NULL,
      country VARCHAR(100),
      city VARCHAR(100),
      mobile VARCHAR(50) NOT NULL,
      whatsapp VARCHAR(50),
      email VARCHAR(200) NOT NULL,
      travel_date DATE,
      return_date DATE,
      adults INTEGER,
      children INTEGER,
      infants INTEGER,
      hotel_category VARCHAR(50),
      budget VARCHAR(100),
      travel_type VARCHAR(50),
      destinations TEXT,
      requirements TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  schemaReady = true;
}
