import { parse } from 'csv-parse/sync';
import { mapHeaders, cleanRow } from '../utils/csvMapper.js';
import { withCompanyContext } from '../db/pool.js';

/**
 * POST /api/import/preview
 * Accepts a CSV file, returns detected headers and suggested mapping.
 * No data is written — used for the mapping confirmation screen.
 */
export async function previewImport(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty.' });
    }

    const rawHeaders = Object.keys(records[0]);
    const mapping = mapHeaders(rawHeaders);

    // Return first 5 rows as preview
    const preview = records.slice(0, 5).map((row) => cleanRow(row, mapping));

    return res.json({
      raw_headers: rawHeaders,
      suggested_mapping: mapping,
      preview_rows: preview,
      total_rows: records.length,
    });
  } catch (err) {
    console.error('CSV preview error:', err);
    return res.status(400).json({ error: 'Failed to parse CSV. Ensure it is a valid CSV file.' });
  }
}

/**
 * POST /api/import/confirm
 * Accepts a CSV file + confirmed mapping, performs upsert into inventory.
 */
export async function confirmImport(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // mapping comes as JSON string in form-data
    let mapping;
    try {
      mapping = JSON.parse(req.body.mapping || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid mapping JSON.' });
    }

    if (!mapping.vin) {
      return res.status(400).json({ error: 'Mapping must include a VIN column.' });
    }

    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    let imported = 0;
    let skipped = 0;
    const errors = [];

    await withCompanyContext(req.companyId, async (client) => {
      for (const record of records) {
        const vehicle = cleanRow(record, mapping);

        if (!vehicle.vin || vehicle.vin.length < 5) {
          skipped++;
          continue;
        }

        try {
          await client.query(
            `INSERT INTO inventory (company_id, vin, stock_number, make, model, trim, color, mileage, status)
             VALUES (current_setting('app.current_company_id')::uuid, $1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (vin) DO UPDATE SET
               stock_number = EXCLUDED.stock_number,
               make         = EXCLUDED.make,
               model        = EXCLUDED.model,
               trim         = EXCLUDED.trim,
               color        = EXCLUDED.color,
               mileage      = EXCLUDED.mileage,
               status       = EXCLUDED.status,
               imported_at  = CURRENT_TIMESTAMP`,
            [
              vehicle.vin,
              vehicle.stock_number,
              vehicle.make,
              vehicle.model,
              vehicle.trim,
              vehicle.color,
              vehicle.mileage,
              vehicle.status,
            ]
          );
          imported++;
        } catch (rowErr) {
          skipped++;
          errors.push({ vin: vehicle.vin, error: rowErr.message });
        }
      }
    });

    return res.json({
      message: `Import complete: ${imported} vehicles upserted, ${skipped} skipped.`,
      imported,
      skipped,
      errors: errors.slice(0, 20), // cap error list
    });
  } catch (err) {
    console.error('CSV import error:', err);
    return res.status(500).json({ error: 'Import failed.' });
  }
}
