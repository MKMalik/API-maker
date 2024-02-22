
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 300 }); // Cache results for 300 seconds (adjust as needed)


const mysql = require('mysql2/promise'); // Import mysql2/promise for promise-based API
const { async } = require("@firebase/util");

async function createConnection(connectionString) {
  const connectionParams = parseConnectionString(connectionString);
  const connection = await mysql.createConnection({
    host: connectionParams.host,
    user: connectionParams.user,
    password: connectionParams.password,
    port: connectionParams.port || 3306,
    database: connectionParams.database
  });

  // No need to call connection.connect() with mysql2/promise

  return connection;
}

async function closeConnection(connection) {
  await connection.end(); // Use await to wait for the end() method to finish
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
async function fetchColumnsFromDatabase(tableName, connection) {
  return new Promise(async (resolve, reject) => {
    // Query to fetch column names
    const query = `SHOW COLUMNS FROM ${tableName}`;
    try {
      const results = await connection.query(query);
      // console.log(results, 'results');
      // Extract column names from query results
      const columns = results[0].map(result => result.Field);
      resolve(columns);
    } catch (error) {
      reject(error);
    }
  });
}

function fetchAllColumnsFromDatabase(tableName, connection) {
  return new Promise((resolve, reject) => {
    const cacheKey = `fn_fetchAllColumnsFromDatabase_${tableName}_${JSON.stringify(connection.toString())}`;

    // Check if the result is already cached
    const cachedResult = myCache.get(cacheKey);
    if (cachedResult) {
      // console.log("Retrieving from cache");
      resolve(cachedResult);
    } else {
      // If not cached, fetch the result from the database
      fetchColumnsFromDatabase(tableName, connection)
        .then(result => {
          // Cache the result with the cache key for a certain period of time
          myCache.set(cacheKey, result);
          // console.log("Fetching from database");
          resolve(result);
        })
        .catch(error => {
          reject(error);
        });
    }
  });
};


module.exports = {
  createConnection,
  closeConnection,
  parseConnectionString,
  fetchAllColumnsFromDatabase,
};
