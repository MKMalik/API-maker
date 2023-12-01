```json
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
```

Body
```json
{
    "user": {
        "name": "John Doe",
        "email": "johndoe@example.com"
    },
    "address": {
        "address_line": "123 Main Street",
        "city_id": 1,
        "country": "USA"
    },
    "city": {
        "city_name": "New York"
    },
    "roles": {
        "role_name": "Admin"
    }
}

```