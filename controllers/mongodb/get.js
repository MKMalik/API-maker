const { MongoClient, ObjectId } = require('mongodb');

async function mongodbGetController(req, res, next) {
    try {
        const endpoint = req.endpoint;

        const client = new MongoClient(endpoint.dbConnectionString);
        await client.connect();
        const db = client.db(endpoint.databaseName);
        const collection = db.collection(endpoint.tableName);

        const queryParams = req.query;
        const limit = parseInt(queryParams.limit) || 0;
        const offset = parseInt(queryParams.offset) || 0;
        const search = queryParams.search;
        const searchBy = queryParams.search_by;
        const sortBy = queryParams.sort_by;
        const sort = queryParams.sort; // ASC or DESC

        const filter = endpoint.where || {};

        if (filter._id) {
            filter._id = new ObjectId(filter._id)
        }

        // Construct filter based on search and searchBy parameters
        if (search && searchBy) {
            const searchFields = searchBy.split(',').map(field => field.trim());
            const searchValue = new RegExp(search.trim(), 'i');

            if (searchFields.length > 0) {
                const searchConditions = searchFields.map(field => ({
                    [field]: searchValue
                }));

                filter.$or = searchConditions;
            }
        }

        // Construct projection based on columns and excludeColumns
        let projection = {};
        if (endpoint.columns && endpoint.columns.length > 0) {
            endpoint.columns.forEach(col => {
                projection[col] = 1;
            });
        } else {
            // If columns are not specified, include all by default
            projection = { ...projection, ...filter };
        }

        // Implementing search functionality, constructing filter...

        let query = collection.find(filter).project(projection); // Apply projection

        if (sortBy) {
            const sortOptions = {};
            sortOptions[sortBy] = sort;
            query = query.sort(sortOptions);
        }

        // Handling limit and offset...
        if (limit > 0) {
            query = query.limit(limit);
        }
        if (offset > 0) {
            query = query.skip(offset);
        }

        const results = await query.toArray();

        let response = { data: results };
        if (limit > 0) {
            response.limit = limit;
            response.offset = offset;

            const totalDocuments = await collection.countDocuments(filter);
            response.total_count = totalDocuments;
        }
        res.json(response);

        await client.close();
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Internal server error', log: error });
    }
}

module.exports = { mongodbGetController };
