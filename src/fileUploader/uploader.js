import fs from 'fs';
import path from 'path';
import Pool from '../DatabaseConnection/postgresConnections';
import {nanoid} from 'nanoid';

const BATCH_SIZE = 1000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertBatch(batch) {

    const values = [];
    const placeholders = [];

    batch.forEach((url, index) => {
        placeholders.push(`($${index + 1})`);
        values.push(url);
    });

    const query = `
        INSERT INTO urls(long_url)
        VALUES ${placeholders.join(",")}
        RETURNING id
    `;

    const result = await Pool.query(query, values);

    const updates = [];

    result.rows.forEach(row => {
        updates.push({
            id: row.id,
            shortCode:nanoid.generate(8)
        });
    });

    const updatePromises = updates.map(item =>
        Pool.query(
            `
            UPDATE urls
            SET short_url = $1
            WHERE id = $2
            `,
            [item.shortCode, item.id]
        )
    );

    await Promise.all(updatePromises);

    return updates.length;
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

        const stream = fs
            .createReadStream(filePath)
            .pipe(csv());

        stream.on("data", async row => {

            stream.pause();

            try {

                batch.push(row.long_url);

                if (batch.length >= BATCH_SIZE) {

                    processed += await insertBatch(batch);

                    batch.length = 0;

                    await Pool.query(
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
                    processed += await insertBatch(batch);
                }

                await Pool.query(
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
    const client = await Pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(`
            SELECT id,file_name
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


const mainWorker = async() => {
    try {
        while(true) {
        let getJob = await getNextJob();
        
        if (!getJob) {
            await sleep(5000);
            continue;
        }

        console.log(
                `Processing Job ${job.id}`
            );

            await processFile(job);

            console.log(
                `Completed Job ${job.id}`
            );
        
    }
    }
    catch(error){

    }
    
}