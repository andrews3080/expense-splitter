// components/GroupLayout.jsx
import { useParams, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useGroupData } from '../useGroupData';
import { DashboardSkeleton, MembersSkeleton, TransactionsSkeleton } from './Skeletons';

function GroupLayout() {
  const { groupId } = useParams();
  const location = useLocation();
  const data = useGroupData(groupId);

  const renderSkeleton = () => {
    if (location.pathname.endsWith('/members')) return <MembersSkeleton />;
    if (location.pathname.endsWith('/transactions')) return <TransactionsSkeleton />;
    return <DashboardSkeleton />; // covers Dashboard and Add Expense (form is quick, dashboard shape is a fine fallback)
  };

  return (
    <div className="app-shell">
      <Sidebar groupId={groupId} />
      <main className="main">
        {data.loading ? renderSkeleton() : <Outlet context={data} />}
      </main>
    </div>
  );
}

export default GroupLayout;