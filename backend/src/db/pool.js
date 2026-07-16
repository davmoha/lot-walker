import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lotwalker',
  user: process.env.DB_USER || 'lotwalker_admin',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Get a client from the pool and set the RLS session variable.
 * MUST be called for every authenticated request.
 * @param {string} companyId - UUID of the current company
 * @returns {pg.PoolClient} A configured client with company isolation active
 */
export async function getClientForCompany(companyId) {
  const client = await pool.connect();
  try {
    await client.query(
      `SET LOCAL app.current_company_id = $1`,
      [companyId]
    );
    return client;
  } catch (err) {
    client.release();
    throw err;
  }
}

/**
 * Run a query within a company-scoped transaction.
 * Automatically sets RLS variable, runs the callback, and releases the client.
 * @param {string} companyId
 * @param {Function} callback - async (client) => result
 */
export async function withCompanyContext(companyId, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_company_id = $1`, [companyId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Run a query without company context (for super_admin operations).
 */
export async function query(text, params) {
  return pool.query(text, params);
}

export default pool;
