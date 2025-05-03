const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database');
const authenticate = require('../auth');

// Get all groups for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await all(
      'SELECT g.*, COUNT(r.id) as record_count ' +
        'FROM groups g ' +
        'LEFT JOIN overtime_records r ON g.id = r.group_id ' +
        'WHERE g.user_id = ? ' +
        'GROUP BY g.id ' +
        'ORDER BY g.sort_order ASC',
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
    const maxOrder = await get(
      'SELECT MAX(sort_order) as maxOrder FROM groups WHERE user_id = ?',
      [req.userId]
    );
    const newOrder = (maxOrder?.maxOrder || 0) + 1;

    const result = await run(
      'INSERT INTO groups (user_id, name, sort_order, collapsed) VALUES (?, ?, ?, 0)',
      [req.userId, name, newOrder]
    );

    res.status(201).json({
      id: result.lastID,
      name,
      sort_order: newOrder,
      collapsed: 0,
      record_count: 0,
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
    const { name, sort_order, collapsed } = req.body;

    // Verify the group belongs to the user
    const group = await get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (name) {
      await run('UPDATE groups SET name = ? WHERE id = ?', [name, id]);
    }

    if (sort_order !== undefined) {
      await run('UPDATE groups SET sort_order = ? WHERE id = ?', [
        sort_order,
        id,
      ]);
    }

    if (collapsed !== undefined) {
      await run('UPDATE groups SET collapsed = ? WHERE id = ?', [
        collapsed ? 1 : 0,
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
    const group = await get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Move all records to the default group (null)
    await run(
      'UPDATE overtime_records SET group_id = NULL WHERE group_id = ?',
      [id]
    );

    // Delete the group
    await run('DELETE FROM groups WHERE id = ?', [id]);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

module.exports = router;
