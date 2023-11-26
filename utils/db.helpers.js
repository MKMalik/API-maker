const mysql = require('mysql');

function createConnection(connectionString) {
    const connectionParams = parseConnectionString(connectionString);
    const connection = mysql.createConnection({
        host: connectionParams.host,
        user: connectionParams.user,
        password: connectionParams.password,
        port: connectionParams.port || 3306,
        database: connectionParams.database
    });

    connection.connect();
    return connection;
}

function closeConnection(connection) {
    connection.end();
}

function parseConnectionString(connectionString) {
    const [credentials, hostInfo] = connectionString.split('@');
    const [username, password] = credentials.split(':');
    const [hostWithPort, database] = hostInfo.split('/');
    const [host, port] = hostWithPort.split(':');

    return {
        host: host,
        user: username,
        password: password || '', // Set password to an empty string if not provided
        port: port || 3306, // Set port to an empty string if not provided
        database: database
    };
}


// Function to fetch all columns from the database
function fetchAllColumnsFromDatabase(tableName, connection) {
    return new Promise((resolve, reject) => {
        // Query to fetch column names
        const query = `SHOW COLUMNS FROM ${tableName}`;

        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                // Extract column names from query results
                const columns = results.map(result => result.Field);
                resolve(columns);
            }
        });
    });
}

module.exports = {
    createConnection,
    closeConnection,
    parseConnectionString,
    fetchAllColumnsFromDatabase,
};