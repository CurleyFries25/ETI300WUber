const pool = require('./db');

(async () => {
  try {
    const result = await pool.query('SELECT * FROM drivers LIMIT 5');
    console.log("✅ Successfully retrieved data from DB:");
    console.table(result.rows);
  } catch (err) {
    console.error("❌ Database query failed:", err.message);
  } finally {
    await pool.end();
  }
})();
