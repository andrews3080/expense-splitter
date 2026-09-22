// pages/Members.jsx
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../ToastContext';


function Members() {
  const { members, groupId, API_BASE, refreshAll } = useOutletContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const showToast = useToast();

  const initials = (n) => n?.charAt(0).toUpperCase() || '?';

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email) {
      setError('Name and email are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error('Failed to add member');
      setName('');
      setEmail('');
      refreshAll();
      showToast(`${name} added to the group`);
    } catch (err) {
      console.error(err);
      setError('Something went wrong adding that member.');
    }
  };

  return (
    <>
      <div className="main-header">
        <h1>Members</h1>
        <p>Everyone in this group.</p>
      </div>

      <div className="card">
        <h2>Add a Member</h2>
        {error && <div className="form-error">{error}</div>}
        <form className="expense-form" onSubmit={handleAdd}>
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit">Add member</button>
        </form>
      </div>

      <div className="card">
        <h2>Current Members</h2>
        {members.length === 0 ? (
          <p className="empty-note">No members yet.</p>
        ) : (
          <ul className="members">
            {members.map(m => (
              <li key={m.id}>
                <span className="avatar">{initials(m.name)}</span>
                {m.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default Members;