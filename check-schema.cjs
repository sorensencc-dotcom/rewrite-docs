const pg = require('pg');

const password = process.env.CIC_SCHEMA_CHECK_DB_PASSWORD;
if (!password) {
  console.error('CIC_SCHEMA_CHECK_DB_PASSWORD is not set. This script talks to the local dev');
  console.error('Postgres instance (127.0.0.1:5434) and requires the password via env var');
  console.error('instead of a hardcoded default.');
  process.exit(1);
}

const client = new pg.Client({
  host: '127.0.0.1',
  port: 5434,
  database: 'cic_agents',
  user: 'postgres',
  password
});

async function main() {
  try {
    await client.connect();

    // Get schema
    const schema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'agent_sessions'
      ORDER BY ordinal_position
    `);

    console.log('Columns in agent_sessions:');
    console.table(schema.rows);

    // Get data
    const sessions = await client.query('SELECT * FROM agent_sessions ORDER BY created_at DESC LIMIT 5');
    console.log('\nSessions:');
    console.table(sessions.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
