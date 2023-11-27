
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
            allowedQueryParams: ["id", "name", "email"],
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

module.exports = {
    endpoints,
}