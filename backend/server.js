// server.js
require('dotenv').config();
const express = require('express');
const pool = require('./config/db');
const cors = require('cors');

const app = express();
app.use(cors());

// Needed so Express can read JSON sent in a request body
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Server is working' });
});

// Create a new group
app.post('/api/groups', async (req, res) => {
  try {
    const { name } = req.body;

    // Basic validation — don't hit the DB with bad input
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // $1 is a placeholder — pg safely inserts the value, preventing SQL injection
    const result = await pool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING *',
      [name]
    );

    // RETURNING * gives us back the row that was just created, including its new id
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Add a member to a group
app.post('/api/groups/:id/members', async (req, res) => {
  try {
    const { id } = req.params; // the group id, from the URL
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Insert the user, or if the email already exists, just update the name
    // and return that existing user instead of creating a duplicate
    const userResult = await pool.query(
      `INSERT INTO users (name, email) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [name, email]
    );
    const user = userResult.rows[0];

    // Link the user to the group — ON CONFLICT DO NOTHING means
    // it won't error if they're already a member
    await pool.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, user.id]
    );

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Add an expense with an even split across given users
app.post('/api/expenses', async (req, res) => {
  const { groupId, payerId, amount, description, splitAmongUserIds } = req.body;

  if (!groupId || !payerId || !amount || !splitAmongUserIds?.length) {
    return res.status(400).json({
      error: 'groupId, payerId, amount, and splitAmongUserIds are required'
    });
  }

  // Get a single dedicated client from the pool for this transaction —
  // all queries in a transaction must run on the SAME connection
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // start the transaction

    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, payer_id, amount, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [groupId, payerId, amount, description]
    );
    const expense = expenseResult.rows[0];

    const shareAmount = (amount / splitAmongUserIds.length).toFixed(2);

    // Sequential awaits here (not Promise.all) — on a single client,
    // queries must run one at a time anyway
    for (const userId of splitAmongUserIds) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, share_amount)
         VALUES ($1, $2, $3)`,
        [expense.id, userId, shareAmount]
      );
    }

    await client.query('COMMIT'); // all inserts succeeded — make it permanent
    res.status(201).json({ expense, splitAmong: splitAmongUserIds, shareAmount });

  } catch (err) {
    await client.query('ROLLBACK'); // any failure — undo everything from this transaction
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });

  } finally {
    client.release(); // always give the connection back to the pool
  }
});


// Get each member's net balance in a group
app.get('/api/groups/:id/balances', async (req, res) => {
  try {
    const { id } = req.params;

    // For each user in the group: sum what they paid, minus sum of their splits
    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         COALESCE(paid.total, 0) - COALESCE(owed.total, 0) AS balance
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id AND gm.group_id = $1

       -- total this user paid out across all expenses in this group
       LEFT JOIN (
         SELECT payer_id, SUM(amount) AS total
         FROM expenses
         WHERE group_id = $1
         GROUP BY payer_id
       ) paid ON paid.payer_id = u.id

       -- total this user owes across all their splits in this group
       LEFT JOIN (
         SELECT es.user_id, SUM(es.share_amount) AS total
         FROM expense_splits es
         JOIN expenses e ON e.id = es.expense_id
         WHERE e.group_id = $1
         GROUP BY es.user_id
       ) owed ON owed.user_id = u.id`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Get a minimal list of payments needed to settle all balances in a group
app.get('/api/groups/:id/settlements', async (req, res) => {
  try {
    const { id } = req.params;

    // Reuse the same balance calculation as /balances
    const balanceResult = await pool.query(
      `SELECT
         u.id,
         u.name,
         COALESCE(paid.total, 0) - COALESCE(owed.total, 0) AS balance
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id AND gm.group_id = $1
       LEFT JOIN (
         SELECT payer_id, SUM(amount) AS total
         FROM expenses WHERE group_id = $1 GROUP BY payer_id
       ) paid ON paid.payer_id = u.id
       LEFT JOIN (
         SELECT es.user_id, SUM(es.share_amount) AS total
         FROM expense_splits es
         JOIN expenses e ON e.id = es.expense_id
         WHERE e.group_id = $1 GROUP BY es.user_id
       ) owed ON owed.user_id = u.id`,
      [id]
    );

    // Split into creditors (owed money) and debtors (owe money)
    const creditors = [];
    const debtors = [];

    for (const row of balanceResult.rows) {
      const balance = parseFloat(row.balance);
      if (balance > 0.01) creditors.push({ id: row.id, name: row.name, amount: balance });
      else if (balance < -0.01) debtors.push({ id: row.id, name: row.name, amount: -balance });
    }

    // Greedy matching: pair the largest debtor with the largest creditor
    // repeatedly, until everyone is settled
    const settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const payment = Math.min(debtors[i].amount, creditors[j].amount);

      settlements.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: parseFloat(payment.toFixed(2))
      });

      debtors[i].amount -= payment;
      creditors[j].amount -= payment;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    res.json(settlements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate settlements' });
  }
});

// Get all expenses for a group, most recent first
app.get('/api/groups/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         e.id,
         e.amount,
         e.description,
         e.created_at,
         u.name AS paid_by
       FROM expenses e
       JOIN users u ON u.id = e.payer_id
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expense history' });
  }
});

// Get all members of a group
app.get('/api/groups/:id/members', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get all groups, with member count for each
app.get('/api/groups', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         g.id,
         g.name,
         g.created_at,
         COUNT(gm.user_id) AS member_count
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});


// Delete a single expense (its splits go with it, via ON DELETE CASCADE)
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Delete an entire group (members, expenses, splits all cascade)
app.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM groups WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});