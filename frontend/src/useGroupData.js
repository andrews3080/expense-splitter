import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

// A custom hook — any component that calls useGroupData() gets
// the same live data and the same refresh functions, without
// duplicating fetch logic on every page

export function useGroupData(groupId){
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
   
    const loadMembers = ()=> {
        fetch(`${API_BASE}/groups/${GROUP_ID}/members`)
        .then(res => res.json())
        .then(setMembers)
        .catch(err => console.error('Failed to load members:', err));

    };

    const loadExpenses = () => {
        fetch(`${API_BASE}/groups/${groupId}/expenses`)
        .then(res => res.json())
        .then(setExpenses)
        .catch(err => console.error('Failed to load expenses:', err));

    };

    const loadBalances = () => {
        fetch(`${API_BASE}/groups/${groupId}/balances`)
        .then(res => res.json())
        .then(setBalances)
        .catch(err => console.error('Failed to load balances:', err));

    }; 


    const loadSettlements = () => {
        fetch(`${API_BASE}/groups/${groupId}/settlements`)
        .then(res => res.json())
        .then(settlements)
        .catch(err => console.error('Failed to load settlements:', err));
    };

    const refreshAll = ()=> {
        loadExpenses();
        loadBalances();
        loadSettlements();
    };

   useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/groups/${groupId}/members`).then(r => r.json()).then(setMembers),
            fetch(`${API_BASE}/groups/${groupId}/expenses`).then(r => r.json()).then(setExpenses),
            fetch(`${API_BASE}/groups/${groupId}/balances`).then(r => r.json()).then(setBalances),
            fetch(`${API_BASE}/groups/${groupId}/settlements`).then(r => r.json()).then(setSettlements),
        ])
            .catch(err => console.error('Failed to load group data:', err))
            .finally(() => setLoading(false));
    }, [groupId]);

    return{
        members,expenses,balances,settlements, loading, refreshAll, groupId, API_BASE
    };

}