const { createConnection, closeConnection } = require("../../utils/db.helpers");

async function patchController(req, res) {
  try {
    const endpoint = req.endpoint;

    const dbConnectionString = endpoint.dbConnectionString;
    const connection = await createConnection(dbConnectionString);

    const body = req.body;
    const whereClause = endpoint.where;
    const columnsToUpdate = endpoint.columnsToUpdate;

    // Filter the columns from req.body based on the allowed columns
    const filteredDataToUpdate = {};
    columnsToUpdate.forEach(column => {
      if (body.hasOwnProperty(column)) {
        filteredDataToUpdate[column] = body[column];
      }
    });
    await connection.beginTransaction();

    try {
      const affectedRows = await updateTable(connection, endpoint.tableName, filteredDataToUpdate, whereClause, req);
      console.log("TCL: patchController -> affectedRows", affectedRows)
      try {
        await connection.commit();
        if (affectedRows !== 0) res.status(200).json({ message: 'Data updated successfully' });
        else res.status(404).json({ message: 'Data does not exists' });
      } catch (error) {
        await closeConnection(connection);
        return res.status(500).json({ message: "Transaction commit failed" });
      }

    } catch (error) {
      console.error('Error occurred:', error);
      await closeConnection(connection);
      return res.status(500).json({ message: error.message });
    }

  } catch (error) {
    console.error('Error occurred:', error);
    if (error.sql) delete error.sql;
    res.status(500).json({ message: 'Internal server error', log: error });
  }
}

async function updateTable(connection, tableName, data, whereClause, req) {
  return new Promise(async (resolve, reject) => {
    const whereConditions = Object.keys(whereClause).map(key => `${key} = ?`).join(' AND ');
    const whereValues = Object.values(whereClause).map(key => {
      if (key.startsWith('req.')) {
        const reqKey = key.replace('req.', '');
        const nestedKeys = reqKey.split('.');
        let nestedValue = req;

        for (const nestedKey of nestedKeys) {
          if (nestedValue.hasOwnProperty(nestedKey)) {
            nestedValue = nestedValue[nestedKey];
          } else {
            // Handle the case where a nested property is not found
            nestedValue = undefined;
            break;
          }
        }

        return nestedValue;
      } else {
        return key;
      }
    });

    const query = `UPDATE ?? SET ? WHERE ${whereConditions}`;
    const values = [tableName, data, ...whereValues];
    try {
      const [results] = await connection.query(query, values);
      resolve(results.affectedRows);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { patchController };
