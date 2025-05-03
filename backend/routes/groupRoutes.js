const express = require('express');
const router = express.Router();
const db = require('../database');
const authenticate = require('../middleware/auth');

// Get all groups for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await db.all(
      'SELECT * FROM groups WHERE user_id = ? ORDER BY sort_order ASC',
      [req.userId]
    );
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create a new group
router.post('/', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Get the highest sort_order
    const maxOrder = await db.get(
      'SELECT MAX(sort_order) as maxOrder FROM groups WHERE user_id = ?',
      [req.userId]
    );
    const newOrder = (maxOrder?.maxOrder || 0) + 1;

    const result = await db.run(
      'INSERT INTO groups (user_id, name, sort_order) VALUES (?, ?, ?)',
      [req.userId, name, newOrder]
    );

    res.status(201).json({
      id: result.lastID,
      name,
      sort_order: newOrder,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update a group
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;

    // Verify the group belongs to the user
    const group = await db.get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (name) {
      await db.run('UPDATE groups SET name = ? WHERE id = ?', [name, id]);
    }

    if (sort_order !== undefined) {
      await db.run('UPDATE groups SET sort_order = ? WHERE id = ?', [
        sort_order,
        id,
      ]);
    }

    res.json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete a group
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the group belongs to the user
    const group = await db.get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Move all records to the default group (null)
    await db.run(
      'UPDATE overtime_records SET group_id = NULL WHERE group_id = ?',
      [id]
    );

    // Delete the group
    await db.run('DELETE FROM groups WHERE id = ?', [id]);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

module.exports = router;
