// backend/db.js
const sql = require('mssql');
require('dotenv').config();


const config = {
  user: process.env.DB_USER, // your database user
  password: process.env.DB_PASS, // your database password
  server: process.env.DB_HOST, // your database server
  database: process.env.DB_NAME, // your database name
  options: {
    encrypt: true, // Use this if you're on Azure
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch((err) => {
    console.error('Database Connection Failed! Bad Config: ', err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
