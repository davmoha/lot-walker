import { withCompanyContext } from '../db/pool.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

/**
 * POST /api/kiosk/token
 * Generates a long-lived kiosk JWT for a specific department.
 * Only company_admin / super_admin can call this.
 */
export async function generateKioskToken(req, res) {
  try {
    const { department_id } = req.body;
    if (!department_id) {
      return res.status(400).json({ error: 'department_id is required.' });
    }

    // Verify department belongs to this company
    const dept = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `SELECT id, name FROM departments
         WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [department_id]
      );
      return r.rows[0];
    });

    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Issue a kiosk token valid for 1 year
    const kioskToken = jwt.sign(
      {
        type: 'kiosk',
        company_id: req.companyId,
        department_id: dept.id,
        department_name: dept.name,
      },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    return res.json({
      kiosk_token: kioskToken,
      department: dept,
      kiosk_url: `/kiosk/${dept.id}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/kiosk/issues?department_id=xxx
 * Returns open issues for a department. Accepts both regular JWT and kiosk JWT.
 */
export async function getKioskIssues(req, res) {
  try {
    const department_id = req.query.department_id || req.kioskDepartmentId;
    if (!department_id) {
      return res.status(400).json({ error: 'department_id required.' });
    }

    const issues = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `SELECT i.id, i.description, i.status, i.opened_at,
                v.vin, v.stock_number, v.make, v.model, v.trim, v.color,
                d.name AS department_name
         FROM issues i
         JOIN inventory v ON v.id = i.inventory_id
         LEFT JOIN departments d ON d.id = i.department_id
         WHERE i.company_id = current_setting('app.current_company_id')::uuid
           AND i.department_id = $1
           AND i.status = 'open'
         ORDER BY i.opened_at ASC`,
        [department_id]
      );
      return r.rows;
    });

    return res.json(issues);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/kiosk/issues/:id/close
 * Closes an issue from the kiosk. Accepts kiosk JWT.
 */
export async function kioskCloseIssue(req, res) {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) {
      return res.status(400).json({ error: 'technician_id is required.' });
    }

    const updated = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `UPDATE issues
         SET status = 'closed',
             closed_by_technician_id = $1,
             closed_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND company_id = current_setting('app.current_company_id')::uuid
           AND status = 'open'
         RETURNING *`,
        [technician_id, id]
      );
      return r.rows[0];
    });

    if (!updated) {
      return res.status(404).json({ error: 'Issue not found or already closed.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/kiosk/technicians?department_id=xxx
 * Returns active technicians for a department.
 */
export async function getKioskTechnicians(req, res) {
  try {
    const department_id = req.query.department_id || req.kioskDepartmentId;
    if (!department_id) {
      return res.status(400).json({ error: 'department_id required.' });
    }

    const techs = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `SELECT id, name FROM technicians
         WHERE company_id = current_setting('app.current_company_id')::uuid
           AND department_id = $1
           AND active = true
         ORDER BY name ASC`,
        [department_id]
      );
      return r.rows;
    });

    return res.json(techs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
