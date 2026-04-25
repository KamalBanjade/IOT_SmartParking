import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../services/api';

export function useCustomerAuth() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      setLoading(false);
      return;
    }

    portalApi.getProfile()
      .then(res => {
        setCustomer(res.data);
      })
      .catch(err => {
        console.error('Failed to authenticate customer', err);
        localStorage.removeItem('customerToken');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem('customerToken');
    setCustomer(null);
    navigate('/portal/login');
  };

  return { 
    customer, 
    loading, 
    logout
  };
}
