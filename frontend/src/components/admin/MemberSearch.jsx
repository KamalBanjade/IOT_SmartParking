import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../services/api';
import { Search, User, Phone, Star, X, ChevronRight } from 'lucide-react';

export default function MemberSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      usersApi.search(query)
        .then(res => {
          setResults(res.data);
          setIsOpen(true);
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (id) => {
    navigate(`/member/${id}`);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="glass rounded-xl border border-border flex items-center px-4 h-11 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30 transition-all">
        <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members by name or phone..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-3"
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-border shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-elevated/50 text-left transition-colors border-b border-border/50 last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {user.phone}</span>
                  {user.total_points !== undefined && (
                    <span className="flex items-center gap-1 text-pending"><Star className="w-2.5 h-2.5 fill-pending" /> {user.total_points} pts</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-border p-4 text-center z-50">
          <p className="text-sm text-[var(--text-muted)]">No members found</p>
        </div>
      )}
    </div>
  );
}
