
// Function to filter out excluded columns from the fetched columns
function getRequiredColumns(columns, excludeColumns = [], allColumns) {
    let requiredColumns = [];

    if (columns.includes("*")) {
        requiredColumns = allColumns?.filter(col => !excludeColumns?.includes(col));
    } else {
        requiredColumns = columns.filter(col => !excludeColumns?.includes(col));
    }

    console.log("TCL: getRequiredColumns -> requiredColumns", requiredColumns)
    return requiredColumns;
}

module.exports = {
    getRequiredColumns,
};
