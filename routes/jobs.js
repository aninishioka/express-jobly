"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Company = require("../models/company");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const getJobSchema = require("../schemas/getJob.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, equity, salary, comapny_handle }
 *
 * Returns { id, title, equity, salary, comapny_handle }
 *
 * Authorization required: login, admin
 *
 */


router.post("/", ensureIsAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    {required: true}
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);

  return res.status(201).json({ job });
});


/** GET /  =>
 *   { jobs: [ { id, title, equity, salary, comapny_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - hasEquity (boolean)
 * - minSalary
 * - titleLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const query = req.query;
  if (query.minSalary !== undefined) {
    query.minSalary = Number(query.minSalary);
  }
  if (query.hasEquity !== undefined) {
    query.hasEquity = query.hasEquity === 'true';
  }

  const validator = jsonschema.validate(
    query,
    getJobSchema,
    {required: true }
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const jobs = await Job.findAll(query);
  return res.json({ jobs });
});


/** GET /[id]  => { job }
 *
 * Job is { job: { id, title, equity, salary, comapny_handle } }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});


/** GET /[companyHandle]  => { job }
 *
 * Job is { jobs: [{ id, title, equity, salary, comapny_handle }] }
 *
 * Authorization required: none
 */

router.get("/:handle/all", async function (req, res, next) {
  const jobs = await Job.getAllJobsFromCompany(req.params.handle);
  return res.json({ jobs });
});


module.exports = router;