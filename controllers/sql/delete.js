const { createConnection, closeConnection } = require("../../utils/db.helpers");

async function deleteController(req, res, next) {
    try {
        const endpoint = req.endpoint;

        const dbConnectionString = endpoint.dbConnectionString;
        const connection = createConnection(dbConnectionString);

        const whereClause = endpoint.where;

        connection.beginTransaction(async (beginTransactionErr) => {
            if (beginTransactionErr) {
                closeConnection(connection);
                return res.status(500).json({ message: "Transaction begin failed" });
            }

            try {
                // Perform the delete operation
                const rowsDeleted = await deleteFromTable(connection, endpoint.tableName, whereClause, req);

                if (rowsDeleted === 0) {
                    return res.status(404).json({ message: "Data not found to delete" });
                }

                // Commit the transaction
                await connection.commit((commitErr) => {
                    if (commitErr) {
                        closeConnection(connection);
                        return res.status(500).json({ message: "Transaction commit failed" });
                    }
                    res.status(200).json({ message: 'Data deleted successfully', deletedCount: rowsDeleted });
                });

            } catch (error) {
                console.error('Error occurred:', error);
                closeConnection(connection);
                return res.status(500).json({ message: error.message });
            }
        });

    } catch (error) {
        console.error('Error occurred:', error);
        if (error.sql) delete error.sql;
        res.status(500).json({ message: 'Internal server error', log: error });
    }
}
async function deleteFromTable(connection, tableName, whereClause, req) {
    return new Promise((resolve, reject) => {
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

        const query = `DELETE FROM ?? WHERE ${whereConditions}`;
        const values = [tableName, ...whereValues];

        connection.query(query, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                // Assuming you want to pass the number of affected rows back
                resolve(results.affectedRows);
            }
        });
    });
}

module.exports = { deleteController };
