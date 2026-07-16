import { query } from '../db/pool.js';
import bcrypt from 'bcryptjs';

/** GET /api/admin/companies — list all companies (super_admin) */
export async function listCompanies(req, res) {
  try {
    const result = await query(
      'SELECT id, name, dealer_code, logo_url, contact_info, created_at FROM companies ORDER BY created_at DESC'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** POST /api/admin/companies — create a new company (super_admin) */
export async function createCompany(req, res) {
  try {
    const { name, dealer_code, logo_url, contact_info } = req.body;
    if (!name || !dealer_code) {
      return res.status(400).json({ error: 'name and dealer_code are required.' });
    }

    const result = await query(
      `INSERT INTO companies (name, dealer_code, logo_url, contact_info)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, dealer_code, logo_url, contact_info, created_at`,
      [name, dealer_code.trim().toUpperCase(), logo_url || null, contact_info || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Dealer code already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** PUT /api/admin/companies/:id — update a company (super_admin) */
export async function updateCompany(req, res) {
  try {
    const { id } = req.params;
    const { name, logo_url, contact_info } = req.body;

    const result = await query(
      `UPDATE companies SET
         name = COALESCE($1, name),
         logo_url = COALESCE($2, logo_url),
         contact_info = COALESCE($3, contact_info)
       WHERE id = $4
       RETURNING id, name, dealer_code, logo_url, contact_info, created_at`,
      [name || null, logo_url || null, contact_info || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** DELETE /api/admin/companies/:id — delete a company (super_admin) */
export async function deleteCompany(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM companies WHERE id = $1', [id]);
    return res.json({ message: 'Company deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
