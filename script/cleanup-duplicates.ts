import pg from "pg";

async function cleanupDuplicates() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("No DATABASE_URL, skipping cleanup");
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vehicle_usage'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("vehicle_usage table does not exist yet, skipping cleanup");
      return;
    }

    const result = await client.query(`
      DELETE FROM vehicle_usage 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM vehicle_usage 
        GROUP BY company_id, driver_id, vehicle_id
      )
    `);

    console.log(`Cleaned up ${result.rowCount} duplicate vehicle_usage rows`);
  } catch (err) {
    console.error("Cleanup error (non-fatal):", err);
  } finally {
    await client.end();
  }
}

cleanupDuplicates();
