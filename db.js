// db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'uber-db.cig4fleslhmq.us-east-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'Gription15',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false  // Required for Amazon RDS
  }
});

pool.connect()
  .then(() => console.log('✅ Successfully connected to the PostgreSQL database!'))
  .catch(err => {
    console.error('❌ Failed to connect to the database:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    process.exit(1);
  });

module.exports = pool;
