const mysql = require('mysql');

const CONNECTION_CONFIG = {
    host: '',
    user: '',
    password: '',
    database: ''
}

class Database {
    constructor() {
        let connection = mysql.createConnection(CONNECTION_CONFIG);

        connection.connect();
        
        this.connection = connection;
    }

    query(sql) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, function(error, results, fields) {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            })
        })
    }
}

module.exports = Database