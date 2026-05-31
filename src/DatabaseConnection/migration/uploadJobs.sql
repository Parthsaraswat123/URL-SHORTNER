CREATE TABLE import_jobs (
    id SERIAL PRIMARY KEY,
    file_name TEXT,
    status VARCHAR(20),
    total_records BIGINT DEFAULT 0,
    processed_records BIGINT DEFAULT 0,
    failed_records BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);