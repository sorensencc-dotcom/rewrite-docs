const pg = require('pg');

const client = new pg.Client({
  host: '127.0.0.1',
  port: 5434,
  database: 'cic_agents',
  user: 'postgres',
  password: 'postgres'
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
