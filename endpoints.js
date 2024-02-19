const endpoints = {
  GET: {
    "/users": {
      method: "GET",
      tableName: "user",
      columns: ["*"],
      excludeColumns: ["password", "fcm_token", "deleted_at"],
      where: { user_role_id: 1 },
      allowedQueryParams: [],
      rules: [
        "decodedToken.userId == req.query.userId",
        "decodedToken.roleId == 'admin' || true",
      ],
      dbConnectionString: "root:root@localhost:3306/tabletop",
    },

    "/users-mongo": {
      method: "GET",
      tableName: "sample_blog",
      columns: ["_id", "title", "slug"],
      where: { _id: "65724ee1d9d2ffd66bd5aaf7" },
      allowedQueryParams: [],
      // rules: ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
      dbConnectionString: "mongodb://localhost:27017/sample_blog",
    },

    "/user": {
      method: "GET",
      tableName: "user",
      where: {},
      columns: ["*", "id", "name", "email"],
      excludeColumns: ["role"],
      allowedQueryParams: ["id", "name", "email"], // TODO: make it mappable i.e., {"id": "user.id", "cityId": 'city.id',}
      limit: {
        value: 5,
        force: false,
      },
      includes: [
        {
          tableName: "address",
          where: {},
          columns: ["id", "address_line"],
          // "excludeColumns": ["address_line"],
          relationship: {
            parentColumn: "user.id",
            childColumn: "address.user_id",
          },
          includes: [
            {
              tableName: "city",
              where: {},
              columns: ["id", "city_name", "address_id"],
              excludeColumns: ["deletedAt"],
              relationship: {
                parentColumn: "address.id",
                childColumn: "city.address_id",
              },
            },
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
          limit: {
            value: 50,
            force: false,
          },
        },
      ],
      // rules: [
      //   "decodedToken.userId == req.query.userId",
      //   "decodedToken.roleId == 'admin' || true",
      // ],
      dbConnectionString: "root:root@localhost:3306/api_maker",
      jwtSecret: "THisISSuperSecretKeyTableTop)*&2327",
    },
  },
  POST: {
    "/user": {
      method: "POST",
      tableName: "user",
      dbConnectionString: "root:root@localhost:3306/api_maker",
      columnsToInsert: ["name", "role", "email"],
      excludeColumns: ["id", "created_at", "updated_at", "deleted_at"],
      requiredColumns: ["name", "email"],
      rules: ["decodedToken.role == 'admin'"],
    },
    "/nestedInsert": {
      method: "POST",
      dbConnectionString: "root:root@localhost:3306/api_maker",
      rules: ["decodedToken.id !== null"],
      jwtSecret: "THisISSuperSecretKeyTableTop)*&2327", // encrypted
      defaultReferenceColumn: "user_id",
      nestedTables: [
        {
          tableName: "user",
          columnsToInsert: ["name", "email", "role"],
          // Add other configurations if needed for the "user" table
          nestedTables: [
            {
              tableName: "address",
              columnsToInsert: ["address_line", "city_id", "country"],
              referenceColumn: "user_id",
              nestedTables: [
                {
                  tableName: "city",
                  columnsToInsert: ["city_name"],
                  referenceColumn: "address_id",
                  // Add other configurations if needed for the "city" table
                },
                // Add more nested tables for "address" if required
              ],
            },
            {
              tableName: "roles",
              columnsToInsert: ["role_name"],
              referenceColumn: "user_id",
              // Add other configurations if needed for the "roles" table
            },
          ],
        },
        // Add more top-level tables if needed
      ],
    },
  },

  PATCH: {
    "/user": {
      method: "PATCH",
      tableName: "user",
      dbConnectionString: "root:root@localhost:3306/api_maker",
      columnsToUpdate: ["name", "email"],
      excludeColumns: ["id", "created_at", "updated_at", "deleted_at"],
      where: { id: "req.body.userId" },
      rules: ["decodedToken.role == 'admin'"],
      jwtSecret: "THisISSuperSecretKeyTableTop)*&2327", // encrypted
    },
    // Add more PATCH endpoints if needed
  },

  DELETE: {
    "/user": {
      method: "DELETE",
      softDelete: true,
      tableName: "user",
      dbConnectionString: "root:root@localhost:3306/api_maker",
      where: { name: "req.body.name" },
      rules: ["decodedToken.role == 'admin'"],
    },
    // Add more DELETE endpoints if needed
  },

  NOTIFICATION: {
    "/send-notification-endpoint": {
      method: "POST",
      tableName: "user",
      fcm_col_name: "fcm_token",
      // "where": { "name": "req.query.id" },
      where: { id: "notificationObject.userId" },
      dbConnectionString: "root:root@localhost:3306/api_maker",
      private_cert: {
        type: "service_account",
        project_id: "tabletop-kitchen-app",
        private_key_id: "6763a75725a6f4ec2a62db97295cb9228cae647f",
        private_key:
          "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCnsgJ2CLfQM+Oj\nDxS/iLbMx9ncXMDzuKq05Hmt/I9yyFZQsnx6LA+TbRo5rBG6/ndeD1/oB8+x2LBS\ngwkabINdA9jQxl06p/dogT2Ma/y2h8o4h5LOKnZa/sSF4s1/R28bJvyz5ERqPs8m\nVALjld//QvNRBHm+efaXXTUozOq2CQuH8MI0I2KPVVXyJfmjW7vxOui5PRoyZOeI\notTx7TQcOzL/1kTIVX0GYbJD3xsMzL2D1+C6y9PUNnC8V4OlJ8tFzUi+0/DjaosD\n7mlpYooMsLiDy9yJ4rWHwpJbVcUJZrhQmg9Wnd39xcP/5LyJLK8zS8Eopyut7jva\nUguIgcLBAgMBAAECggEAGZEYcnX0TlQm69SQCX6WviRnGQN0MIRSVGd0DLxxg2K7\nVCzOMRM4IbYz1iCfiGak/Mxzxwyv0/HROhc7w1FRetQsEXJ4wslafU6c+2R4YDzW\nLiWvUmrjZg6rGC2Cvpm9vQJF60hNTPR8ASA0W43dW43RymOYCxwNpjih8vFBBJUf\nhjGqrrk094PylYgEwLmk5lopJG01qh3jOOxNXsjdL6YsvsBsyLRdOFuBLm87AQvH\nzanv/e9XzVloRkZLLYfLeLEy59Lw9EX6ocUHtWJ7HejXRXLtYAEkE5Rdr1G5sY+J\nuV/sT9z2OKDys+R15w6UqdKGGQn0Nsgy2q6ztw2JlQKBgQDiQlrBuCf+Lndb8LRZ\nikuznrzkNyJdSXj0S8BJMD3190+qKimbyAKFmQuPowtQqUH5+BLVYtj8mUvk1MsL\nyjnGtlXR0YuF2+ZONB5j3fjG0mq0XOfBqe+oq2TYveTjaumU0dsnx1g/qk4NaWcH\n3a/W8ARUpu4DXWxL0WmK3JCslQKBgQC9vPm94o16nKFuaM9IVtnDhEqy2FLIJi/Y\nCHUCD1lZQESNLEUApdogWEODnLlJfp9pdQMQDF0zaPpGU1xXEIyRWVGEY+S5u2Q2\nq0xeNW4eP+ETvcm9KtBgWRkCQKmmqfeyS/eeWKjuI9Vmt9HokKZj5OLMg5ERFTdR\nqSkb5AoGfQKBgAVjoTfGBCXYw30MIa+UTLNNj6A78/SW4GupNj5ICOHH7zzVXkJY\npD68Y3sbXhSgw3KJxyEQBq0Vlaowq1lviqrCAw9JV3Jrx3OLaEHmsptBvcrn/5ks\nTAoPcwp6k24bSM8DpJ2w8NgrXUqSfSLB1ANhmijOBRNNcVvo9AObt1J1AoGBALbh\n7JLTSO0zBgLG8WzXkeR7ogiKrBgRfrIrTKTkqIl3gdvVHNmIAxyEFudH6+xkKUFb\nsM0KLdd8yyd3+BxPbj43KnSCWJeRgQGU0PJJa8+qYMdHeqlkGB+WIZ3jN+LWF1L7\nGDy/VmzbizkL2z7gFhFZMCZSdkRR/9UtSNuCTQt9AoGBAMENJgOJ5aq4DuEmCPvo\nfds6aqkWQcB0WaymZnes09c6PQ4YkOnn3g4bECWG84rgqC0NtdXgRstYhX32PRfp\nhqeWzc1tldnpPPFXJcjNkqNqmoV1nV3TavD4Vci4ZhoOmAml7AAT+qCEhMEf7Pkh\nA8oT8/Qm9AFh3lW5ehyMBSm8\n-----END PRIVATE KEY-----\n",
        client_email:
          "firebase-adminsdk-8rser@tabletop-kitchen-app.iam.gserviceaccount.com",
        client_id: "101852908389617650550",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:
          "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-8rser%40tabletop-kitchen-app.iam.gserviceaccount.com",
        universe_domain: "googleapis.com",
      },
    },
  },
};

module.exports = {
  endpoints,
};
