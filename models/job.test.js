"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
} = require("./_testCommon");
const { DatabaseError } = require("pg");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {

  const newJob = {

    companyHandle: "c1",
    title: "waiter",
    salary: 10000,
    equity: 0,

  };

  const badJob = {

    companyHandle: "panda",
    title: "waiter",
    salary: 10000,
    equity: 0.6,

  };

  test("works", async function () {

    const job = await Job.create(newJob);

    expect(job).toEqual({
      companyHandle: "c1",
      title: "waiter",
      salary: 10000,
      equity: "0",
      id: expect.any(Number)
    });

  });

  test("works: rejects create if no company found", async function () {

    await expect(Job.create(badJob)).rejects.toThrow(NotFoundError);

  });


});

/************************************** getAllJobsFromCompany */

describe("getAllJobsFromCompany", function () {

  const newJobC1 = {

    companyHandle: "c1",
    title: "waiter",
    salary: 10000,
    equity: 0,

  };

  test("works: gets all jobs", async function () {

    await Job.create(newJobC1)

    const jobs = await Job.getAllJobsFromCompany("c1");

    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        title: "J1",
        salary: 10000000,
        equity: "0.2",
        id: expect.any(Number)
      },
      {

        companyHandle: "c1",
        title: "waiter",
        salary: 10000,
        equity: "0",
        id: expect.any(Number)
      }
    ]);

  });

  test("throws error if company doesn't exist", async function () {
    expect(
      () => Job.getAllJobsFromCompany("Nvididas"))
               .rejects.toThrow(NotFoundError);
  });

});

/************************************** findAll */


describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();

    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        title: "J1",
        salary: 10000000,
        equity: "0.2",
        id: expect.any(Number)
      }, {
        companyHandle: "c2",
        title: "J2",
        salary: 20000000,
        equity: "0.3",
        id: expect.any(Number)
      }, {
        companyHandle: "c3",
        title: "J3",
        salary: 30000000,
        equity: "0",
        id: expect.any(Number)
      }
    ]);

  });

  test("works: filter by salary", async function () {
    const filter = { minSalary: 20000000 };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        companyHandle: "c2",
        title: "J2",
        salary: 20000000,
        equity: "0.3",
        id: expect.any(Number)
      }, {
        companyHandle: "c3",
        title: "J3",
        salary: 30000000,
        equity: "0",
        id: expect.any(Number)
      }
    ]);
  });

  test("works: filter hasEquity is true", async function () {
    const filter = { hasEquity: true };
    let jobs = await Job.findAll(filter);

    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        title: "J1",
        salary: 10000000,
        equity: "0.2",
        id: expect.any(Number)
      }, {
        companyHandle: "c2",
        title: "J2",
        salary: 20000000,
        equity: "0.3",
        id: expect.any(Number)
      }
    ]);
  });

  test("works: filter hasEquity is false", async function () {
    const filter = { hasEquity: false };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([{
      companyHandle: "c3",
      title: "J3",
      salary: 30000000,
      equity: "0",
      id: expect.any(Number)
    }]);
  });

  test("works: filter by salary", async function () {
    const filter = { minSalary: 20000000 };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        companyHandle: "c2",
        title: "J2",
        salary: 20000000,
        equity: "0.3",
        id: expect.any(Number)
      }, {
        companyHandle: "c3",
        title: "J3",
        salary: 30000000,
        equity: "0",
        id: expect.any(Number)
      }
    ]);
  });

});

/************************************** filter */


describe("_filterJobs", function () {
  test("works: returns correct query", function () {
    let filter = { minSalary: 20000000 };
    let query = Job._filterJobs(filter);
    expect(query).toEqual(
      { "setCols": "WHERE salary >= $1", "values": [20000000] }
    );
  });

  test("works: multiple queries", function () {
    let filter = { minSalary: 20000000, "titleLike": "J3" };
    let query = Job._filterJobs(filter);
    expect(query).toEqual(
      {
        "setCols": "WHERE salary >= $1 AND title ILIKE '%'||$2||'%'",
        "values": [20000000, "J3"]
      }
    );
  });

  test("works: no queries", function () {
    let filter = {};
    let query = Job._filterJobs(filter);
    expect(query).toEqual(
      {
        "setCols": "",
        "values": []
      }
    );
  });
});


describe("get", function () {
  test("works: returns correct job", async function () {
    let job = await Job.create(
      {
        companyHandle: "c1",
        title: "waiter",
        salary: 10000,
        equity: 0.5
      }
    );


    let query = await Job.get(job.id);
    expect(query).toEqual(
      {
        companyHandle: "c1",
        title: "waiter",
        salary: 10000,
        equity: "0.5",
        id: expect.any(Number)
      }
    );
  });

  test("works: nonexistent job", async function () {
    expect(() => Job.get(0)).rejects.toThrow(NotFoundError);
  });
});

/************************************** update */


describe("update", function () {
  const newJob = {

    companyHandle: "c1",
    title: "waiter",
    salary: 10000,
    equity: 0,

  };
  test("works: updating a nonexistent job", async function () {
    const updatedJobInfo = {
      title: "New Title",
      salary: 1000000,
      equity: 0,
    };
    expect(() => Job.update(100, updatedJobInfo)).rejects.toThrow(NotFoundError);

  });

  test("works: updating a job", async function () {
    let job = await Job.create(newJob);

    const updatedJobInfo = {
      title: "New Title",
      salary: 1000000,
      equity: 0,
    };

    job = await Job.update(job.id, updatedJobInfo);

    expect(job).toEqual(
      {
        "companyHandle": "c1",
        "equity": "0",
        "id": expect.any(Number),
        "salary": 1000000,
        "title": "New Title"
      });
  });

  test("works: errors for null fields", async function () {
    let job = await Job.create(newJob);

    const updatedJobInfoNull = {
      title: null,
      salary: null,
      equity: 0,
    };

    expect(() => Job.update(job.id, updatedJobInfoNull))
                    .rejects.toThrow(DatabaseError);
  });



});


describe("delete", function () {
  const newJob = {

    companyHandle: "c1",
    title: "waiter",
    salary: 10000,
    equity: 0,

  };
  test("works: deleting a job", async function () {

    let job = await Job.create(newJob);

    Job.remove(job.id)

    expect(() => Job.get(job.id)
                    .rejects.toThrow(NotFoundError));

  });

  test("deleting a job that doesn't exist throws Error", async function () {

    let job = await Job.create(newJob);

    Job.remove(job.id)

    expect(() => Job.remove(job.id)
                    .rejects.toThrow(NotFoundError));

  });

});