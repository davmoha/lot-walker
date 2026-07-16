import { withCompanyContext } from '../db/pool.js';

export async function listInventory(req, res) {
  try {
    const { search } = req.query;
    const rows = await withCompanyContext(req.companyId, async (client) => {
      let sql = `SELECT id, company_id, vin, stock_number, make, model, trim, color, mileage, status, imported_at
                 FROM inventory
                 WHERE company_id = current_setting('app.current_company_id')::uuid`;
      const params = [];

      if (search) {
        params.push(`%${search.toUpperCase()}%`);
        sql += ` AND (UPPER(vin) LIKE $1 OR UPPER(stock_number) LIKE $1)`;
      }

      sql += ' ORDER BY imported_at DESC';
      const r = await client.query(sql, params);
      return r.rows;
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function getVehicle(req, res) {
  try {
    const { id } = req.params;
    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `SELECT * FROM inventory
         WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [id]
      );
      return r.rows[0];
    });
    if (!row) return res.status(404).json({ error: 'Vehicle not found.' });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function upsertVehicle(req, res) {
  try {
    const { vin, stock_number, make, model, trim, color, mileage, status } = req.body;
    if (!vin) return res.status(400).json({ error: 'vin is required.' });

    const cleanVin = vin.replace(/[\s-]/g, '').replace(/O/g, '0').toUpperCase();

    const row = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `INSERT INTO inventory (company_id, vin, stock_number, make, model, trim, color, mileage, status)
         VALUES (current_setting('app.current_company_id')::uuid, $1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (vin) DO UPDATE SET
           stock_number = EXCLUDED.stock_number,
           make = EXCLUDED.make,
           model = EXCLUDED.model,
           trim = EXCLUDED.trim,
           color = EXCLUDED.color,
           mileage = EXCLUDED.mileage,
           status = EXCLUDED.status,
           imported_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [cleanVin, stock_number || null, make || null, model || null, trim || null, color || null, mileage || 0, status || null]
      );
      return r.rows[0];
    });
    return res.status(200).json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;
    await withCompanyContext(req.companyId, async (client) => {
      await client.query(
        `DELETE FROM inventory WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [id]
      );
    });
    return res.json({ message: 'Vehicle deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
