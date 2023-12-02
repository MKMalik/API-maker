const { endpoints } = require("../endpoints");
const url = require('url');
const { createConnection, closeConnection } = require("../utils/db.helpers");

async function postController(req, res, next) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const endpoint = endpoints["POST"][parsedUrl.pathname];

        const dbConnectionString = endpoint.dbConnectionString;
        const connection = createConnection(dbConnectionString);

        const dataToInsert = req.body;
        const defaultReferenceColumn = endpoint.defaultReferenceColumn;

        connection.beginTransaction(async (beginTransactionErr) => {
            if (beginTransactionErr) {
                closeConnection(connection);
                return res.status(500).json({ message: "Transaction begin failed" });
            }

            try {
                await performNestedInserts(connection, endpoint.nestedTables, dataToInsert, null, defaultReferenceColumn);

                await connection.commit((commitErr) => {
                    if (commitErr) {
                        closeConnection(connection);
                        return res.status(500).json({ message: "Transaction commit failed" });
                    }
                    res.status(200).json({ message: 'Data inserted successfully' });
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
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO ${tableName} SET ?`;

        connection.query(query, data, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = { postController };