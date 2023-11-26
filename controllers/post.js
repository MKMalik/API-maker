const { endpoints } = require("../endpoints");
const url = require('url');
const { createConnection, closeConnection } = require("../utils/db.helpers");

async function postController(req, res, next) {
    try {
        console.log(req.url);

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const endpoint = endpoints["POST"][pathname];
        if (!endpoint || endpoint.method !== "POST") {
            return res.status(404).json({ message: "Endpoint not found" });
        }

        const dbConnectionString = endpoint.dbConnectionString;

        const connection = createConnection(dbConnectionString);

        const postData = req.body; // data to be inserted is sent in the request body

        const allowedColumns = endpoint.columnsToInsert;

        const insertData = {};
        allowedColumns.forEach(column => {
            if (postData.hasOwnProperty(column) && !endpoint.excludeColumns?.includes(column)) {
                insertData[column] = postData[column];
            }
        });

        const missingColumns = endpoint.requiredColumns?.filter(column => !insertData.hasOwnProperty(column));
        if (missingColumns?.length > 0) {
            return res.status(400).json({ message: `Missing required fields in body: ${missingColumns.join(', ')}` });
        }

        const insertQuery = `INSERT INTO ${endpoint.tableName} SET ?`;

        connection.query(insertQuery, insertData, function (error, results, fields) {
            if (error) {
                if (error.sql) delete error.sql;
                return res.status(500).json({ error, reason: error.sqlMessage ?? "Database insertion failed. Check data format or database credentials." });
            }
            console.log('Inserted data:', results);
            res.status(200).json({ message: 'Data inserted successfully', insertedData: insertData });
        });

        closeConnection(connection);
    } catch (error) {
        console.error('Error occurred:', error);
        if (error.sql) delete error.sql;
        res.status(500).json({ message: 'Internal server error', log: error });
    }
}

module.exports = { postController };