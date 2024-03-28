"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { companyHandle, title, salary, equity  }
   *
   * Returns {id, companyHandle, title, salary, equity }
   *
   * Throws BadRequestError if job already in database.
   *
   * */


  static async create({ companyHandle, title, salary, equity }) {
    const companyCheck = await db.query(`
    SELECT handle
    FROM companies
    WHERE handle = $1`, [companyHandle]);


    const company = companyCheck.rows[0];

    if (!company) throw new NotFoundError(`${companyHandle} does not exist`);

    const result = await db.query(`
            INSERT INTO jobs (company_handle,
                              title,
                              salary,
                              equity)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [companyHandle, title, salary, equity]);

    const newJob = result.rows[0];

    return newJob;

  }


  /** Find all jobs.
   *
   * Takes filter object. Can filter on provided search filters:
    * - salary
    * - equity
    * - titleLike (will find case-insensitive, partial matches)
   *
   * Returns [{id, companyHandle, title, salary, equity }, ...]
   * */
  static async findAll(filter = {}) {
    const { setCols, values } = this._filterJobs(filter);

    const jobsRes = await db.query(`
      SELECT id,
             company_handle AS "companyHandle",
             title,
             salary,
             equity
      FROM jobs
      ${setCols}`,
      [...values]);

    return jobsRes.rows;
  }


  /**
   *  Takes filter object, returns sql query to filter
    * - salary
    * - equity
    * - titleLike (will find case-insensitive, partial matches)
   */
  static _filterJobs(data) {
    const keys = Object.keys(data);

    if (keys.length < 1) {
      return { setCols: "", values: [] };
    }


    let whereClause = 'WHERE ';

    const filters = keys.map((colName, idx) => {
      if (colName === "minSalary") return (`salary >= $${idx + 1}`);
      if (colName === "hasEquity") {
        if (data.hasEquity === true) {
          return (`equity != $${idx + 1}`);
        } else {
          return  (`equity = $${idx + 1}`);
        }
      }
      if (colName === "titleLike") return (`title ILIKE '%'||$${idx + 1}||'%'`);
    });

    if (keys.includes("hasEquity")) {
      data.hasEquity = 0;
    }

    return {
      setCols: whereClause += filters.join(' AND '),
      values: Object.values(data)
    };
  }


  /*Given a job id, return data about job.
  *
  * Returns {id, companyHandle, title, salary, equity }
  *
  * Throws NotFoundError if not found.
  **/

  static async get(id) {

    const jobRes = await db.query(`
       SELECT id,
              company_handle AS "companyHandle",
              title,
              salary,
              equity
       FROM jobs
       WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;

  }

  /*Given a company handle, return all jobs from that company
  *
  * Returns [{id, companyHandle, title, salary, equity }....]
  *
  * Throws NotFoundError if company found.
  **/

  static async getAllJobsFromCompany(companyHandle) {
    // check if company exists first, query OR method?

    const companyRes = await db.query(`
    SELECT handle,
           name,
           description,
           num_employees AS "numEmployees",
           logo_url      AS "logoUrl"
    FROM companies
    WHERE handle = $1`, [companyHandle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${companyHandle}`);

    const jobRes = await db.query(`
       SELECT id,
              company_handle AS "companyHandle",
              title,
              salary,
              equity
       FROM jobs
       WHERE company_handle = $1`, [companyHandle]);

    const jobs = jobRes.rows;

    if (!jobs) throw new NotFoundError(`No jobs: ${companyHandle}`);

    return jobs;

  }

  /** Update company job with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, company_handle, title, salary, equity, }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle"
      });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
      WHERE id = ${idVarIdx}
      RETURNING
        id,
        company_handle AS "companyHandle",
        title,
        salary,
        equity`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];


    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

}

module.exports = Job;
