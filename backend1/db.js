require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Keep MySQL connections alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    // Connection timeout
    connectTimeout: 20000,

    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ Database Connection Failed");
        console.log("Error Code:", err.code);
        console.log("Error Message:", err.message);
    } else {
        console.log("✅ Database Connected Successfully");
        connection.release();
    }
});

// Handle pool errors
db.on("error", (err) => {
    console.log("❌ MySQL Pool Error:", err.code, err.message);
});

module.exports = db;