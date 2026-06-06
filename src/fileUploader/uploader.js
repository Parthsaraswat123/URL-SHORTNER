import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { nanoid } from 'nanoid';
import { pool } from '../DatabaseConnection/postgresConnections.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_SIZE = 1000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertBatch(batch, userId) {
    if (!batch || batch.length === 0) return 0;
    
    const values = [];
    const placeholders = [];
    const expiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    batch.forEach((url, index) => {
        const baseIndex = index * 4;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
        values.push(url, nanoid(8), expiryDate, userId);
    });

    const query = `
        INSERT INTO urls(original_url, short_url, expiry_date, user_id)
        VALUES ${placeholders.join(",")}
        RETURNING id
    `;

    const result = await pool.query(query, values);
    return result.rowCount;
}

async function processFile(job) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(
            __dirname,
            "../uploads",
            job.file_name
        );

        const batch = [];
        let processed = 0;

        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`));
        }

        const stream = fs
            .createReadStream(filePath)
            .pipe(csv());

        stream.on("data", async row => {
            stream.pause();
            try {
                // Read row.long_url or row.original_url
                const url = row.long_url || row.original_url || row.url;
                if (url) {
                    batch.push(url);
                }

                if (batch.length >= BATCH_SIZE) {
                    processed += await insertBatch(batch, job.user_id);
                    batch.length = 0;

                    await pool.query(
                        `
                        UPDATE import_jobs
                        SET processed_records = $1
                        WHERE id = $2
                        `,
                        [processed, job.id]
                    );
                }
            } catch (err) {
                return reject(err);
            }
            stream.resume();
        });

        stream.on("end", async () => {
            try {
                if (batch.length > 0) {
                    processed += await insertBatch(batch, job.user_id);
                }

                await pool.query(
                    `
                    UPDATE import_jobs
                    SET
                        status='COMPLETED',
                        processed_records=$1
                    WHERE id=$2
                    `,
                    [processed, job.id]
                );
                resolve();
            } catch (err) {
                reject(err);
            }
        });

        stream.on("error", reject);
    });
}

async function getNextJob() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const result = await client.query(`
            SELECT id, file_name, user_id
            FROM import_jobs
            WHERE status = 'PENDING'
            ORDER BY id
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            await client.query("COMMIT");
            return null;
        }

        const job = result.rows[0];

        await client.query(
            `
            UPDATE import_jobs
            SET status='PROCESSING'
            WHERE id=$1
            `,
            [job.id]
        );

        await client.query("COMMIT");
        return job;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

const mainWorker = async () => {
    try {
        console.log("Bulk upload worker started...");
        while (true) {
            let job = await getNextJob();
            if (!job) {
                await sleep(5000);
                continue;
            }
            console.time('Processing Job ' + job.id);
            console.log(`Processing Job ${job.id}: ${job.file_name}`);
            try {
                await processFile(job);
                console.log(`Completed Job ${job.id}`);
            } catch (jobError) {
                console.error(`Error processing Job ${job.id}:`, jobError);
                await pool.query(
                    `
                    UPDATE import_jobs
                    SET status='FAILED'
                    WHERE id=$1
                    `,
                    [job.id]
                );
            }
            console.timeEnd('Processing Job ' + job.id);
        }
    } catch (error) {
        console.error("Worker encountered a fatal error:", error);
    }
}

// Self-run worker if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {

    mainWorker();
}

// export { mainWorker };