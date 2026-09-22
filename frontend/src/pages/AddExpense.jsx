// pages/AddExpense.jsx
import { useState } from 'react';
import { useNavigate, useOutletContext} from 'react-router-dom';
import { useToast } from '../ToastContext';


function AddExpense() {
  const { members, groupId, API_BASE, refreshAll } = useOutletContext();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitAmong, setSplitAmong] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const showToast = useToast();


  const toggleSplit = (userId) => {
    setSplitAmong(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description || !amount || !payerId || splitAmong.length === 0) {
      setError('Please fill in all fields and select at least one person to split with.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          payerId: Number(payerId),
          amount: Number(amount),
          description,
          splitAmongUserIds: splitAmong,
        }),
      });
      if (!res.ok) throw new Error('Failed to add expense');

      refreshAll();
      showToast('Expense added');
      navigate(`/groups/${groupId}`); // back to dashboard, where the new expense + updated balances are visible
    } catch (err) {
      console.error(err);
      setError('Something went wrong adding the expense. Try again.');
    }
  };

  return (
    <>
      <div className="main-header">
        <h1>Add Expense</h1>
        <p>Log a new shared cost.</p>
      </div>
      <div className="card">
        {error && <div className="form-error">{error}</div>}
        <form className="expense-form" onSubmit={handleSubmit}>
          <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <select value={payerId} onChange={e => setPayerId(e.target.value)}>
            <option value="">Who paid?</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="split-row">
            {members.map(m => (
              <label key={m.id}>
                <input type="checkbox" checked={splitAmong.includes(m.id)} onChange={() => toggleSplit(m.id)} />
                {m.name}
              </label>
            ))}
          </div>
          <button type="submit">Add expense</button>
        </form>
      </div>
    </>
  );
}

export default AddExpense;