
module.exports = {
  "GET": {
    "/get-user": {
      tableName: "user",
      dbConnectionString: "root:password@localhost:3306/api_maker",
      columns: ["*"],
      where: {
        "id": 11
      },
      rules: ["decodedToken.user_email === req.body.email"],
      jwtSecret: "THisISSuperSecretKeyTableTop)*&2327"

    },
    "/adarsh": {
      tableName: "restaurant",
      columns: ["*"],
      dbConnectionString: "root:password@localhost:3306/tabletop",
    },
    "/bind": {
      // method: "GET",
      tableName: "user",
      columns: ["*"],
      excludeColumns: ["password", "fcm_token", "deleted_at"],
      // where: { "user_role_id": 1 },
      allowedQueryParams: [],
      // rules: ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
      dbConnectionString: "root:password@localhost:3306/tabletop",
      includes: [
        {
          "tableName": "restaurant",
          "where": {},
          "columns": [
            "id",
            "name",
            "is_active",
          ],
          "excludeColumns": ["deletedAt"],
          "relationship": {
            "parentColumn": "user.restaurant_id",
            "childColumn": "restaurant.id"
          },

        },
      ],
    },
  },
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
    "columns": ["*", "id", "name", "email"],
    "excludeColumns": ["role"],
    "allowedQueryParams": ["id", "name", "email"], // TODO: make it mappable i.e., {"id": "user.id", "cityId": 'city.id',}
    "limit": {
      "value": 5,
      "force": false
    },
    "includes": [
      {
        "tableName": "address",
        "where": {},
        "columns": [
          "id",
          "address_line"
        ],
        // "excludeColumns": ["address_line"],
        "relationship": {
          "parentColumn": "user.id",
          "childColumn": "address.user_id"
        },
        "includes": [
          {
            "tableName": "city",
            "where": {},
            "columns": [
              "id",
              "city_name",
              "address_id"
            ],
            "excludeColumns": ["deletedAt"],
            "relationship": {
              "parentColumn": "address.id",
              "childColumn": "city.address_id"
            },

          },
          {
            "tableName": "order_details",
            "where": {},
            "columns": ["*"],
            "excludeColumns": ["deletedAt"],
            "relationship": {
              "parentColumn": "order_id",     // Specify the column in the "order" table that links to "order_details"
              "childColumn": "order_id"      // Specify the column in the "order_details" table linked to "order"
            },
            "limit": {
              "value": 5,
              "force": false
            }
          },
          {
            "tableName": "address",
            "where": {},
            "columns": ["id", "name", "street", "city", "state", "zip", "country"],
            "excludeColumns": ["deletedAt", "createdAt", "updatedAt"],
            "relationship": {
              "parentColumn": "user_id",    // Specify the column in the "user" table that links to "address"
              "childColumn": "user_id"      // Specify the column in the "address" table linked to the "user"
            },
            "limit": {
              "value": 5,
              "force": false
            }
          }
        ],
        "limit": {
          "value": 50,
          "force": false
        }
      }
    ],
    "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
    "dbConnectionString": "root:root@localhost:3306/api_maker",
    "jwtSecret": "THisISSuperSecretKeyTableTop)*&2327"
  },

  "POST": {

    "/insterUserAddress": {
      dbConnectionString: "root:password@localhost:3306/adarsh",
      // defaultReferenceColumn: "user_id",
      nestedTables: [
        {
          tableName: "user",
          columnsToInsert: ["name"],
          nestedTables: [
            {
              tableName: "address",
              referenceColumn: "user_id",
              columnsToInsert: ["country"],
            }
          ]
        }
      ]
    },

    "/user": {
      tableName: "user",
      dbConnectionString: "root:password@localhost:3306/api_maker",
      nestedTables: [
        {
          tableName: "user",
          columnsToInsert: ["name", "email", "hash(password)"],
          excludeColumns: ["id", "created_at", "updated_at", "deleted_at"],
          requiredColumns: ["name", "email",],
        }
      ],
      // rules: ["decodedToken.role == 'admin'"],
    },
    "/userAddr": {
      dbConnectionString: "root:password@localhost:3306/api_maker",
      defaultReferenceColumn: "user_id",
      jwtSecret: "THisISSuperSecretKeyTableTop)*&2327",
      jwt: ["user.id", "user.email", "address.street"],
      nestedTables: [
        {
          tableName: "user",
          columnsToInsert: ["name", "email", "hash(password)"],
          // requiredColumns: ["name", "email", "password"],
          nestedTables: [
            {
              tableName: "address",
              columnsToInsert: ["street"],
              referenceColumn: "user_id",
            }
          ],
        }
      ],
    },
    "/login/user": {
      dbConnectionString: "root:password@localhost:3306/api_maker",
      jwtSecret: "THisISSuperSecretKeyTableTop)*&2327",
      jwt: ["user.id", "user.email", "address.street"],
      jwtExpiry: 3600 * 2, // seconds
      matches: [
        {
          tableName: 'user',
          parameters: [
            { column: "email", ref: "req.body.email" },
            { column: "password", ref: "req.body.password", fn: "hash" },
          ],
        },
        {
          tableName: "address",
          parameters: [
            { column: "user_id", ref: "12", fn: "equal" }],
        }
      ],
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

  "PATCH": {
    "/user": {
      "method": "PATCH",
      "tableName": "user",
      "dbConnectionString": "root:root@localhost:3306/api_maker",
      "columnsToUpdate": ["name", "email"],
      "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
      "where": { "id": "req.body.userId" },
      "rules": ["decodedToken.role == 'admin'"],
      "jwtSecret": "THisISSuperSecretKeyTableTop)*&2327", // encrypted
    },
    "/modifyName": {
      tableName: "user",
      dbConnectionString: "root:password@localhost:3306/adarsh",
      columnsToUpdate: ["name"],
      where: {
        "id": "req.query.id",
      },
    }
    // Add more PATCH endpoints if needed
  },

  "DELETE": {
    "/user": {
      "softDelete": false,
      "tableName": "user",
      "dbConnectionString": "root:root@localhost:3306/api_maker",
      "where": { "name": "req.body.name" },
      "rules": ["decodedToken.role == 'admin'"],
    },
    "/deleteUser": {
      softDelete: false,
      tableName: "user",
      dbConnectionString: "root:password@localhost:3306/adarsh",
      where: {
        id: "req.query.id",
      }
    }
    // Add more DELETE endpoints if needed
  },

  "NOTIFICATION": {
    "/send-notification-endpoint": {
      "method": "POST",
      "server_key": "",

      "tableName": "user",
      "fcm_col_name": "fcm_token",
      // "where": { "name": "req.query.id" },
      "where": { "id": "notificationObject.userId" },
      "dbConnectionString": "root:root@localhost:3306/api_maker",
    },
  }

}

