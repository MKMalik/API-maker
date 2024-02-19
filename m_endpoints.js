const endpoints =
{
    "POST": {
        "/register-user": {
            "method": "POST",
            "tableName": "user",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["name", "role", "email", "password"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["name", "email", "password"],
            "rules": []
        },
        "/login-user": {
            "method": "POST",
            "tableName": "user",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columns": ["*"],
            "excludeColumns": ["password", "fcm_token", "deleted_at"],
            "where": { "email": "req.body.email", "password": "req.body.password" },
            "rules": []
        },
        "/create-admin": {
            "method": "POST",
            "tableName": "admin",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["name", "email", "password"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["name", "email", "password"],
            "rules": []
        },
        "/create-role": {
            "method": "POST",
            "tableName": "role",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["role_name"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["role_name"],
            "rules": []
        },
        "/create-section": {
            "method": "POST",
            "tableName": "section",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["section_name"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["section_name"],
            "rules": []
        },
        "/create-content": {
            "method": "POST",
            "tableName": "content",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["title", "body", "section_id", "user_id"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["title", "body", "section_id", "user_id"],
            "rules": []
        },
        "/create-moderator": {
            "method": "POST",
            "tableName": "moderator",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["user_id", "admin_id"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["user_id", "admin_id"],
            "rules": []
        },
        "/issue-incentive": {
            "method": "POST",
            "tableName": "incentive",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["moderator_id", "amount", "incentive_for_content_id"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["moderator_id", "amount", "incentive_for_content_id"],
            "rules": []
        },
        "/post-comment": {
            "method": "POST",
            "tableName": "comment",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["content_id", "user_id", "comment_text"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["content_id", "user_id", "comment_text"],
            "rules": []
        },
        "/post-notification": {
            "method": "POST",
            "tableName": "notification",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["user_id", "content_id"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["user_id", "content_id"],
            "rules": []
        },
        "/create-tag": {
            "method": "POST",
            "tableName": "tag",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["tag_name"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["tag_name"],
            "rules": []
        },
        "/associate-tag-with-content": {
            "method": "POST",
            "tableName": "content_tag",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["content_id", "tag_name"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["content_id", "tag_name"],
            "rules": []
        },
        "/log-content-view": {
            "method": "POST",
            "tableName": "content_view",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["content_id", "user_id"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["content_id", "user_id"],
            "rules": []
        },
        "/log-content-like": {
            "method": "POST",
            "tableName": "content_like",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["content_id", "user_id"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["content_id", "user_id"],
            "rules": []
        },
        "/create-permission": {
            "method": "POST",
            "tableName": "permission",
            "dbConnectionString": "root:root@localhost:3306/api_maker",
            "columnsToInsert": ["permission_name"],
            "excludeColumns": ["id", "created_at", "updated_at", "deleted_at"],
            "requiredColumns": ["permission_name"],
            "rules": []
        },
        "/generate-auth-token": {
            "method": "POST",
            "customLogic": " // Add custom logic to generate authentication tokens",
            "rules": []
        },
        // ... (Implement other POST APIs)
    },
    "GET": {
        "/retrieve-users": {
            "method": "GET",
            "tableName": "user",
            "columns": ["*"],
            "excludeColumns": ["password", "fcm_token", "deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-admins": {
            "method": "GET",
            "tableName": "admin",
            "columns": ["*"],
            "excludeColumns": ["password", "fcm_token", "deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-roles": {
            "method": "GET",
            "tableName": "role",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-sections": {
            "method": "GET",
            "tableName": "section",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-contents": {
            "method": "GET",
            "tableName": "content",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-moderators": {
            "method": "GET",
            "tableName": "moderator",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-incentives": {
            "method": "GET",
            "tableName": "incentive",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-comments": {
            "method": "GET",
            "tableName": "comment",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-notifications": {
            "method": "GET",
            "tableName": "notification",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-tags": {
            "method": "GET",
            "tableName": "tag",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-content-tags": {
            "method": "GET",
            "tableName": "content_tag",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-content-views": {
            "method": "GET",
            "tableName": "content_view",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-content-likes": {
            "method": "GET",
            "tableName": "content_like",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/retrieve-permissions": {
            "method": "GET",
            "tableName": "permission",
            "columns": ["*"],
            "excludeColumns": ["deleted_at"],
            "where": {},
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
            "dbConnectionString": "root:root@localhost:3306/tabletop"
        },
        "/search-content": {
            "method": "GET",
            "customLogic": " // Add custom logic for content search",
            "rules": ["decodedToken.userId == req.query.userId", "decodedToken.roleId == 'admin' || true"],
        },
    }
}