import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PostgresConnection } from './postgresConnections.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function runMigrations() {
    console.log("Starting database migrations...");
    const pool = await PostgresConnection();
    
    // Acquire a dedicated client from the connection pool for session-level locking and transaction
    const client = await pool.connect();
    
    try {
        // 1. Begin a transaction
        await client.query('BEGIN');

        // 2. Acquire a transactional advisory lock
        // 135792468 is an arbitrary unique 64-bit integer representing this application's lock.
        // If another instance of the server is already running migrations, this will wait.
        await client.query('SELECT pg_advisory_xact_lock(135792468)');
        console.log("Acquired migration advisory lock successfully.");

        // 3. Create the migrations log table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Retrieve already executed migrations
        const { rows } = await client.query('SELECT name FROM _migrations');
        const executedMigrations = new Set(rows.map(row => row.name));

        // 5. Specify your migrations in strict execution order (dependencies first)
        const migrationFiles = [
            'userModel.sql',
            'urlModel.sql',
            'urlAnalyticsModel.sql',
            'uploadJobs.sql'
        ];

        // 6. Run pending migrations
        let runCount = 0;
        for (const file of migrationFiles) {
            if (executedMigrations.has(file)) {
                continue;
            }

            console.log(`Executing migration: ${file}...`);
            const filePath = path.join(__dirname, 'migration', file);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`Migration file not found: ${filePath}`);
            }

            const sql = fs.readFileSync(filePath, 'utf8');
            console.log("sql : ",sql);
            // Run individual migration script
            await client.query(sql);

            // Record execution in the tracking table
            await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
            console.log(`✓ Successfully executed ${file}`);
            runCount++;
        }

        // 7. Commit all migrations atomically
        await client.query('COMMIT');
        
        if (runCount === 0) {
            console.log("Database schema is up-to-date. No migrations executed.");
        } else {
            console.log(`Successfully completed ${runCount} migration(s).`);
        }

    } catch (error) {
        // Rollback entire block if any single migration fails
        console.error("Migration failed. Rolling back all changes in this batch...", error);
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error("Failed to rollback transaction:", rollbackError);
        }
        throw error;
    } finally {
        // Release client back to pool
        client.release();
        // End pool so the script process can exit gracefully
        await pool.end();
    }
}

// Self-execute if run directly from terminal (e.g. node runMigrations.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runMigrations()
        .then(() => {
            console.log("Migrations check completed.");
            process.exit(0);
        })
        .catch((err) => {
            console.error("Critical Migration Error:", err);
            process.exit(1);
        });
}
