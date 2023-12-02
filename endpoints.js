
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
            rules: [],
            columns: ["*"],
            excludeColumns: ["role"],
            allowedQueryParams: ["id", "name", "email"],
            limit: {
                value: 5,
                force: true,
            },
            rules: ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
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
            requiredColumns: ["name", "email",],
            rules: ["decodedToken.role == 'admin'"],
        },
        "/nestedInsert": {
            "method": "POST",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "defaultReferenceColumn": "user_id",
            "nestedTables": [
                {
                    "tableName": "user",
                    "columnsToInsert": ["name", "email"],
                    // Add other configurations if needed for the "user" table
                    "nestedTables": [
                        {
                            "tableName": "address",
                            "columnsToInsert": ["address_line", "city_id", "country"],
                            "referenceColumn": "user_id",
                            "nestedTables": [
                                {
                                    "tableName": "city",
                                    "columnsToInsert": ["city_name"],
                                    "referenceColumn": "address_id"
                                    // Add other configurations if needed for the "city" table
                                }
                                // Add more nested tables for "address" if required
                            ]
                        },
                        {
                            "tableName": "roles",
                            "columnsToInsert": ["role_name"],
                            "referenceColumn": "user_id",
                            // Add other configurations if needed for the "roles" table
                        }
                    ],
                },
                // Add more top-level tables if needed
            ]
        }
    },
}

module.exports = {
    endpoints,
}