const { createConnection, closeConnection } = require('../utils/db.helpers');

// Controller function to create a table based on the schema provided in the request body
async function createTableController(req, res, next) {
  try {
    const { table_name, schema, indexes, database_connection } = req.body;

    // Establish a connection to the database using the provided connection string
    const connection = await createConnection(database_connection);

    // SQL query to create the table
    let query = `CREATE TABLE ${table_name} (`;

    // Iterate through the schema fields to construct the table structure
    Object.entries(schema).forEach(([columnName, columnDetails]) => {
      let columnDefinition = `${columnName} ${getColumnDefinition(columnDetails)}`;
      query += `${columnDefinition}, `;
    });

    // // Add primary key constraints if defined in the schema
    // const primaryKey = Object.entries(schema).find(([, columnDetails]) => columnDetails.primary_key);
    // if (primaryKey) {
    //     query += `PRIMARY KEY (${primaryKey[0]}), `;
    // }

    // Remove trailing comma and add closing parenthesis for the query
    query = query.replace(/,\s*$/, '') + ')';

    // Execute the query to create the table
    connection.query(query, async (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating table', log: error });
      }

      // Create indexes if defined in the schema
      if (indexes && indexes.length > 0) {
        await createIndexes(connection, table_name, indexes);
      }

      await closeConnection(connection);
      // console.log(`\n\n\nQuery: ${query}\n\n\n`);

      return res.status(201).json({ message: `Table '${table_name}' created successfully` });
    });

  } catch (error) {
    console.error('Error occurred:', error);
    await closeConnection(connection);
    return res.status(500).json({ message: 'Failed to create table', log: error });
  }
};

async function updateTableController(req, res, next) {
  const { table_name, updated_schema, database_connection } = req.body;
  const connection = createConnection(database_connection);

  try {
    await beginTransaction(connection);

    const queries = constructAlterTableQuery(updated_schema, table_name);
    console.log("TCL: updateTableController -> queries", queries)

    for (const query of queries) {
      await executeQuery(connection, query);
    }

    await commitTransaction(connection);
    await closeConnection(connection);

    return res.status(200).json({ message: `Table '${table_name}' updated successfully` });
  } catch (error) {
    console.error('Error occurred:', error);

    try {
      await rollbackTransaction(connection);
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    await closeConnection(connection);
    return res.status(500).json({ message: 'Failed to update table', log: error });
  }
}

async function beginTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function executeQuery(connection, query) {
  return new Promise((resolve, reject) => {
    connection.query(query, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function commitTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.commit((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function rollbackTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.rollback(() => {
      resolve();
    });
  });
}


// Helper function to construct column definitions for the SQL query
const getColumnDefinition = (columnDetails) => {
  let columnDefinition = '';

  switch (columnDetails.type.toLowerCase()) {
    case 'string':
      columnDefinition = `VARCHAR(${columnDetails.length})`;
      break;
    case 'long_string':
      columnDefinition = 'TEXT';
      break;
    case 'decimal':
      columnDefinition = `DECIMAL(${columnDetails.precision},${columnDetails.scale})`;
      break;
    // Add cases for other types as needed
    default:
      columnDefinition = columnDetails.type.toUpperCase();
      break;
  }

  // Add constraints like NOT NULL, AUTO_INCREMENT, UNIQUE, etc.
  if (columnDetails.primary_key) {
    // For primary key, ensure NOT NULL and AUTO_INCREMENT constraints
    columnDefinition += ' NOT NULL AUTO_INCREMENT PRIMARY KEY';
  } else {
    // For other columns
    columnDefinition += columnDetails.required ? ' NOT NULL' : ' NULL';
    if (columnDetails.unique) {
      columnDefinition += ' UNIQUE';
    }
    // Add other constraints as needed
  }

  return columnDefinition;
};


// Helper function to create indexes based on the schema
const createIndexes = async (connection, tableName, indexes) => {
  for (const index of indexes) {
    const { columns, type } = index;
    let query = '';

    if (type === 'unique') {
      query = `CREATE UNIQUE INDEX ${tableName}_${columns.join('_')} ON ${tableName} (${columns.join(', ')})`;
    } else if (type === 'index') {
      query = `CREATE INDEX ${tableName}_${columns.join('_')} ON ${tableName} (${columns.join(', ')})`;
    } // Add other types of indexes if needed

    if (query) {
      await new Promise((resolve, reject) => {
        connection.query(query, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

/**
 * Constructs an ALTER TABLE query based on the updated_schema object.
 * @param {object} updatedSchema - Object containing information about added columns, updated columns, dropped columns, primary key changes, and index changes.
 * @returns {string[]} The constructed ALTER TABLE queries.
 */
const constructAlterTableQuery = (updatedSchema, tableName) => {
  const alterQueries = [];

  // Add new columns
  const addedColumns = updatedSchema.added_columns;
  if (addedColumns) {
    Object.entries(addedColumns).forEach(([columnName, columnDetails]) => {
      alterQueries.push(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${getColumnDefinition(columnDetails)}`);
    });
  }

  // Modify existing columns
  const updatedColumns = updatedSchema.updated_columns;
  if (updatedColumns) {
    Object.entries(updatedColumns).forEach(([columnName, columnDetails]) => {
      alterQueries.push(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${getColumnDefinition(columnDetails)}`);
    });
  }

  // Drop columns
  const droppedColumns = updatedSchema.dropped_columns;
  if (droppedColumns) {
    droppedColumns.forEach((columnName) => {
      alterQueries.push(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
    });
  }

  // Primary key changes
  // TODO: need to handle primary migration (removing auto_increment if exists, making it unique)
  // if (updatedSchema.primary_key) {
  //     const { old: oldPrimaryKey, new: newPrimaryKey, type, auto_increment } = updatedSchema.primary_key;
  //     if (oldPrimaryKey && newPrimaryKey && type) {
  //         alterQueries.push(`ALTER TABLE ${tableName} DROP PRIMARY KEY`);
  //         alterQueries.push(`ALTER TABLE ${tableName} ADD PRIMARY KEY (${newPrimaryKey})`);
  //     }
  // }

  // Index changes
  const { removed_columns: removedIndexes, added_columns: addedIndexes } = updatedSchema?.indexes ?? {};
  if (removedIndexes) {
    removedIndexes.forEach((columnName) => {
      alterQueries.push(`DROP INDEX ${columnName} ON ${tableName}`);
    });
  }
  if (addedIndexes) {
    addedIndexes.forEach((columnName) => {
      alterQueries.push(`CREATE INDEX ${columnName} ON ${tableName} (${columnName})`);
    });
  }

  return alterQueries;
};




module.exports = { createTableController, updateTableController };
