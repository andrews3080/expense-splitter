// pages/Transactions.jsx
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { useConfirm } from '../ConfirmContext';


function Transactions() {
  const { expenses, API_BASE, refreshAll } = useOutletContext();
  const showToast = useToast();
  const confirm = useConfirm();

  const handleDelete = async (id, description) => {
    const confirmed = await confirm(`Delete "${description}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      refreshAll();
      showToast('Expense deleted');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete expense', 'error');
    }
  };

  return (
    <>
      <div className="main-header">
        <h1>Transactions</h1>
        <p>Full expense history for this group.</p>
      </div>
      <div className="card">
        {expenses.length === 0 ? (
          <p className="empty-note">No expenses logged yet.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Paid by</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.created_at).toLocaleDateString()}</td>
                  <td>{e.description}</td>
                  <td>{e.paid_by}</td>
                  <td>${e.amount}</td>
                  <td>
                    <button
                      className="icon-btn delete"
                      onClick={() => handleDelete(e.id, e.description)}
                      title="Delete expense"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default Transactions;