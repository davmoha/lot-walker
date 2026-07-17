import { withCompanyContext } from '../db/pool.js';

/**
 * GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns all three report datasets in a single call.
 */
export async function getReportSummary(req, res) {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to date parameters are required.' });
    }

    const data = await withCompanyContext(req.companyId, async (client) => {
      // ── 1. Time-to-Line ────────────────────────────────────────────────
      // Avg days from inventory import_at to all issues on that vehicle closed
      const ttlResult = await client.query(
        `WITH vehicle_completion AS (
           SELECT
             v.id,
             v.vin,
             v.stock_number,
             v.make,
             v.model,
             v.imported_at,
             MAX(i.closed_at) AS last_issue_closed
           FROM inventory v
           JOIN issues i ON i.inventory_id = v.id
           WHERE v.company_id = current_setting('app.current_company_id')::uuid
             AND i.status = 'closed'
             AND i.closed_at BETWEEN $1 AND $2::date + interval '1 day'
           GROUP BY v.id, v.vin, v.stock_number, v.make, v.model, v.imported_at
           HAVING COUNT(CASE WHEN i.status = 'open' THEN 1 END) = 0
         )
         SELECT
           vin,
           stock_number,
           make,
           model,
           imported_at,
           last_issue_closed,
           ROUND(EXTRACT(EPOCH FROM (last_issue_closed - imported_at)) / 86400, 1) AS days_to_line
         FROM vehicle_completion
         ORDER BY days_to_line DESC`,
        [from, to]
      );

      // ── 2. Department Bottleneck ────────────────────────────────────────
      // Avg hours to close by department
      const deptResult = await client.query(
        `SELECT
           d.name AS department,
           COUNT(i.id) AS total_issues,
           COUNT(CASE WHEN i.status = 'closed' THEN 1 END) AS closed_issues,
           ROUND(
             AVG(
               CASE WHEN i.status = 'closed'
               THEN EXTRACT(EPOCH FROM (i.closed_at - i.opened_at)) / 3600
               END
             )::numeric, 1
           ) AS avg_hours_to_close
         FROM issues i
         JOIN departments d ON d.id = i.department_id
         WHERE i.company_id = current_setting('app.current_company_id')::uuid
           AND i.opened_at BETWEEN $1 AND $2::date + interval '1 day'
         GROUP BY d.name
         ORDER BY avg_hours_to_close DESC NULLS LAST`,
        [from, to]
      );

      // ── 3. Tech Velocity ───────────────────────────────────────────────
      // Tickets closed per technician
      const techResult = await client.query(
        `SELECT
           t.name AS technician,
           d.name AS department,
           COUNT(i.id) AS tickets_closed,
           ROUND(
             AVG(EXTRACT(EPOCH FROM (i.closed_at - i.opened_at)) / 3600)::numeric, 1
           ) AS avg_hours_per_ticket
         FROM issues i
         JOIN technicians t ON t.id = i.closed_by_technician_id
         LEFT JOIN departments d ON d.id = t.department_id
         WHERE i.company_id = current_setting('app.current_company_id')::uuid
           AND i.status = 'closed'
           AND i.closed_at BETWEEN $1 AND $2::date + interval '1 day'
         GROUP BY t.name, d.name
         ORDER BY tickets_closed DESC`,
        [from, to]
      );

      // ── 4. Summary stats ───────────────────────────────────────────────
      const statsResult = await client.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'open') AS open_issues,
           COUNT(*) FILTER (WHERE status = 'closed') AS closed_issues,
           COUNT(*) AS total_issues,
           ROUND(AVG(
             CASE WHEN status = 'closed'
             THEN EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600
             END
           )::numeric, 1) AS avg_close_hours
         FROM issues
         WHERE company_id = current_setting('app.current_company_id')::uuid
           AND opened_at BETWEEN $1 AND $2::date + interval '1 day'`,
        [from, to]
      );

      return {
        time_to_line: ttlResult.rows,
        dept_bottleneck: deptResult.rows,
        tech_velocity: techResult.rows,
        summary: statsResult.rows[0],
      };
    });

    return res.json(data);
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/reports/export/csv?from=&to=&report=time_to_line|dept_bottleneck|tech_velocity
 */
export async function exportCSV(req, res) {
  try {
    const { from, to, report } = req.query;
    if (!from || !to || !report) {
      return res.status(400).json({ error: 'from, to, and report are required.' });
    }

    // Re-use the summary endpoint logic
    const mockReq = { ...req, query: { from, to } };
    let reportData;
    await withCompanyContext(req.companyId, async (client) => {
      // Run the appropriate query
      let result;
      if (report === 'time_to_line') {
        result = await client.query(
          `WITH vehicle_completion AS (
             SELECT v.id, v.vin, v.stock_number, v.make, v.model, v.imported_at,
                    MAX(i.closed_at) AS last_issue_closed
             FROM inventory v
             JOIN issues i ON i.inventory_id = v.id
             WHERE v.company_id = current_setting('app.current_company_id')::uuid
               AND i.status = 'closed' AND i.closed_at BETWEEN $1 AND $2::date + interval '1 day'
             GROUP BY v.id, v.vin, v.stock_number, v.make, v.model, v.imported_at
           )
           SELECT vin, stock_number, make, model,
                  TO_CHAR(imported_at, 'YYYY-MM-DD') AS imported_at,
                  TO_CHAR(last_issue_closed, 'YYYY-MM-DD HH24:MI') AS last_issue_closed,
                  ROUND(EXTRACT(EPOCH FROM (last_issue_closed - imported_at)) / 86400, 1) AS days_to_line
           FROM vehicle_completion ORDER BY days_to_line DESC`,
          [from, to]
        );
      } else if (report === 'dept_bottleneck') {
        result = await client.query(
          `SELECT d.name AS department, COUNT(i.id) AS total_issues,
                  COUNT(CASE WHEN i.status = 'closed' THEN 1 END) AS closed_issues,
                  ROUND(AVG(CASE WHEN i.status = 'closed'
                    THEN EXTRACT(EPOCH FROM (i.closed_at - i.opened_at)) / 3600 END)::numeric, 1) AS avg_hours_to_close
           FROM issues i JOIN departments d ON d.id = i.department_id
           WHERE i.company_id = current_setting('app.current_company_id')::uuid
             AND i.opened_at BETWEEN $1 AND $2::date + interval '1 day'
           GROUP BY d.name ORDER BY avg_hours_to_close DESC NULLS LAST`,
          [from, to]
        );
      } else {
        result = await client.query(
          `SELECT t.name AS technician, d.name AS department,
                  COUNT(i.id) AS tickets_closed,
                  ROUND(AVG(EXTRACT(EPOCH FROM (i.closed_at - i.opened_at)) / 3600)::numeric, 1) AS avg_hours_per_ticket
           FROM issues i JOIN technicians t ON t.id = i.closed_by_technician_id
           LEFT JOIN departments d ON d.id = t.department_id
           WHERE i.company_id = current_setting('app.current_company_id')::uuid
             AND i.status = 'closed' AND i.closed_at BETWEEN $1 AND $2::date + interval '1 day'
           GROUP BY t.name, d.name ORDER BY tickets_closed DESC`,
          [from, to]
        );
      }
      reportData = result.rows;
    });

    if (!reportData || reportData.length === 0) {
      return res.status(404).json({ error: 'No data for this date range.' });
    }

    // Convert to CSV
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map((row) =>
      Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="lot-walker-${report}-${from}-${to}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
