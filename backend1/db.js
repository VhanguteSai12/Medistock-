const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "medistock"
});

db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err);
    } else {
        console.log("Database Connected Successfully");
    }
});

module.exports = db;