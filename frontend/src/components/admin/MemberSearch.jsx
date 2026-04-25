import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../services/api';

export default function MemberSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      usersApi.search(query).then(res => setResults(res.data)).catch(console.error);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5 mb-8">
      <h3 className="text-sm font-medium text-text-primary mb-4">Member Search</h3>
      <input
        type="text"
        placeholder="Search members by name or phone..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-bg-base border border-bg-border rounded-lg h-10 px-3 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors mb-4"
      />

      {results.length > 0 && (
        <div className="overflow-x-auto border border-bg-elevated rounded-lg">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-bg-base">
                <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-text-muted">Name</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-text-muted">Phone</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-text-muted">Points</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-text-muted">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {results.map((user) => (
                <tr 
                  key={user.id} 
                  onClick={() => navigate(`/member/${user.id}`)}
                  className="border-t border-bg-elevated hover:bg-bg-elevated/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.phone}</td>
                  <td className="px-4 py-3 text-sm font-bold text-amber-400">★ {user.total_points}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {user.last_visit ? new Date(user.last_visit).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
