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





}

module.exports = Job;
