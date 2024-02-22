const { createConnection, closeConnection } = require("../../utils/db.helpers");

async function deleteController(req, res, next) {
  try {
    const endpoint = req.endpoint;

    const dbConnectionString = endpoint.dbConnectionString;
    const connection = await createConnection(dbConnectionString);

    const whereClause = endpoint.where;

    await connection.beginTransaction();

    try {
      // Perform the delete operation
      const rowsDeleted = await deleteFromTable(connection, endpoint.tableName, whereClause, req, endpoint.softDelete);

      if (rowsDeleted === 0) {
        return res.status(404).json({ message: "Data not found to delete" });
      }

      try {
        await connection.commit();
        res.status(200).json({ message: 'Data deleted successfully', deletedCount: rowsDeleted });
      } catch (error) {
        await closeConnection(connection);
        return res.status(500).json({ message: "Transaction commit failed" });
      }
    }
    catch (error) {
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
async function deleteFromTable(connection, tableName, whereClause, req, softDelete = true) {
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

    if (softDelete) {
      // If soft delete is enabled, update the 'deletedAt' column with the current timestamp
      const softDeleteQuery = `UPDATE ?? SET deletedAt = NOW() WHERE ${whereConditions}`;
      const softDeleteValues = [tableName, ...whereValues];
      try {
        const [softDeleteResults] = await connection.query(softDeleteQuery, softDeleteValues);
        resolve(softDeleteResults.affectedRows);
      } catch (error) {
        reject(error);
      }
    } else {
      // Perform a regular delete if soft delete is not enabled
      const deleteQuery = `DELETE FROM ?? WHERE ${whereConditions}`;
      const deleteValues = [tableName, ...whereValues];
      try {

        const [deleteResults] = await connection.query(deleteQuery, deleteValues);
        resolve(deleteResults.affectedRows);
      } catch (error) {
        reject(deleteError);
      }
    }
  });
}

module.exports = { deleteController };
