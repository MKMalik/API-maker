// const { createConnection, closeConnection } = require("../../utils/db.helpers");
const { createConnection, closeConnection } = require('../../utils/db.helpers');
const { calculateHash, verifyHash } = require('../../utils/encrypt');
const jwt = require('jsonwebtoken');
const { signJwt } = require('../../utils/jwt');

async function postController(req, res, next) {
  try {
    const endpoint = req.endpoint;

    const dbConnectionString = endpoint.dbConnectionString;
    const connection = await createConnection(dbConnectionString);

    const dataToInsert = req.body;

    if (req.method === "LOGIN") {
      return handleLogin(req, res, next, connection);
    }

    const defaultReferenceColumn = endpoint.defaultReferenceColumn;

    await connection.beginTransaction();

    try {
      const insertedDataResults = await performNestedInserts(connection, endpoint.nestedTables, dataToInsert, null, defaultReferenceColumn);
      console.log(insertedDataResults);

      try {
        await connection.commit();
        await closeConnection(connection);

        // Check if req.endpoint.jwt exists and contains data
        if (req.endpoint.jwt && req.endpoint.jwt.length > 0) {
          const tokenData = await getDataForJWT(insertedDataResults, req.endpoint.jwt, dataToInsert);
          const token = jwt.sign(tokenData, req.endpoint.jwtSecret);
          res.status(200).json({ message: 'Data inserted successfully', token });
        } else {
          res.status(200).json({ message: 'Data inserted successfully' });
        }
      }
      catch (error) {
        closeConnection(connection);
        return res.status(500).json({ message: "Transaction commit failed" });
      }
    } catch (error) {
      console.error('Error occurred:', error);
      closeConnection(connection);
      return res.status(500).json({ message: error.message });
    }

  } catch (error) {
    console.error('Error occurred:', error);
    if (error.sql) delete error.sql;
    res.status(500).json({ message: 'Internal server error', log: error });
  }
}


async function performNestedInserts(connection, tablesToInsert, dataToInsert, parentId, referenceColumn) {
  const insertedDataResults = []; // Array to store insertion results
  // tablesToInsert will be empty in case of login (it's login api when endpoint.jwt exists) api (as it does not require to insert any data but to fetch and authenticate)
  for (const table of tablesToInsert ?? []) {
    const { tableName, columnsToInsert, nestedTables } = table;
    const hashRegex = /^hash\(.+\)$/;
    const insertData = {};

    for (const column of columnsToInsert) {
      if (hashRegex.test(column)) {
        // Handle hash(*) column case
        const columnName = column.substring(5, column.length - 1); // Extracting the column name from "hash(columnName)"
        if (dataToInsert[tableName]?.hasOwnProperty(columnName)) {
          insertData[columnName] = await calculateHash(dataToInsert[tableName][columnName]); // Assuming you have a function to calculate the hash
        }
      } else if (dataToInsert[tableName]?.hasOwnProperty(column)) {
        insertData[column] = dataToInsert[tableName][column];
      }
    }

    if (parentId && referenceColumn) {
      insertData[referenceColumn] = parentId;
    }
    let insertionResult;
    try {
      insertionResult = await insertIntoTable(connection, tableName, insertData);
      insertedDataResults.push({ tableName, insertId: insertionResult.insertId, affectedRows: insertionResult.affectedRows });
    } catch (error) {
      console.error('Error occurred during insertion:', error);
      throw error; // Rethrow the error to stop further nested inserts
    }

    if (nestedTables && nestedTables.length > 0) {
      const lastInsertId = insertionResult.insertId;
      const nestedInsertionResults = await performNestedInserts(connection, nestedTables, dataToInsert, lastInsertId, referenceColumn);
      insertedDataResults.push(...nestedInsertionResults); // Store nested insertion results
    }
  }

  return insertedDataResults;
}

async function insertIntoTable(connection, tableName, data) {
  console.log("TCL: insertIntoTable -> tableName, data", tableName, data)
  return new Promise(async (resolve, reject) => {
    const query = `INSERT INTO ${tableName} SET ?`;
    try {
      const [results] = await connection.query(query, data);
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

async function getDataForJWT(insertedDataResults, jwtColumns, dataToInsert) {
  const tokenData = {};

  for (const jwtColumn of jwtColumns) {
    const [tableName, columnName] = jwtColumn.split('.'); // Split table name and column name
    if (dataToInsert[tableName]?.hasOwnProperty(columnName)) {
      tokenData[columnName] = dataToInsert[tableName][columnName];
    }
  }

  // Add IDs of inserted rows to the token data
  for (const insertedData of insertedDataResults) {
    if (insertedData.insertId) {
      tokenData[`${insertedData.tableName}_id`] = insertedData.insertId;
    }
  }

  return tokenData;
}

async function handleLogin(req, res, next, connection) {
  const endpoint = req.endpoint;
  const jwt = endpoint.jwt;
  const jwtSecret = endpoint.jwtSecret;
  const matches = endpoint.matches;
  const fetchedData = {};
  let hashedParamInfo = [];
  for (const match of matches) {
    const tableName = match.tableName;
    const parameters = match.parameters;
    const jwtColumnsToFetch = jwt?.filter((jwtParam) => {
      return jwtParam.startsWith(tableName);
    }).map((jwtParam) => jwtParam.split('.')[1]);
    try {
      const data = await fetchDataForTable(connection, tableName, parameters, jwtColumnsToFetch, req);
      if (data.hash) {
        hashedParamInfo = [...hashedParamInfo, ...(data.hash)];
        delete data.hash;
      }
      fetchedData[tableName] = data.tableData;
    } catch (error) {
      closeConnection(connection);
      return res.status(error.status ?? 500).json({ message: error.message });
    }
  }

  for (const hashInfo of hashedParamInfo) {
    const [_, ...propertyNames] = hashInfo.ref.split('.');
    // columnValue = requestBody[propertyName];
    let plainText = req;
    for (const propertyName of propertyNames) {
      plainText = plainText[propertyName];
    }
    const isMatched = await verifyHash(fetchedData[hashInfo.tableName][hashInfo.columnName], plainText);
    console.log(fetchedData[hashInfo.tableName][hashInfo.columnName], plainText, isMatched);
    // console.log(hashedText, fetchedData[hashInfo.tableName][hashInfo.columnName]);
    if (!isMatched) {
      closeConnection(connection);
      return res.status(403).json({ message: `Wrong value of ${hashInfo.ref} provided.` });
    }
  }

  // jwt sign
  let jwtParams = {};
  for (const key of jwt ?? []) {
    jwtParams[key] = getNestedValue(fetchedData, key);
  }

  const {token, payload: jwtPayload} = jwt ? signJwt(jwtParams, jwtSecret, endpoint.jwtExpiry) : {};
  console.log(fetchedData, ' fetchedData', jwtParams);
  closeConnection(connection);
  const response = { message: 'Login succcess', }
  if (token) {
    response.token = token;
    response.data = jwtPayload;
  }
  return res.status(200).json(response);
}

async function fetchDataForTable(connection, tableName, parameters, jwtColumnsToFetch, req) {
  const tableData = {}; // Object to store fetched data for the table

  // Construct the SQL query
  const conditions = [];
  const columns = jwtColumnsToFetch ?? [];
  let hash = [];

  // Build the WHERE conditions based on the parameters
  for (const parameter of parameters) {
    const columnName = parameter.column;
    columns.push(columnName);
    const ref = parameter.ref;
    const fn = parameter.fn;

    // Extract the value from the request body or execute the reference function
    let columnValue;

    if (ref.startsWith('req') && !fn) {
      const [_, ...propertyNames] = ref.split('.');
      // columnValue = requestBody[propertyName];
      let propertyKey = req;
      for (const propertyName of propertyNames) {
        propertyKey = propertyKey[propertyName];
      }
      columnValue = propertyKey;
    } else if (fn && fn === 'equal') {
      columnValue = ref;
    } else if (fn && fn === 'hash') {
      hash = [...hash, { ref, tableName, columnName }]
      // columnValue = await functions.hash(ref);
      continue;
    }

    conditions.push(`${columnName} = '${columnValue}'`);
  }
  const columnsString = columns.map(column => `\`${column}\``).join(', ');
  let query = `SELECT ${columnsString} FROM ${tableName} `;

  if (conditions.length) query += " WHERE ";

  query += conditions.join(' AND ');

  try {
    // Execute the query
    const [rows] = await connection.query(query);
    // console.log(rows, query);
    // If data is found, populate tableData with the fetched row
    if (rows.length > 0) {
      const fetchedRow = rows[0]; // Assuming only one row is fetched
      for (const column in fetchedRow) {
        tableData[column] = fetchedRow[column];
      }
    } else {
      throw { message: `Data not found in ${tableName}`, status: 404 };
      // return res.status(404).json({message: `Data not found in ${tableName}`})
    }

    return { tableData, hash };
  } catch (error) {
    console.error('Error occurred while fetching data:', JSON.stringify(error));
    throw error;
  }
}

function getNestedValue(obj, key) {
  const propertyNames = key.split('.');
  let value = obj;
  for (const propertyName of propertyNames) {
    value = value[propertyName];
  }
  return value;
}
module.exports = { postController };
