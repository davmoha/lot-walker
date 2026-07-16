import { withCompanyContext } from '../db/pool.js';
import { sendIssueNotificationEmail } from '../utils/email.js';

export async function listIssues(req, res) {
  try {
    const { department_id, status } = req.query;
    const rows = await withCompanyContext(req.companyId, async (client) => {
      let sql = `SELECT i.*, inv.vin, inv.stock_number, inv.make, inv.model, inv.trim,
                        d.name AS department_name, t.name AS closed_by_tech_name
                 FROM issues i
                 LEFT JOIN inventory inv ON inv.id = i.inventory_id
                 LEFT JOIN departments d ON d.id = i.department_id
                 LEFT JOIN technicians t ON t.id = i.closed_by_technician_id
                 WHERE i.company_id = current_setting('app.current_company_id')::uuid`;
      const params = [];

      if (department_id) {
        params.push(department_id);
        sql += ` AND i.department_id = $${params.length}`;
      }
      if (status) {
        params.push(status);
        sql += ` AND i.status = $${params.length}::issue_status`;
      }

      sql += ' ORDER BY i.opened_at DESC';
      const r = await client.query(sql, params);
      return r.rows;
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function createIssue(req, res) {
  try {
    const { inventory_id, department_id, description } = req.body;

    if (!inventory_id || !description) {
      return res.status(400).json({ error: 'inventory_id and description are required.' });
    }

    const result = await withCompanyContext(req.companyId, async (client) => {
      // Insert the issue
      const issueResult = await client.query(
        `INSERT INTO issues (company_id, inventory_id, department_id, description, created_by)
         VALUES (current_setting('app.current_company_id')::uuid, $1, $2, $3, $4)
         RETURNING *`,
        [inventory_id, department_id || null, description, req.user.userId]
      );
      const issue = issueResult.rows[0];

      // Fetch vehicle and department for email
      const vehicleResult = await client.query(
        `SELECT vin, stock_number, make, model, trim FROM inventory WHERE id = $1`,
        [inventory_id]
      );
      const vehicle = vehicleResult.rows[0];

      let deptEmail = null;
      if (department_id) {
        const deptResult = await client.query(
          `SELECT notification_email FROM departments WHERE id = $1`,
          [department_id]
        );
        deptEmail = deptResult.rows[0]?.notification_email;
      }

      return { issue, vehicle, deptEmail };
    });

    // Fire notification email asynchronously (don't block response)
    if (result.deptEmail && result.vehicle) {
      sendIssueNotificationEmail(result.deptEmail, result.issue, result.vehicle).catch((err) =>
        console.error('Email notification failed:', err)
      );
    }

    return res.status(201).json(result.issue);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function closeIssue(req, res) {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) {
      return res.status(400).json({ error: 'technician_id is required.' });
    }

    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `UPDATE issues SET
           status = 'closed',
           closed_by_technician_id = $1,
           closed_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND company_id = current_setting('app.current_company_id')::uuid
         RETURNING *`,
        [technician_id, id]
      );
      return r.rows[0];
    });

    if (!row) return res.status(404).json({ error: 'Issue not found.' });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function deleteIssue(req, res) {
  try {
    const { id } = req.params;
    await withCompanyContext(req.companyId, async (client) => {
      await client.query(
        `DELETE FROM issues WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [id]
      );
    });
    return res.json({ message: 'Issue deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
