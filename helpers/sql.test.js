"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {

  test("no data included", function () {

    let dataToUpdate = {};
    let jsToSql = {};


    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow(BadRequestError);

  });

  test("update one column", function () {
    let dataToUpdate = { firstName: "Aliya" };
    let jsToSql = { firstName: "first_name" };

    const results = sqlForPartialUpdate(dataToUpdate, jsToSql);

    // "frist_name=$1"
    // '"first_name"=$1'
    expect(results.setCols).toEqual('"first_name"=$1');
    expect(results.values).toEqual(["Aliya"]);
  });


});