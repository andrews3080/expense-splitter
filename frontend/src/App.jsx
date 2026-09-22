// App.jsx — wrap BrowserRouter's contents with both providers
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { ToastProvider } from './ToastContext';
import { ConfirmProvider } from './ConfirmContext';
import Sidebar from './components/Sidebar';
import Groups from './pages/Groups';
import GroupLayout from './components/GroupLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AddExpense from './pages/AddExpense';
import Transactions from './pages/Transactions';

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <div className="app-shell">
                <Sidebar />
                <main className="main"><Groups /></main>
              </div>
            } />
            <Route path="/groups/:groupId" element={<GroupLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="add-expense" element={<AddExpense />} />
              <Route path="transactions" element={<Transactions />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;