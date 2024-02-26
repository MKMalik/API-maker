const { createConnection, closeConnection } = require("../../utils/db.helpers");
const { verifyHash } = require("../../utils/encrypt");
const { signJwt } = require("../../utils/jwt");

async function handleLogin(req, res, next) {
  const endpoint = req.endpoint;

  const connection = await createConnection(endpoint.dbConnectionString);
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
      return res.status(403).json({ message: `Wrong value of ${hashInfo.ref} provided.` }); u
    }
  }

  // jwt sign
  let jwtParams = {};
  for (let key of jwt ?? []) {
    const jwtKey = key.replace(".", "_");
    jwtParams[jwtKey] = getNestedValue(fetchedData, key);
  }

  const { token, payload: jwtPayload } = jwt ? signJwt(jwtParams, jwtSecret, endpoint.jwtExpiry) : {};
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

module.exports = { handleLogin }
