// pages/Dashboard.jsx
import { useOutletContext } from "react-router-dom";

function Dashboard(){
  const{ members, expenses, balances, settlements } = useOutletContext();
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const biggestBalance = balances.reduce(
    (max, b) => (Math.abs(Number(b.balance)) > Math.abs(max) ? Number(b.balance) : max),
    0
  );


  return (
    <>
      <div className="main-header">
        <h1>Group overview</h1>
        <p>Here's where things stand for this group.</p>
      </div>

      <div className="stats">
        <div className="stat-card green">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Members</div>
          <div className="stat-value">{members.length}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Largest Balance</div>
          <div className="stat-value">${Math.abs(biggestBalance).toFixed(2)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Settled Up</div>
          <div className="stat-value">{settlements.length === 0 ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <h2>Recent Transactions</h2>
          <table className="history-table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Paid by</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.created_at).toLocaleDateString()}</td>
                  <td>{e.description}</td>
                  <td>{e.paid_by}</td>
                  <td>${e.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="card">
            <h2>Group Balances</h2>
            {balances.map(b => {
              const value = Number(b.balance);
              const isCredit = value >= 0;
              return (
                <div className="balance-row" key={b.id}>
                  <span>{b.name}</span>
                  <span className={`balance-amount ${isCredit ? 'credit' : 'debit'}`}>
                    {isCredit ? '+' : '-'}${Math.abs(value).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="card">
            <h2>Settle Up</h2>
            {settlements.length === 0 ? (
              <p className="empty-note">Everyone is settled up.</p>
            ) : (
              settlements.map((s, i) => (
                <div className="settlement-row" key={i}>
                  {s.from} pays {s.to} <strong>${s.amount}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;