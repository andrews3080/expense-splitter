// ConfirmContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, resolve } or null

  // Returns a Promise — lets calling code use: const ok = await confirm("...")
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ message, resolve });
    });
  }, []);

  const handleChoice = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>{dialog.message}</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => handleChoice(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleChoice(true)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}