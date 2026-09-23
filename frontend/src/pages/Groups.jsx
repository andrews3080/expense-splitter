// pages/Groups.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { useConfirm } from '../ConfirmContext';


const API_BASE = import.meta.env.VITE_API_BASE;

function Groups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const showToast = useToast();
  const confirm = useConfirm();



  const loadGroups = () => {
    fetch(`${API_BASE}/groups`)
      .then(res => res.json())
      .then(setGroups)
      .catch(err => console.error('Failed to load groups:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create group');
      const newGroup = await res.json();
      setName('');
      loadGroups();
      showToast(`"${newGroup.name}" created`);
      navigate(`/groups/${newGroup.id}`); // jump straight into the new group
    } catch (err) {
      console.error(err);
      showToast('Failed to create group', 'error');
    }
  };

  
const handleDelete = async (e, id, name) => {
  e.stopPropagation(); // prevent the row's onClick (navigate) from also firing
  const confirmed = await confirm(`Delete "${name}" and everything in it? This can't be undone.`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    loadGroups();
    showToast('Group deleted');
  } catch (err) {
    console.error(err);
    showToast('Failed to delete group', 'error');
  }
};



  return (
    <>
      <div className="main-header">
        <h1>My Groups</h1>
        <p>Select a group or create a new one.</p>
      </div>

      <div className="card">
        <h2>Create a Group</h2>
        <form className="expense-form" onSubmit={handleCreate}>
          <input
            placeholder="Group name (e.g. Roommates, Weekend Trip)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button type="submit">Create group</button>
        </form>
      </div>

      <div className="card">
        <h2>Your Groups</h2>
        {loading ? (
            <div className="card">
                <div className="skeleton skel-row" />
                <div className="skeleton skel-row" />
            </div>
        ) : groups.length === 0 ? (
          <p className="empty-note">No groups yet — create one above.</p>
        ) : (
          <ul className="group-list">
            {groups.map(g => (
              <li key={g.id} onClick={() => navigate(`/groups/${g.id}`)}>
                <div>
                    <span className="group-name">{g.name}  </span>
                    <span className="group-meta">{g.member_count} member{g.member_count == 1 ? '' : 's'}</span>
                </div>
                <button
                    className= "icon-btn delete"
                    onClick = {(e)=> handleDelete(e, g.id, g.name)}
                    title= "Delete group" 
                >
                     x   
                </button>    
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default Groups;