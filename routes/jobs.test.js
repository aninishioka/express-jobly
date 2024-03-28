"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new job",
    equity: 0.5,
    salary: 1000,
    companyHandle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new job",
        equity: "0.5",
        salary: 1000,
        companyHandle: "c1"
      }
    });
  });

  test("not ok for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        "message": "Unauthorized",
        status: 401
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 1000,
        company_handle: "c1"
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "not-a-salary",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [{
          id: expect.any(Number),
          companyHandle: "c1",
          title: "J1",
          salary: 1000,
          equity: "0.4"
        },
        {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "J2",
          salary: 2000,
          equity: "0.2"
        },
        {
          id: expect.any(Number),
          companyHandle: "c2",
          title: "J3",
          salary: 2000,
          equity: "0"
        },
        {
          id: expect.any(Number),
          companyHandle: "c3",
          title: "J4",
          salary: 500,
          equity: "0"
        },]
    });
  });

  test("get companies filtered by title", async function () {
    const resp = await request(app).get("/jobs?titleLike=J1");
    expect(resp.body).toEqual({
      jobs:
        [{
          id: expect.any(Number),
          companyHandle: "c1",
          title: "J1",
          salary: 1000,
          equity: "0.4"
        }]
    });
  });

  test("get companies filtered by title and equity", async function () {
    const q = new URLSearchParams({
      titleLike: 'J',
      hasEquity: true
    });
    const resp = await request(app).get(`/jobs?${q}`);
    expect(resp.body).toEqual({
      jobs:
        [{
          id: expect.any(Number),
          companyHandle: "c1",
          title: "J1",
          salary: 1000,
          equity: "0.4"
        },
        {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "J2",
          salary: 2000,
          equity: "0.2"
        }]
    });
  });

  test("get companies with invalid salary", async function () {
    const q = new URLSearchParams({
      minSalary: 'a'
    });
    const resp = await request(app).get(`/jobs?${q}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual(
      ["instance.minSalary is not of a type(s) integer"]
    );
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J1",
        equity: "0.4",
        salary: 1000,
        companyHandle: "c1"
      }
    });
  });

  test("get nonexistent job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });

});


/************************************** GET /jobs/:handle/all */

describe("GET /jobs/:handle/all", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/jobs/c1/all`);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J1",
          salary: 1000,
          equity: "0.4",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "J2",
          salary: 2000,
          equity: "0.2"
        }
      ]
    });
  });

  test("get nonexistent job", async function () {
    const resp = await request(app).get(`/jobs/0/all`);
    expect(resp.statusCode).toEqual(404);
  });

});