// components/Sidebar.jsx
import { NavLink, Link } from 'react-router-dom';

function Sidebar({ groupId }) {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand-link">
        <div className="brand">Expense<span>Splitter</span></div>
      </Link>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          My Groups
        </NavLink>
        {groupId && (
          <>
            <NavLink to={`/groups/${groupId}`} end className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
            <NavLink to={`/groups/${groupId}/members`} className={({ isActive }) => isActive ? 'active' : ''}>
              Members
            </NavLink>
            <NavLink to={`/groups/${groupId}/add-expense`} className={({ isActive }) => isActive ? 'active' : ''}>
              Add Expense
            </NavLink>
            <NavLink to={`/groups/${groupId}/transactions`} className={({ isActive }) => isActive ? 'active' : ''}>
              Transactions
            </NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        Split expenses.<br />Keep friendships.
      </div>
    </aside>
  );
}

export default Sidebar;