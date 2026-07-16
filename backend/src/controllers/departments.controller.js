import { withCompanyContext } from '../db/pool.js';

export async function listDepartments(req, res) {
  try {
    const rows = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `SELECT id, company_id, name, notification_email FROM departments
         WHERE company_id = current_setting('app.current_company_id')::uuid ORDER BY name`
      );
      return r.rows;
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, notification_email } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `INSERT INTO departments (company_id, name, notification_email)
         VALUES (current_setting('app.current_company_id')::uuid, $1, $2)
         RETURNING *`,
        [name, notification_email || null]
      );
      return r.rows[0];
    });
    return res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Department name already exists.' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, notification_email } = req.body;

    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `UPDATE departments SET
           name = COALESCE($1, name),
           notification_email = COALESCE($2, notification_email)
         WHERE id = $3 AND company_id = current_setting('app.current_company_id')::uuid
         RETURNING *`,
        [name || null, notification_email || null, id]
      );
      return r.rows[0];
    });

    if (!row) return res.status(404).json({ error: 'Department not found.' });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    await withCompanyContext(req.companyId, async (client) => {
      await client.query(
        `DELETE FROM departments WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [id]
      );
    });
    return res.json({ message: 'Department deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
