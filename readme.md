## Create Table body
```JSON
{
    "table_name": "my_table",
    "schema": {
        "id": {
            "type": "int",
            "primary_key": true,
            "auto_increment": true
        },
        "first_name": {
            "type": "string",
            "length": 50,
            "required": true,
            "allow_null": false
        },
        "last_name": {
            "type": "string",
            "length": 50,
            "required": true,
            "allow_null": false
        },
        "email": {
            "type": "string",
            "length": 100,
            "required": true,
            "unique": true
        },
        "age": {
            "type": "int",
            "required": true,
            "default": 18,
            "check": "age >= 18" 
        },
        "date_of_birth": {
            "type": "date"
        },
        "is_active": {
            "type": "boolean",
            "default": true
        },
        "address": {
            "type": "json"
        },
        "skills": {
            "type": "json"
        },
        "price": {
            "type": "decimal",
            "precision": 10,
            "scale": 2,
            "default": 0.00
        }
    },
    "indexes": [
        {
            "columns": ["first_name", "last_name"],
            "type": "normal"
        },
        {
            "columns": ["email"],
            "type": "unique"
        },
        {
            "columns": ["date_of_birth"],
            "type": "index"
        }
    ],
    "database_connection": "root:root@localhost:3306/api_maker"
}
```

