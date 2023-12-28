```javascript
const updatedSchema = {
    added_columns: {
        role_name: {
            type: 'string',
            length: 50,
            required: true,
            allow_null: false,
            unique: true
        },
        // Additional added columns...
    },
    updated_columns: {
        user_id: {
            type: 'int',
            required: true
        },
        // Additional updated columns...
    },
    droppedColumns: [
        'mobile',
        'centerNm'
    ],
    primary_key: {
        old: 'id',
        new: 'user_id',
        type: 'int'
        auto_increment: false,
    },
    indexes: {
        removed_columns: ['city', 'address'],
        added_columns: ['street', 'state', 'country'],
    }
};
```