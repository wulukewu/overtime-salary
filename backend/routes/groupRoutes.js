const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database');
const authenticate = require('../auth');

// Get all groups for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await all(
      'SELECT * FROM groups WHERE user_id = ? ORDER BY sort_order ASC',
      [req.userId]
    );
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// Create a new group
router.post('/', authenticate, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    // Get the highest sort_order
    const lastGroup = await get(
      'SELECT sort_order FROM groups WHERE user_id = ? ORDER BY sort_order DESC LIMIT 1',
      [req.userId]
    );
    const nextSortOrder = (lastGroup?.sort_order || 0) + 1;

    const result = await run(
      'INSERT INTO groups (user_id, name, sort_order) VALUES (?, ?, ?)',
      [req.userId, name, nextSortOrder]
    );

    res.status(201).json({
      id: result.lastID,
      name,
      sort_order: nextSortOrder,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Error creating group' });
  }
});

// Update group
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, collapsed } = req.body;

  try {
    // Verify group belongs to user
    const group = await get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (collapsed !== undefined) {
      updates.push('collapsed = ?');
      values.push(collapsed ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    values.push(id);
    await run(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Error updating group' });
  }
});

// Update group sort order
router.put('/:id/sort', authenticate, async (req, res) => {
  const { id } = req.params;
  const { sort_order } = req.body;

  if (sort_order === undefined) {
    return res.status(400).json({ error: 'Sort order is required' });
  }

  try {
    // Verify group belongs to user
    const group = await get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Start a transaction
    await run('BEGIN TRANSACTION');

    try {
      // Update the sort order of the moved group
      await run('UPDATE groups SET sort_order = ? WHERE id = ?', [
        sort_order,
        id,
      ]);

      // Update other groups' sort orders
      if (sort_order > group.sort_order) {
        // Moving down
        await run(
          'UPDATE groups SET sort_order = sort_order - 1 WHERE user_id = ? AND sort_order > ? AND sort_order <= ? AND id != ?',
          [req.userId, group.sort_order, sort_order, id]
        );
      } else {
        // Moving up
        await run(
          'UPDATE groups SET sort_order = sort_order + 1 WHERE user_id = ? AND sort_order >= ? AND sort_order < ? AND id != ?',
          [req.userId, sort_order, group.sort_order, id]
        );
      }

      await run('COMMIT');
      res.json({ message: 'Group sort order updated successfully' });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating group sort order:', error);
    res.status(500).json({ error: 'Error updating group sort order' });
  }
});

// Delete a group
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify group belongs to user
    const group = await get(
      'SELECT * FROM groups WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Start a transaction
    await run('BEGIN TRANSACTION');

    try {
      // Delete the group
      await run('DELETE FROM groups WHERE id = ?', [id]);

      // Update sort orders of remaining groups
      await run(
        'UPDATE groups SET sort_order = sort_order - 1 WHERE user_id = ? AND sort_order > ?',
        [req.userId, group.sort_order]
      );

      await run('COMMIT');
      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Error deleting group' });
  }
});

// Get ungrouped collapsed state for the authenticated user
router.get('/ungrouped-collapsed', authenticate, async (req, res) => {
  try {
    const user = await get(
      'SELECT ungrouped_collapsed FROM users WHERE id = ?',
      [req.userId]
    );
    res.json({ ungrouped_collapsed: !!user.ungrouped_collapsed });
  } catch (error) {
    console.error('Error fetching ungrouped collapsed state:', error);
    res.status(500).json({ error: 'Error fetching ungrouped collapsed state' });
  }
});

// Update ungrouped collapsed state for the authenticated user
router.put('/ungrouped-collapsed', authenticate, async (req, res) => {
  const { collapsed } = req.body;
  if (collapsed === undefined) {
    return res.status(400).json({ error: 'Collapsed state is required' });
  }
  try {
    await run('UPDATE users SET ungrouped_collapsed = ? WHERE id = ?', [
      collapsed ? 1 : 0,
      req.userId,
    ]);
    res.json({ message: 'Ungrouped collapsed state updated successfully' });
  } catch (error) {
    console.error('Error updating ungrouped collapsed state:', error);
    res.status(500).json({ error: 'Error updating ungrouped collapsed state' });
  }
});

module.exports = router;
