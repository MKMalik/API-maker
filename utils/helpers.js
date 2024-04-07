// Function to filter out excluded columns from the fetched columns
function getRequiredColumns(
  columns,
  excludeColumns = [],
  allColumns,
  tableName,
  alias,
) {
  let requiredColumns = [];

  if (columns.includes("*")) {
    requiredColumns = allColumns
      ?.filter((col) => !excludeColumns?.includes(col))
      .map((col) => `${alias ?? tableName}.${col}`);
  } else {
    requiredColumns = columns
      .filter((col) => !excludeColumns?.includes(col))
      .map((col) => `${alias ?? tableName}.${col}`);
  }

  // console.log("TCL: getRequiredColumns -> requiredColumns", requiredColumns)
  return requiredColumns;
}

function parseNestedJSON(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      try {
        obj[key] = JSON.parse(obj[key]);
      } catch (error) {
        // If unable to parse, it remains unchanged
      }
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      parseNestedJSON(obj[key]); // Recursive call for nested objects
    }
  }
  return obj;
}

function parseNestedJSONandRemoveNulls(obj) {
  const jsonString = JSON.stringify(obj);
  const jsonObject = JSON.parse(jsonString);

  function removeNullsAndEmptyArrays(jsonObj) {
    for (const key in jsonObj) {
      if (jsonObj[key] !== null && typeof jsonObj[key] === "object") {
        if (Array.isArray(jsonObj[key])) {
          if (jsonObj[key].length === 0) {
            delete jsonObj[key];
          } else {
            jsonObj[key].forEach((element) => {
              if (typeof element === "object") {
                removeNullsAndEmptyArrays(element);
              }
            });
          }
        } else {
          removeNullsAndEmptyArrays(jsonObj[key]);
          const values = Object.values(jsonObj[key]);
          const allNull = values.every((val) => val === null);
          if (allNull) {
            delete jsonObj[key];
          }
        }
      }
    }
    return jsonObj;
  }

  const parsedObject = removeNullsAndEmptyArrays(jsonObject);
  const finalString = JSON.stringify(parsedObject);
  return JSON.parse(finalString);
}

module.exports = {
  getRequiredColumns,
  parseNestedJSON,
  parseNestedJSONandRemoveNulls,
};
