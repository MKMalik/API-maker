const { createConnection, closeConnection } = require('../utils/db.helpers');

// Controller function to create a table based on the schema provided in the request body
async function createTableController(req, res, next) {
    try {
        const { table_name, schema, indexes, database_connection } = req.body;

        // Establish a connection to the database using the provided connection string
        const connection = createConnection(database_connection);

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

            closeConnection(connection);
            console.log(`\n\n\nQuery: ${query}\n\n\n`);

            return res.status(201).json({ message: `Table '${table_name}' created successfully` });
        });

    } catch (error) {
        console.error('Error occurred:', error);
        closeConnection(connection);
        return res.status(500).json({ message: 'Failed to create table', log: error });
    }
};

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

module.exports = { createTableController };