require('dotenv').config();
const express = require('express');
const app = express();
const mysql = require('mysql');
const url = require('url');

app.use(express.json())

const endpoints = {
    "GET": {
        "/users": {
            method: "GET",
            tableName: "user",
            columns: ["*"],
            excludeColumns: ["password", "fcm_token", "deleted_at"],
            where: { "user_role_id": 1 },
            allowedQueryParams: [],
            dbConnectionString: "root:root@localhost:3306/tabletop"
        },
        "/user": {
            method: "GET",
            tableName: "user",
            where: {},
            columns: ["*"],
            excludeColumns: ["role"],
            allowedQueryParams: ["order", "order_by"],
            dbConnectionString: "root:root@localhost:3306/api_maker"
        },
    },
    "POST": {
        "/user": {
            method: "POST",
            tableName: "user",
            dbConnectionString: "root:root@localhost:3306/api_maker",
            columnsToInsert: ["name", "role", "email"],
            excludeColumns: ["id", "created_at", "updated_at", "deleted_at"],
            requiredColumns: ["name", "email",]
        },
    },
}

app.get('/', (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.get('/:endpoint', async (req, res) => {
    try {
        console.log(req.url);

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const endpoint = endpoints["GET"][pathname];
        if (!endpoint || endpoint.method !== "GET") {
            return res.status(404).json({ message: "Endpoint not found" });
        }


        const dbConnectionString = endpoint.dbConnectionString;
        const connectionParams = parseConnectionString(dbConnectionString);

        const connection = mysql.createConnection({
            host: connectionParams.host,
            user: connectionParams.user,
            password: connectionParams.password,
            port: connectionParams.port || 3306,
            database: connectionParams.database
        });

        connection.connect();

        const allColumnsFromDB = await fetchAllColumnsFromDatabase(endpoint.tableName, connection);

        const requiredColumns = getRequiredColumns(endpoint.columns ?? ["*"], endpoint?.excludeColumns ?? [], allColumnsFromDB);

        let sqlQuery = `SELECT ${requiredColumns.join(', ')} FROM ${endpoint.tableName}`;

        const queryParams = req.query;
        const allowedParams = Object.keys(queryParams).filter(param => endpoint.allowedQueryParams.includes(param));
        const filteredQuery = allowedParams.reduce((obj, key) => {
            obj[key] = queryParams[key];
            return obj;
        }, {});

        const whereConditions = [];
        let orderClause = '';

        allowedParams.forEach(param => {
            if (param === 'order_by') {
                // Handle 'order_by' query parameter for specifying the column name
                orderClause += `ORDER BY ${queryParams[param]}`;
            } else if (param === 'order' && ['ASC', 'DESC'].includes(queryParams[param].toUpperCase())) {
                // Handle 'order' query parameter for specifying the sorting order (ASC or DESC)
                orderClause += ` ${queryParams[param].toUpperCase()}`;
            } else {
                // Handle other allowed query parameters for WHERE clause
                whereConditions.push(`${param} = '${filteredQuery[param]}'`);
            }
        });

        // Extract 'order_by' and 'order' parameters
        const orderBy = queryParams['order_by'] || '';
        const order = queryParams['order'] || '';

        allowedParams.forEach(param => {
            if (param !== 'order_by' && param !== 'order') {
                // Handle other allowed query parameters for WHERE clause
                whereConditions.push(`${param} = '${filteredQuery[param]}'`);
            }
        });

        if (order && ['ASC', 'DESC'].includes(order.toUpperCase())) {
            // If 'order' is provided and valid (ASC or DESC)
            orderClause += ` ${order.toUpperCase()}`;
        }

        if (!orderBy && order.toUpperCase() === 'ASC') {
            // If 'order_by' is not provided and only 'order' is 'ASC', default 'order_by' to 'id'
            orderClause = `ORDER BY id ${order.toUpperCase()}`;
        } else if (!orderBy && order.toUpperCase() === 'DESC') {
            // If 'order_by' is not provided and only 'order' is 'DESC', default 'order_by' to 'id' in descending order
            orderClause = `ORDER BY id DESC`;
        } else if (orderBy && ['ASC', 'DESC'].includes(order.toUpperCase())) {
            // If both 'order_by' and 'order' are specified, construct the ORDER BY clause
            orderClause = `ORDER BY ${orderBy} ${order.toUpperCase()}`;
        }

        if (whereConditions.length > 0) {
            sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        console.log("TCL: whereConditions", whereConditions)

        if (orderClause !== '') {
            sqlQuery += ` ${orderClause}`;
        }

        connection.query(sqlQuery, function (error, results, fields) {
            if (error) {
                throw { error, reason: "Database query failed. Check database credentials." };
            }
            console.log('The solution is: ', results);
            res.json(results);
        });

        connection.end();
    } catch (error) {
        console.error('Error occurred:', error);
        if (error.sql) delete error.sql;
        res.status(500).json({ message: 'Internal server error', log: error });
    }
});

app.post('/:endpoint', async (req, res) => {
    try {
        console.log(req.url);

        const endpoint = endpoints["POST"][req.url];
        if (!endpoint || endpoint.method !== "POST") {
            return res.status(404).json({ message: "Endpoint not found or not allowed for POST requests" });
        }

        const dbConnectionString = endpoint.dbConnectionString;
        const connectionParams = parseConnectionString(dbConnectionString);

        const connection = mysql.createConnection({
            host: connectionParams.host,
            user: connectionParams.user,
            password: connectionParams.password,
            port: connectionParams.port || 3306,
            database: connectionParams.database
        });

        connection.connect();

        const postData = req.body; // Assuming the data to be inserted is sent in the request body
        console.log("TCL: postData", req.body)

        const allowedColumns = endpoint.columnsToInsert;

        const insertData = {};
        allowedColumns.forEach(column => {
            if (postData.hasOwnProperty(column) && !endpoint.excludeColumns?.includes(column)) {
                insertData[column] = postData[column];
            }
        });

        const missingColumns = endpoint.requiredColumns?.filter(column => !insertData.hasOwnProperty(column));
        if (missingColumns?.length > 0) {
            return res.status(400).json({ message: `Missing required columns: ${missingColumns.join(', ')}` });
        }

        const insertQuery = `INSERT INTO ${endpoint.tableName} SET ?`;

        connection.query(insertQuery, insertData, function (error, results, fields) {
            if (error) {
                throw { error, reason: "Database insertion failed. Check data format or database credentials." };
            }
            console.log('Inserted data:', results);
            res.status(200).json({ message: 'Data inserted successfully', insertedData: insertData });
        });

        connection.end();
    } catch (error) {
        console.error('Error occurred:', error);
        if (error.sql) delete error.sql;
        res.status(500).json({ message: 'Internal server error', log: error });
    }
});



app.listen(5500, () => {
    console.log("listening on port...");
});

function parseConnectionString(connectionString) {
    const [credentials, hostInfo] = connectionString.split('@');
    const [username, password] = credentials.split(':');
    const [hostWithPort, database] = hostInfo.split('/');
    const [host, port] = hostWithPort.split(':');

    return {
        host: host,
        user: username,
        password: password || '', // Set password to an empty string if not provided
        port: port || '', // Set port to an empty string if not provided
        database: database
    };
}


// Function to fetch all columns from the database
// Function to fetch all columns from the database
function fetchAllColumnsFromDatabase(tableName, connection) {
    return new Promise((resolve, reject) => {
        // Query to fetch column names
        const query = `SHOW COLUMNS FROM ${tableName}`;

        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                // Extract column names from query results
                const columns = results.map(result => result.Field);
                resolve(columns);
            }
        });
    });
}
// Function to filter out excluded columns from the fetched columns
function getRequiredColumns(columns, excludeColumns = [], allColumns) {
    let requiredColumns = [];

    if (columns.includes("*")) {
        requiredColumns = allColumns?.filter(col => !excludeColumns?.includes(col));
    } else {
        requiredColumns = columns.filter(col => !excludeColumns?.includes(col));
    }

    console.log("TCL: getRequiredColumns -> requiredColumns", requiredColumns)
    return requiredColumns;
}