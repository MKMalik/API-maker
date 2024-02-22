// const { createConnection, closeConnection } = require("../../utils/db.helpers");
const { createConnection, closeConnection } = require('../../utils/db.helpers');

async function postController(req, res) {
  try {
    const endpoint = req.endpoint;

    const dbConnectionString = endpoint.dbConnectionString;
    const connection = await createConnection(dbConnectionString);

    const dataToInsert = req.body;
    const defaultReferenceColumn = endpoint.defaultReferenceColumn;

    await connection.beginTransaction();

    try {
      await performNestedInserts(connection, endpoint.nestedTables, dataToInsert, null, defaultReferenceColumn);

      try {
        await connection.commit();
        await closeConnection(connection);
        res.status(200).json({ message: 'Data inserted successfully' });
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
  for (const table of tablesToInsert) {
    const { tableName, columnsToInsert, nestedTables, referenceColumn } = table;

    const insertData = {};
    columnsToInsert.forEach(column => {
      if (dataToInsert[tableName]?.hasOwnProperty(column)) {
        insertData[column] = dataToInsert[tableName][column];
      }
    });

    if (parentId && referenceColumn) {
      insertData[referenceColumn] = parentId;
    }

    const insertionResult = await insertIntoTable(connection, tableName, insertData);

    if (nestedTables && nestedTables.length > 0) {
      const lastInsertId = insertionResult.insertId;
      await performNestedInserts(connection, nestedTables, dataToInsert, lastInsertId, referenceColumn);
    }
  }
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

module.exports = { postController };
