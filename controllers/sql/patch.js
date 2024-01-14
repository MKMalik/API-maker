const { endpoints } = require("../../endpoints");
const url = require('url');
const { createConnection, closeConnection } = require("../../utils/db.helpers");

async function patchController(req, res, next) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const endpoint = endpoints["PATCH"][parsedUrl.pathname];

        const dbConnectionString = endpoint.dbConnectionString;
        const connection = createConnection(dbConnectionString);

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

        connection.beginTransaction(async (beginTransactionErr) => {
            if (beginTransactionErr) {
                closeConnection(connection);
                return res.status(500).json({ message: "Transaction begin failed" });
            }

            try {
                const affectedRows = await updateTable(connection, endpoint.tableName, filteredDataToUpdate, whereClause, req);
                console.log("TCL: patchController -> affectedRows", affectedRows)

                await connection.commit((commitErr) => {
                    if (commitErr) {
                        closeConnection(connection);
                        return res.status(500).json({ message: "Transaction commit failed" });
                    }
                    if (affectedRows !== 0) res.status(200).json({ message: 'Data updated successfully' });
                    else res.status(404).json({ message: 'Data does not exists' });
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

async function updateTable(connection, tableName, data, whereClause, req) {
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

        const query = `UPDATE ?? SET ? WHERE ${whereConditions}`;
        const values = [tableName, data, ...whereValues];

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



module.exports = { patchController };
