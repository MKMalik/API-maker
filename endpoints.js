
const endpoints = {
    "GET": {
        "/users": {
            method: "GET",
            tableName: "user",
            columns: ["*"],
            excludeColumns: ["password", "fcm_token", "deleted_at"],
            where: { "user_role_id": 1 },
            allowedQueryParams: [],
            rules: ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            dbConnectionString: "root:root@localhost:3306/tabletop"
        },

        "/users-mongo": {
            method: "GET",
            tableName: "sample_blog",
            columns: ["_id", "title", "slug",],
            where: { "_id": '65724ee1d9d2ffd66bd5aaf7' },
            allowedQueryParams: [],
            // rules: ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            dbConnectionString: "mongodb://localhost:27017/sample_blog"
        },

        "/user": {
            "method": "GET",
            "tableName": "user",
            "where": {},
            "columns": ["user.name", "user.email",],
            "excludeColumns": ["role"],
            "allowedQueryParams": ["id", "name", "email"],
            "limit": {
                "value": 5,
                "force": false
            },
            "includes": [
                {
                    "tableName": "address",
                    "where": {},
                    "columns": [
                        "address.id",
                        "address.address_line"
                    ],
                    "excludeColumns": ["deletedAt"],
                    "relationship": {
                        "parentColumn": "user.id",
                        "childColumn": "address.user_id"
                    },
                    "includes": [
                        {
                            "tableName": "city",
                            "where": {},
                            "columns": ["city.id", "city.city_name", "city.address_id"],
                            "excludeColumns": ["deletedAt"],
                            "relationship": {
                                "parentColumn": "address.id",
                                "childColumn": "city.address_id"
                            },
                            
                        }
                        // {
                        //     "tableName": "order_details",
                        //     "where": {},
                        //     "columns": ["*"],
                        //     "excludeColumns": ["deletedAt"],
                        //     "relationship": {
                        //         "parentColumn": "order_id",     // Specify the column in the "order" table that links to "order_details"
                        //         "childColumn": "order_id"      // Specify the column in the "order_details" table linked to "order"
                        //     },
                        //     "limit": {
                        //         "value": 5,
                        //         "force": false
                        //     }
                        // },
                        // {
                        //     "tableName": "address",
                        //     "where": {},
                        //     "columns": ["id", "name", "street", "city", "state", "zip", "country"],
                        //     "excludeColumns": ["deletedAt", "createdAt", "updatedAt"],
                        //     "relationship": {
                        //         "parentColumn": "user_id",    // Specify the column in the "user" table that links to "address"
                        //         "childColumn": "user_id"      // Specify the column in the "address" table linked to the "user"
                        //     },
                        //     "limit": {
                        //         "value": 5,
                        //         "force": false
                        //     }
                        // }
                    ],
                    "limit": {
                        "value": 50,
                        "force": false
                    }
                }
            ],
            // "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "jwtSecret": "THisISSuperSecretKeyTableTop)*&2327"
        }

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
            "rules": ["decodedToken.id !== null"],
            "jwtSecret": "THisISSuperSecretKeyTableTop)*&2327", // encrypted
            "defaultReferenceColumn": "user_id",
            "nestedTables": [
                {
                    "tableName": "user",
                    "columnsToInsert": ["name", "email", "role"],
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