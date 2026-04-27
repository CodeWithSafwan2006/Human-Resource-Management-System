import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'https://human-resource-management-system-1rfq.onrender.com/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('hrms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;