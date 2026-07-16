import bcrypt from 'bcryptjs';
import { withCompanyContext, query } from '../db/pool.js';

/** GET /api/users */
export async function listUsers(req, res) {
  try {
    const rows = await withCompanyContext(req.companyId, async (client) => {
      const result = await client.query(
        `SELECT id, company_id, role, email, name, created_at
         FROM users
         WHERE company_id = current_setting('app.current_company_id')::uuid
         ORDER BY name ASC`
      );
      return result.rows;
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** POST /api/users */
export async function createUser(req, res) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, and role are required.' });
    }

    const validRoles = ['company_admin', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    const hash = await bcrypt.hash(password, 12);

    const row = await withCompanyContext(req.companyId, async (client) => {
      const result = await client.query(
        `INSERT INTO users (company_id, role, email, password_hash, name)
         VALUES (current_setting('app.current_company_id')::uuid, $1, $2, $3, $4)
         RETURNING id, company_id, role, email, name, created_at`,
        [role, email.trim().toLowerCase(), hash, name]
      );
      return result.rows[0];
    });

    return res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** PUT /api/users/:id */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const row = await withCompanyContext(req.companyId, async (client) => {
      const result = await client.query(
        `UPDATE users SET
           name = COALESCE($1, name),
           role = COALESCE($2::user_role, role)
         WHERE id = $3 AND company_id = current_setting('app.current_company_id')::uuid
         RETURNING id, company_id, role, email, name, created_at`,
        [name || null, role || null, id]
      );
      return result.rows[0];
    });

    if (!row) return res.status(404).json({ error: 'User not found.' });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** DELETE /api/users/:id (deactivate by removing — or add an active flag in a future phase) */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    await withCompanyContext(req.companyId, async (client) => {
      await client.query(
        `DELETE FROM users WHERE id = $1 AND company_id = current_setting('app.current_company_id')::uuid`,
        [id]
      );
    });

    return res.json({ message: 'User removed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/** POST /api/users/:id/reset-password (admin resets a user's password) */
export async function adminResetPassword(req, res) {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'new_password must be at least 8 characters.' });
    }

    const hash = await bcrypt.hash(new_password, 12);

    await withCompanyContext(req.companyId, async (client) => {
      await client.query(
        `UPDATE users SET password_hash = $1
         WHERE id = $2 AND company_id = current_setting('app.current_company_id')::uuid`,
        [hash, id]
      );
    });

    return res.json({ message: 'Password updated.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
