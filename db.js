const { Client } = require('pg');

const client = new Client({
  host: 'uber-db.cig4fleslhmq.us-east-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres', // double-check this username
  password: 'Gription15', // make sure it's correct
  database: 'postgres', // make sure this is the correct database name

 ssl: {
    rejectUnauthorized: false
  }


});

client.connect()
  .then(() => console.log("✅ Connected to the database"))
  .catch(err => console.error("❌ Connection error", err.stack));

module.exports = client;
