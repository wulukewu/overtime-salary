const express = require('express');
const router = express.Router();
const { all, get, run } = require('./database');
const calculateOvertimePay = require('./overtimeCalculator');
const authenticate = require('./auth');
const multer = require('multer');
const csv = require('csv-parse');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Get all overtime records for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const records = await all(
      `SELECT r.*, g.name as group_name 
       FROM overtime_records r 
       LEFT JOIN groups g ON r.group_id = g.id 
       WHERE r.user_id = ? 
       ORDER BY r.group_id, r.sort_order ASC, r.date DESC`,
      [userId]
    );
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Create a new overtime record
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, salary, end_hour, minutes, calculated_pay, group_id } =
      req.body;
    const userId = req.userId;

    // Validate required fields
    if (
      !date ||
      !salary ||
      !end_hour ||
      minutes === undefined ||
      !calculated_pay
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate end_hour and minutes
    if (end_hour < 19) {
      return res.status(400).json({ error: 'End hour must be 19 or later' });
    }
    if (minutes < 0 || minutes > 59) {
      return res
        .status(400)
        .json({ error: 'Minutes must be between 0 and 59' });
    }

    // If group_id is provided, verify it belongs to the user
    if (group_id) {
      const group = await get(
        'SELECT * FROM groups WHERE id = ? AND user_id = ?',
        [group_id, userId]
      );
      if (!group) {
        return res.status(400).json({ error: 'Invalid group' });
      }
    }

    const result = await run(
      'INSERT INTO overtime_records (user_id, group_id, date, salary, end_hour, minutes, calculated_pay) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, group_id, date, salary, end_hour, minutes, calculated_pay]
    );

    res.status(201).json({
      id: result.lastID,
      date,
      salary,
      end_hour,
      minutes,
      calculated_pay,
      group_id,
    });
  } catch (error) {
    console.error('Error saving record:', error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// Calculate overtime pay
router.post('/calculate', (req, res) => {
  const { salary, end_hour, minutes } = req.body;

  if (!salary || !end_hour || minutes === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate end_hour and minutes
  if (end_hour < 19) {
    return res.status(400).json({ error: 'End hour must be 19 or later' });
  }
  if (minutes < 0 || minutes > 59) {
    return res.status(400).json({ error: 'Minutes must be between 0 and 59' });
  }

  const result = calculateOvertimePay(salary, end_hour, minutes);
  res.json({ result });
});

// Delete an overtime record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // First verify the record belongs to the user
    const record = await get(
      'SELECT * FROM overtime_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Delete the record
    await run('DELETE FROM overtime_records WHERE id = ?', [id]);
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Update an overtime record
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const {
    date,
    salary,
    end_hour,
    minutes,
    calculated_pay,
    group_id,
    sort_order,
  } = req.body;
  const userId = req.userId;

  console.log('Updating record:', {
    id,
    userId,
    group_id,
    sort_order,
    body: req.body,
  });

  try {
    // Validate required fields
    if (
      !date ||
      salary === undefined ||
      end_hour === undefined ||
      minutes === undefined ||
      calculated_pay === undefined
    ) {
      console.log('Missing required fields:', {
        date,
        salary,
        end_hour,
        minutes,
        calculated_pay,
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the record exists and belongs to the user
    const record = await get(
      'SELECT * FROM overtime_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      console.log('Record not found:', { id, userId });
      return res.status(404).json({ error: 'Record not found' });
    }

    // If group_id is provided, validate it belongs to the user
    if (group_id !== undefined) {
      const group = await get(
        'SELECT * FROM groups WHERE id = ? AND user_id = ?',
        [group_id, userId]
      );
      if (!group && group_id !== null) {
        console.log('Invalid group:', { group_id, userId });
        return res.status(400).json({ error: 'Invalid group' });
      }
    }

    // Start a transaction
    await run('BEGIN TRANSACTION');

    try {
      // If sort_order is provided, update the sort order for all records in the group
      if (sort_order !== undefined) {
        const currentGroupId =
          group_id !== undefined ? group_id : record.group_id;
        // Get all records in the group, ordered by sort_order
        const groupRecords = await all(
          'SELECT id FROM overtime_records WHERE group_id = ? AND user_id = ? ORDER BY sort_order ASC',
          [currentGroupId, userId]
        );
        // Remove the moved record from the array
        const movingIndex = groupRecords.findIndex(
          (r) => r.id === parseInt(id)
        );
        const [movedRecord] = groupRecords.splice(movingIndex, 1);
        // Insert it at the new index
        groupRecords.splice(sort_order, 0, movedRecord);
        // Update sort_order for all records in the group
        for (let i = 0; i < groupRecords.length; i++) {
          await run(
            'UPDATE overtime_records SET sort_order = ? WHERE id = ? AND user_id = ?',
            [i, groupRecords[i].id, userId]
          );
        }
      }

      // Update the record
      console.log('Updating record:', {
        id,
        date,
        salary,
        end_hour,
        minutes,
        calculated_pay,
        group_id,
      });

      await run(
        `UPDATE overtime_records 
         SET date = ?, salary = ?, end_hour = ?, minutes = ?, 
             calculated_pay = ?, group_id = ?
         WHERE id = ? AND user_id = ?`,
        [date, salary, end_hour, minutes, calculated_pay, group_id, id, userId]
      );

      await run('COMMIT');
      res.json({ message: 'Record updated successfully' });
    } catch (error) {
      console.error('Transaction error:', error);
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Export all records to CSV
router.get('/export-csv', authenticate, async (req, res) => {
  try {
    const records = await all(
      `SELECT r.*, g.name as group_name 
       FROM overtime_records r 
       LEFT JOIN groups g ON r.group_id = g.id 
       WHERE r.user_id = ? 
       ORDER BY r.date DESC`,
      [req.userId]
    );

    const csvWriter = createObjectCsvWriter({
      path: 'temp_export.csv',
      header: [
        { id: 'date', title: 'Date' },
        { id: 'salary', title: 'Salary' },
        { id: 'end_hour', title: 'End Hour' },
        { id: 'minutes', title: 'Minutes' },
        { id: 'calculated_pay', title: 'Calculated Pay' },
        { id: 'group_name', title: 'Group' },
      ],
    });

    await csvWriter.writeRecords(records);

    res.download('temp_export.csv', 'overtime_records.csv', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up the temporary file
      fs.unlinkSync('temp_export.csv');
    });
  } catch (error) {
    console.error('Error exporting records:', error);
    res.status(500).json({ error: 'Failed to export records' });
  }
});

// Import records from CSV
router.post(
  '/import-csv',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let records = [];

    // First, read all records into memory
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(
          csv.parse({
            columns: true,
            trim: true,
            skip_empty_lines: true,
            // Convert column names to lowercase and replace spaces with underscores
            columns: (headers) =>
              headers.map((header) =>
                header.toLowerCase().replace(/\s+/g, '_')
              ),
          })
        )
        .on('data', (data) => {
          records.push(data);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    console.log('Parsed records:', records);

    // Process each record
    for (const data of records) {
      try {
        console.log('Processing record:', data);

        // Validate required fields
        if (
          !data.date ||
          !data.salary ||
          !data.end_hour ||
          data.minutes === undefined
        ) {
          errors.push({
            row: data,
            error:
              'Missing required fields. Required: date, salary, end_hour, minutes',
          });
          continue;
        }

        // Validate data types and ranges
        const salary = parseFloat(data.salary);
        const endHour = parseInt(data.end_hour);
        const minutes = parseInt(data.minutes);

        console.log('Parsed values:', { salary, endHour, minutes });

        if (isNaN(salary) || salary <= 0) {
          errors.push({ row: data, error: 'Invalid salary value' });
          continue;
        }

        if (isNaN(endHour) || endHour < 19) {
          errors.push({ row: data, error: 'End hour must be 19 or later' });
          continue;
        }

        if (isNaN(minutes) || minutes < 0 || minutes > 59) {
          errors.push({ row: data, error: 'Minutes must be between 0 and 59' });
          continue;
        }

        // Calculate overtime pay
        const calculatedPay = calculateOvertimePay(salary, endHour, minutes);

        // Handle group if provided
        let groupId = null;
        if (data.group && data.group.trim()) {
          const group = await get(
            'SELECT id FROM groups WHERE name = ? AND user_id = ?',
            [data.group.trim(), req.userId]
          );
          if (group) {
            groupId = group.id;
          } else {
            // Create new group if it doesn't exist
            const result = await run(
              'INSERT INTO groups (user_id, name) VALUES (?, ?)',
              [req.userId, data.group.trim()]
            );
            groupId = result.lastID;
          }
        }

        // Insert record into database
        const result = await run(
          'INSERT INTO overtime_records (user_id, date, salary, end_hour, minutes, calculated_pay, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            req.userId,
            data.date,
            salary,
            endHour,
            minutes,
            calculatedPay,
            groupId,
          ]
        );
        results.push(result);
        console.log('Successfully imported record:', data);
      } catch (error) {
        console.error('Error processing record:', error);
        errors.push({ row: data, error: error.message });
      }
    }

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      imported: results.length,
      errors: errors,
    });
  }
);

// Get CSV template
router.get('/csv-template', authenticate, (req, res) => {
  const templatePath = path.join(
    __dirname,
    'templates',
    'overtime_template.csv'
  );

  // Check if template file exists
  if (!fs.existsSync(templatePath)) {
    console.error('Template file not found at:', templatePath);
    return res.status(500).json({ error: 'Template file not found' });
  }

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=overtime_template.csv'
  );

  // Stream the file to the response
  const fileStream = fs.createReadStream(templatePath);
  fileStream.pipe(res);

  // Handle errors
  fileStream.on('error', (error) => {
    console.error('Error streaming template file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to send template file' });
    }
  });
});

module.exports = router;
