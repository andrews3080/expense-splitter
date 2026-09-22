// ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Wrap the whole app with this — any component inside can call useToast()
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // useCallback here just avoids recreating this function on every render —
  // not strictly required, but good habit for functions passed down via context
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now(); // simple unique-enough id for this use case
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// The hook every component actually uses: const showToast = useToast();
export function useToast() {
  return useContext(ToastContext);
}