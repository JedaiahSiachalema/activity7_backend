const router = require('express').Router();
const pool = require('../db');

const ALLOWED_STATUSES = ['Pending', 'In progress', 'Completed'];

function parseId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateRecord(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.';
  }

  const fields = [
    ['title', 3, 80, 'Title'],
    ['category', 2, 40, 'Category'],
    ['description', 5, 300, 'Description']
  ];

  for (const [field, min, max, label] of fields) {
    if (typeof body[field] !== 'string') {
      return `${label} must be provided as text.`;
    }
    const value = body[field].trim();
    if (value.length < min || value.length > max) {
      return `${label} must have ${min} to ${max} characters.`;
    }
  }

  if (typeof body.status !== 'string' || !ALLOWED_STATUSES.includes(body.status.trim())) {
    return 'Status must be Pending, In progress or Completed.';
  }
  return null;
}

function cleanRecord(body) {
  return {
    title: body.title.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    status: body.status.trim()
  };
}

// GET /api/records - list every record
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, title, category, description, status FROM records ORDER BY id ASC'
    );
    res.status(200).json(result.rows.map(row => ({ ...row, id: Number(row.id) })));
  } catch (error) { next(error); }
});

// GET /api/records/:id - retrieve one record
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });
    const result = await pool.query(
      'SELECT id, title, category, description, status FROM records WHERE id = $1', [id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    res.status(200).json({ ...result.rows[0], id: Number(result.rows[0].id) });
  } catch (error) { next(error); }
});

// POST /api/records - create a record; the database generates its ID
router.post('/', async (req, res, next) => {
  try {
    const problem = validateRecord(req.body);
    if (problem) return res.status(400).json({ message: problem });
    const record = cleanRecord(req.body);
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category, description, status`,
      [record.title, record.category, record.description, record.status]
    );
    res.status(201).json({ ...result.rows[0], id: Number(result.rows[0].id) });
  } catch (error) { next(error); }
});

// PUT /api/records/:id - replace all four editable fields
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });
    const problem = validateRecord(req.body);
    if (problem) return res.status(400).json({ message: problem });
    const record = cleanRecord(req.body);
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, category, description, status`,
      [record.title, record.category, record.description, record.status, id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    res.status(200).json({ ...result.rows[0], id: Number(result.rows[0].id) });
  } catch (error) { next(error); }
});

// DELETE /api/records/:id - remove one record
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });
    const result = await pool.query('DELETE FROM records WHERE id = $1 RETURNING id', [id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    res.status(200).json({ message: 'Record deleted.' });
  } catch (error) { next(error); }
});

module.exports = router;
