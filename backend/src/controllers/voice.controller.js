import { createClient } from '@deepgram/sdk';
import fetch from 'node-fetch';
import { withCompanyContext } from '../db/pool.js';
import { sendIssueEmail } from '../utils/email.js';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b-instruct-q4_K_M';

/**
 * POST /api/voice/transcribe-and-act
 * Accepts: multipart/form-data with:
 *   - audio: audio file (webm/wav/mp3)
 *   - inventory_id: UUID of the scanned vehicle
 *
 * Pipeline:
 *   1. Deepgram Nova-3 → transcript
 *   2. Ollama function-calling → { description, department_keyword }
 *   3. Fuzzy-match department_keyword → department_id
 *   4. Insert issue + trigger email
 */
export async function transcribeAndAct(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    const { inventory_id } = req.body;
    if (!inventory_id) {
      return res.status(400).json({ error: 'inventory_id is required.' });
    }

    // ── Step 1: Deepgram transcription ──────────────────────────────────
    let transcript = '';
    if (!DEEPGRAM_API_KEY) {
      return res.status(503).json({ error: 'DEEPGRAM_API_KEY not configured.' });
    }

    const deepgram = createClient(DEEPGRAM_API_KEY);
    const { result: dgResult, error: dgError } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: 'nova-3',
        smart_format: true,
        language: 'en-US',
      }
    );

    if (dgError) {
      console.error('Deepgram error:', dgError);
      return res.status(502).json({ error: 'Transcription failed.' });
    }

    transcript = dgResult?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    if (!transcript) {
      return res.status(400).json({ error: 'No speech detected in audio.' });
    }

    // ── Step 2: Fetch departments for this company ───────────────────────
    const departments = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `SELECT id, name, notification_email FROM departments
         WHERE company_id = current_setting('app.current_company_id')::uuid
         ORDER BY name`
      );
      return r.rows;
    });

    const deptList = departments.map((d) => d.name).join(', ');

    // ── Step 3: Ollama function-calling ─────────────────────────────────
    const systemPrompt = `You are a vehicle inspection assistant. Extract the issue description and the best matching department from the technician's voice note.
Available departments: ${deptList || 'Service, Body Shop, Detail, Parts'}.
Respond ONLY with valid JSON matching this exact schema:
{"description": "<concise issue description>", "department": "<exact department name from the list or null>"}
Do not include any other text.`;

    let ollamaResult = { description: transcript, department: null };

    try {
      const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: `Voice note: "${transcript}"\n\nExtract the issue and department.`,
          system: systemPrompt,
          stream: false,
          format: 'json',
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        const parsed = JSON.parse(ollamaData.response || '{}');
        if (parsed.description) ollamaResult.description = parsed.description;
        if (parsed.department) ollamaResult.department = parsed.department;
      }
    } catch (ollamaErr) {
      console.warn('Ollama unavailable, using raw transcript:', ollamaErr.message);
    }

    // ── Step 4: Match department name → ID ──────────────────────────────
    let matchedDept = null;
    if (ollamaResult.department) {
      const keyword = ollamaResult.department.toLowerCase();
      matchedDept = departments.find(
        (d) => d.name.toLowerCase().includes(keyword) || keyword.includes(d.name.toLowerCase())
      );
    }

    // ── Step 5: Insert issue ─────────────────────────────────────────────
    const newIssue = await withCompanyContext(req.companyId, async (client) => {
      const r = await client.query(
        `INSERT INTO issues (company_id, inventory_id, department_id, description, status, created_by, opened_at)
         VALUES (current_setting('app.current_company_id')::uuid, $1, $2, $3, 'open', $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          inventory_id,
          matchedDept?.id || null,
          ollamaResult.description,
          req.user.id,
        ]
      );
      return r.rows[0];
    });

    // ── Step 6: Trigger department email ────────────────────────────────
    if (matchedDept?.notification_email) {
      const vehicle = await withCompanyContext(req.companyId, async (client) => {
        const r = await client.query(
          'SELECT vin, stock_number, make, model FROM inventory WHERE id = $1',
          [inventory_id]
        );
        return r.rows[0];
      });

      await sendIssueEmail({
        to: matchedDept.notification_email,
        department: matchedDept.name,
        description: ollamaResult.description,
        vehicle,
        issueId: newIssue.id,
      }).catch((e) => console.warn('Email send failed:', e.message));
    }

    return res.json({
      transcript,
      description: ollamaResult.description,
      department: matchedDept ? { id: matchedDept.id, name: matchedDept.name } : null,
      issue_id: newIssue.id,
    });
  } catch (err) {
    console.error('Voice action error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
