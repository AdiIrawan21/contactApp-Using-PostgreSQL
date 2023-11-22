const Pool = require('pg').Pool

const pool = new Pool({
    user:"postgres",
    password:"admin",
    database:"db_codingtraining",
    host:"localhost",
    port:5432,
})

module.exports = pool