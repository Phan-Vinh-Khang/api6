const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cookiedb_3atl_user:swCFgz5aOeYG5B5kY8YSRxaREybOrMRP@dpg-d9selc2fngtc73f6ne1g-a.singapore-postgres.render.com/cookiedb_3atl';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- Tạo bảng ---
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS spc_data (
        id SERIAL PRIMARY KEY,
        SPC_F VARCHAR(500) NOT NULL,
        SPC_ST VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_spc_f UNIQUE (SPC_F),
        CONSTRAINT unique_spc_st UNIQUE (SPC_ST)
    )
`;

// --- Insert: ép kiểu rõ ràng bằng CTE ---
async function insertIfNotExists(spcF, spcSt) {
    const query = `
        WITH input AS (
            SELECT $1::varchar AS spc_f, $2::varchar AS spc_st
        )
        INSERT INTO spc_data (SPC_F, SPC_ST)
        SELECT spc_f, spc_st FROM input
        WHERE NOT EXISTS (
            SELECT 1 FROM spc_data WHERE SPC_F = input.spc_f OR SPC_ST = input.spc_st
        )
        RETURNING *
    `;
    
    try {
        const result = await pool.query(query, [spcF, spcSt]);
        if (result.rowCount === 0) {
            console.log(`⚠️ Bỏ qua: "${spcF}" hoặc "${spcSt}" đã tồn tại`);
        } else {
            console.log('✅ Insert thành công:', result.rows[0]);
        }
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    }
}

// --- Chạy ---
(async () => {
    const client = await pool.connect();
    await client.query(createTableQuery);
    console.log('✅ Table spc_data đã sẵn sàng');
    client.release();

    // Test
    await insertIfNotExists('value1', 'valueA');
    await insertIfNotExists('value1', 'valueB'); // Bị bỏ qua
    await insertIfNotExists('value2', 'valueA'); // Bị bỏ qua
    await insertIfNotExists('value2', 'valueB');

    await pool.end();
})();