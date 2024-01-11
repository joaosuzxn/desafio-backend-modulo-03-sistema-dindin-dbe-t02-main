const { Pool } = require('pg')
const senha = require('./senhaBanco')
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: senha,
    database: 'dindin'
});


module.exports = pool