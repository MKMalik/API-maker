export default {
  "GET": {
    "/users": {
      tableName: "user",
      columns: ["*"], // columns name
      excludeColumns: ["password", "fcm_token", "deleted_at"],
      where: { "user_role_id": 1, "deleted_at": null },
      allowedQueryParams: [], // allowed query parameters to pass
      rules: ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' "], // jwt token validation and verification, don't include this if jwt token is not required for the api
      "limit": {
        "value": 5,
        "force": false // if not forced, can be changed through query parameters `url/?limit=10&offset=0`
      },
      dbConnectionString: "root:root@localhost:3306/tabletop" // database URI
    },


    // another api endpoint with nested get 
    "/user": {
      "method": "GET",
      "tableName": "user",
      "where": {},
      "columns": ["*", "id", "name", "email"],
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

    // another GET api endpoints goes here...
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
    // Add more PATCH endpoints if needed
  },

  "DELETE": {
    "/user": {
      "method": "DELETE",
      "softDelete": true,
      "tableName": "user",
      "dbConnectionString": "root:root@localhost:3306/api_maker",
      "where": { "name": "req.body.name" },
      "rules": ["decodedToken.role == 'admin'"],
    },
    // Add more DELETE endpoints if needed
  },
}
