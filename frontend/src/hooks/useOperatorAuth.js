import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { operatorApi } from '../services/api';

export function useOperatorAuth() {
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('operatorToken');
    if (!token) {
      setLoading(false);
      return;
    }

    operatorApi.get('/api/auth/operator/me')
      .then(res => {
        setOperator(res.data);
      })
      .catch(err => {
        console.error('Failed to authenticate operator', err);
        localStorage.removeItem('operatorToken');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem('operatorToken');
    setOperator(null);
    navigate('/login');
  };

  return { 
    operator, 
    loading, 
    logout, 
    isAdmin: operator?.role === 'admin' 
  };
}
