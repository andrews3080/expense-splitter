// components/Skeletons.jsx

// Matches the Dashboard: stat cards row + two-column card layout
export function DashboardSkeleton() {
  return (
    <>
      <div className="skeleton skel-title" />
      <div className="stats">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skel-stat-card" />)}
      </div>
      <div className="content-grid">
        <div className="card">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skel-row" />)}
        </div>
        <div>
          <div className="card">
            {[1, 2].map(i => <div key={i} className="skeleton skel-row" />)}
          </div>
          <div className="card">
            <div className="skeleton skel-line" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    </>
  );
}

// Matches Members: a row of chip-shaped placeholders
export function MembersSkeleton() {
  return (
    <div className="card">
      {[1, 2, 3].map(i => <span key={i} className="skeleton skel-chip" />)}
    </div>
  );
}

// Matches Transactions: a stack of table-row-shaped bars
export function TransactionsSkeleton() {
  return (
    <div className="card">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skel-row" />)}
    </div>
  );
}