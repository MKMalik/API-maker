const { endpoints } = require("../endpoints");
const { closeConnection, createConnection, fetchAllColumnsFromDatabase } = require("../utils/db.helpers");
const { getRequiredColumns } = require("../utils/helpers");
const url = require('url');

async function getController(req, res, next) {
    try {
        console.log(req.url);

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const endpoint = endpoints["GET"][pathname];
        if (!endpoint || endpoint.method !== "GET") {
            return res.status(404).json({ message: "Endpoint not found" });
        }


        const dbConnectionString = endpoint.dbConnectionString;
        const connection = createConnection(dbConnectionString);

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

        // Extract 'order_by', 'order', 'search', and 'search_by' parameters
        const orderBy = queryParams['order_by'] || '';
        const order = queryParams['order'] || '';
        const search = queryParams['search'] || '';
        const searchBy = queryParams['search_by'] || '';

        allowedParams.forEach(param => {
            if (param !== 'order_by' && param !== 'order' && param !== 'search' && param !== 'search_by') {
                // Handle other allowed query parameters for WHERE clause
                if (!isNaN(filteredQuery[param])) {
                    // If the parameter value is a number, cast it to a number in the WHERE clause
                    whereConditions.push(`${param} = ${Number(filteredQuery[param])}`);
                } else {
                    // If the parameter value is not a number, treat it as a string in the WHERE clause
                    whereConditions.push(`${param} = '${filteredQuery[param]}'`);
                }
            }
        });

        // Implementing search functionality
        if (search && searchBy) {
            if (allColumnsFromDB.includes(searchBy)) {
                // If the 'search_by' field exists in the available columns
                if (!isNaN(search)) {
                    // If the search value is a number, use equality comparison
                    whereConditions.push(`${searchBy} = ${Number(search)}`);
                } else {
                    // If the search value is a string, use a partial match comparison
                    whereConditions.push(`${searchBy} LIKE '%${search}%'`);
                }
            } else {
                // Handle cases where 'search_by' field does not exist in the available columns
                console.error(`Column ${searchBy} does not exist in the database.`);
            }
        }

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
                if (error.sql) delete error.sql;
                return res.status(500).json({ error, reason: error.sqlMessage ?? "Database query failed." });
            }
            console.log('The solution is: ', results);
            res.json(results);
        });

        closeConnection(connection);
    } catch (error) {
        console.error('Error occurred:', error);
        // if (error.sql) delete error.sql;
        res.status(500).json({ message: 'Internal server error', log: error });
    }
};

module.exports = { getController };
