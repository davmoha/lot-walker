import { withCompanyContext } from '../db/pool.js';

export async function listTechnicians(req, res) {
  try {
    const { department_id, active } = req.query;
    const rows = await withCompanyContext(req.companyId, async (client) => {
      let sql = `SELECT t.id, t.company_id, t.department_id, t.name, t.active, d.name AS department_name
                 FROM technicians t
                 LEFT JOIN departments d ON d.id = t.department_id
                 WHERE t.company_id = current_setting('app.current_company_id')::uuid`;
      const params = [];

      if (department_id) {
        params.push(department_id);
        sql += ` AND t.department_id = $${params.length}`;
      }
      if (active !== undefined) {
        params.push(active === 'true');
        sql += ` AND t.active = $${params.length}`;
      }
      sql += ' ORDER BY t.name';

      const r = await client.query(sql, params);
      return r.rows;
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function createTechnician(req, res) {
  try {
    const { name, department_id, active } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `INSERT INTO technicians (company_id, department_id, name, active)
         VALUES (current_setting('app.current_company_id')::uuid, $1, $2, $3)
         RETURNING *`,
        [department_id || null, name, active !== false]
      );
      return r.rows[0];
    });
    return res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Technician name already exists.' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function updateTechnician(req, res) {
  try {
    const { id } = req.params;
    const { name, department_id, active } = req.body;

    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `UPDATE technicians SET
           name = COALESCE($1, name),
           department_id = COALESCE($2::uuid, department_id),
           active = COALESCE($3, active)
         WHERE id = $4 AND company_id = current_setting('app.current_company_id')::uuid
         RETURNING *`,
        [name || null, department_id || null, active !== undefined ? active : null, id]
      );
      return r.rows[0];
    });

    if (!row) return res.status(404).json({ error: 'Technician not found.' });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function deleteTechnician(req, res) {
  try {
    const { id } = req.params;
    await withCompanyContext(req.companyId, async (client) => {
      await client.query(
        `DELETE FROM technicians WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [id]
      );
    });
    return res.json({ message: 'Technician deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
