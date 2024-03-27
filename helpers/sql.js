"use strict";

const { BadRequestError } = require("../expressError");


/**
 * takes two objects:
 *  datatoupdate: object, {firstName: Aliya},
 *  jstoSql: object, columns that correspond to our db
 *
 *
 * returns object:  object with db columns in a string, and updated values in an array

  {firstName: Aliya}, {firstName: first_name}  => {setCols: '"first_name"=$1', values: ["Aliya"]}
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
