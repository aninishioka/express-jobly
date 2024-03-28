"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe("create", function () {

  const newJob = {

    companyHandle: "c1",
    title: "waiter",
    salary: 10000,
    equity: 0.5,

  };

  const badJob = {

    companyHandle: "panda",
    title: "waiter",
    salary: 10000,
    equity: 0.5,

  };

  test("works", async function () {

    const job = await Job.create(newJob);

    expect(job).toEqual({
      companyHandle: "c1",
      title: "waiter",
      salary: 10000,
      equity: "0.5",
      id: expect.any(Number)
    });

  });

  test("works: rejects create if no company found", async function () {

    await expect(Job.create(badJob)).rejects.toThrow(NotFoundError);

  });


});