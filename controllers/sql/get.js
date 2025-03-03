const {
  closeConnection,
  createConnection,
  fetchAllColumnsFromDatabase,
} = require("../../utils/db.helpers");
const {
  getRequiredColumns,
  parseNestedJSON,
  parseNestedJSONandRemoveNulls,
} = require("../../utils/helpers");
async function getController(req, res, next) {
  try {
    const endpoint = req.endpoint;

    const dbConnectionString = endpoint.dbConnectionString;
    try {
      var connection = await createConnection(dbConnectionString);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
    const allColumnsFromDB = await fetchAllColumnsFromDatabase(
      endpoint.tableName,
      connection,
    );
    const requiredColumns = getRequiredColumns(
      endpoint.columns ?? ["*"],
      endpoint?.excludeColumns ?? [],
      allColumnsFromDB,
      endpoint.tableName,
    );

    let sqlQuery = `SELECT ${requiredColumns.join(", ")} `;
    // let sqlQuery = ``;
    let countSqlQuery = `SELECT COUNT(*) FROM ${endpoint.tableName} `;

    // handle SELECT for includes tables
    sqlQuery += handleSelectForIncludes(endpoint.includes, "", true);

    sqlQuery += ` FROM ${endpoint.tableName} `;

    if (endpoint.includes && endpoint.includes.length > 0) {
      let includeJoins = handleIncludesJoin(endpoint.includes, sqlQuery);

      sqlQuery += includeJoins;

      countSqlQuery += includeJoins;
    }

    const queryParams = req.query;
    const allowedParams = Object.keys(queryParams).filter((param) =>
      endpoint.allowedQueryParams?.includes(param),
    );
    const filteredQuery = allowedParams.reduce((obj, key) => {
      obj[key] = queryParams[key];
      return obj;
    }, {});

    const whereConditions = [];
    let orderClause = "";

    allowedParams.forEach((param) => {
      if (param === "order_by") {
        // Handle 'order_by' query parameter for specifying the column name
        orderClause += `ORDER BY ${queryParams[param]}`;
      } else if (
        param === "order" &&
        ["ASC", "DESC"].includes(queryParams[param].toUpperCase())
      ) {
        // Handle 'order' query parameter for specifying the sorting order (ASC or DESC)
        orderClause += ` ${queryParams[param].toUpperCase()}`;
      } else {
        // Handle other allowed query parameters for WHERE clause
        whereConditions.push(`${param} = '${filteredQuery[param]}'`);
      }
    });

    // Extract 'order_by', 'order', 'search', and 'search_by' parameters
    const orderBy = queryParams["order_by"] || "";
    const order = queryParams["order"] || "";
    const search = queryParams["search"] || "";
    const searchBy = queryParams["search_by"] || "";
    const limit = calculateLimit(endpoint.limit, queryParams["limit"]);
    const offset = queryParams["offset"] || 0;

    if (
      limit !== undefined &&
      (isNaN(parseInt(limit)) || !Number.isInteger(parseInt(limit)))
    ) {
      await closeConnection(connection);
      return res.status(500).json({
        message: `Limit must be an integer. ${limit} is invalid integer`,
      });
    }

    if (
      offset !== undefined &&
      (isNaN(parseInt(offset)) || !Number.isInteger(parseInt(offset)))
    ) {
      await closeConnection(connection);
      return res.status(500).json({
        message: `Offset must be an integer. ${offset} is invalid integer`,
      });
    }

    // an array to hold all conditions
    const allConditions = [];

    // Implementing search functionality
    if (search && searchBy) {
      const searchColumns = searchBy
        .split(",")
        .map((searchParam) => searchParam.trim());
      const validSearchColumns = searchColumns.filter((col) =>
        allColumnsFromDB.includes(col),
      );

      if (validSearchColumns.length > 0) {
        const searchConditions = validSearchColumns.map((col) => {
          if (!isNaN(search)) {
            return `${col} = ${Number(search)}`;
          } else {
            return `${col} LIKE '%${search}%'`;
          }
        });

        // Push search conditions to the array
        if (searchConditions.length > 0) {
          allConditions.push(`(${searchConditions.join(" OR ")})`);
        }
      } else {
        await closeConnection(connection);
        return res.status(400).json({
          message: `Invalid or non-existing columns in 'search_by' parameter.`,
        });
      }
    }

    // Adding other conditions based on queryParams
    const otherConditions = allowedParams
      .filter(
        (param) =>
          param !== "order_by" &&
          param !== "order" &&
          param !== "search" &&
          param !== "search_by",
      )
      .map((param) => {
        if (!isNaN(filteredQuery[param])) {
          return `${param} = ${Number(filteredQuery[param])}`;
        } else {
          return `${param} = '${filteredQuery[param]}'`;
        }
      });

    // Push other conditions to the array
    if (otherConditions.length > 0) {
      allConditions.push(`(${otherConditions.join(" AND ")})`);
    }

    // Constructing the final WHERE clause
    if (allConditions.length > 0) {
      sqlQuery += ` WHERE ${allConditions.join(" AND ")}`;

      // for top level count query
      countSqlQuery += ` WHERE ${allConditions.join(" AND ")} `;
    }

    sqlQuery += ` GROUP BY ${endpoint.tableName}.id `;

    // Implementing sorting
    if (order && ["ASC", "DESC"].includes(order.toUpperCase())) {
      // If 'order' is provided and valid (ASC or DESC)
      orderClause += ` ${order.toUpperCase()}`;
    }

    if (!orderBy && order.toUpperCase() === "ASC") {
      // If 'order_by' is not provided and only 'order' is 'ASC', default 'order_by' to 'id'
      orderClause = `ORDER BY id ${order.toUpperCase()}`;
    } else if (!orderBy && order.toUpperCase() === "DESC") {
      // If 'order_by' is not provided and only 'order' is 'DESC', default 'order_by' to 'id' in descending order
      orderClause = `ORDER BY id DESC`;
    } else if (orderBy && ["ASC", "DESC"].includes(order.toUpperCase())) {
      // If both 'order_by' and 'order' are specified, construct the ORDER BY clause
      orderClause = `ORDER BY ${orderBy} ${order.toUpperCase()}`;
    }

    if (orderClause !== "") {
      sqlQuery += ` ${orderClause}`;
    }

    /// adding groupby to use JSON_ARRAYAGG
    // if (endpoint.includes) {
    //     sqlQuery += ' GROUP BY ';
    //     requiredColumns.map((col, index) => {
    //         sqlQuery += ` ${index !== 0 ? ', ' : ''} ${col} `;
    //     });
    // }

    if (limit) {
      // countSqlQuery += sqlQuery;
      // countSqlQuery = countSqlQuery.replace(`SELECT ${requiredColumns.join(', ')} FROM ${endpoint.tableName}`, '');

      sqlQuery += ` LIMIT ${limit} `;
    }
    if (offset) sqlQuery += `OFFSET ${offset} `;

    let rowsCount = undefined;
    try {
      rowsCount = await connection.query(countSqlQuery);
    } catch (error) {
      console.error(error);
      await closeConnection(connection);
      return res.status(500).json({ message: "DB Error", error });
    }

    try {
      const [results] = await connection.query(sqlQuery);
      let response = { data: results };
      if (limit) {
        response.limit = parseInt(limit);
        response.offset = parseInt(offset) ?? 0;
        response.total_count = rowsCount[0]["COUNT(*)"];
      }
      await closeConnection(connection);
      res.json(parseNestedJSON(response));
    } catch (error) {
      // if (error.sql) delete error.sql;
      // closeConnection(connection);
      await closeConnection(connection);
      return res
        .status(500)
        .json({ error, reason: error.sqlMessage ?? "Database query failed." });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection(connection);
  }
}

function handleSelectForIncludes(
  includes = [],
  includeSelectQuery = "",
  isFirstLevel,
) {
  // console.log("TCL: handleSelectForIncludes -> includes.tableName", includes.length)
  includes.map((include) => {
    if (!isFirstLevel) {
      includeSelectQuery += `, '${include.as ?? include.tableName}', `;
    } else includeSelectQuery += ", ";
    includeSelectQuery += ` (SELECT JSON_ARRAYAGG(`;
    includeSelectQuery += `JSON_OBJECT(`;
    getRequiredColumns(
      include.columns,
      include?.excludeColumns,
      [...include.columns, ...(include?.excludeColumns ?? [])],
      include.tableName,
      include.as,
    ).forEach((column, index) => {
      if (index !== 0) includeSelectQuery += ", ";
      includeSelectQuery += `'${column.split(".")[1]}', ${column} `;
    });

    if (include.includes) {
      includeSelectQuery += handleSelectForIncludes(
        include.includes,
        "",
        false,
      );
    }

    includeSelectQuery += `))  AS ${include.as ?? include.tableName} `;
    if (!isFirstLevel) {
      includeSelectQuery += `FROM ${include.tableName} ${include.as ? ` AS ${include.as}` : ""} WHERE ${include.relationship.parentColumn} = ${include.relationship.childColumn}
            GROUP BY ${include.relationship.childColumn} `;
    }
    includeSelectQuery += ") ";
    if (isFirstLevel)
      includeSelectQuery += ` AS ${include.as ?? include.tableName} `;
  });

  return includeSelectQuery;
}

function handleIncludesJoin(includes) {
  let includeQuery = "";

  includes.forEach((include) => {
    const alias = include.as;
    // Construct JOIN queries for each included table
    includeQuery += ` LEFT JOIN ${include.tableName} ${alias ? `AS ${alias}` : ""} ON ${include.relationship.parentColumn} = ${include.relationship.childColumn}`;
  });

  return includeQuery;
}

const calculateLimit = (endpointLimit, queryParamsLimit) => {
  // Check if the 'force' flag is set in the endpoint's limit configuration
  if (endpointLimit?.force) {
    // Return either the configured value or the value from query parameters
    return endpointLimit.value ?? queryParamsLimit;
  } else {
    // Return the value from query parameters or the default limit value from the endpoint
    return queryParamsLimit || endpointLimit?.value || undefined;
  }
};
module.exports = { getController };
