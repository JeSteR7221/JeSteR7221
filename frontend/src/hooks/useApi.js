import { useState, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

// API instance with interceptors
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api({
        method,
        url,
        data,
        ...options,
      });
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Bir hata oluştu";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, params) => request("GET", url, null, { params }), [request]);
  const post = useCallback((url, data) => request("POST", url, data), [request]);
  const put = useCallback((url, data) => request("PUT", url, data), [request]);
  const del = useCallback((url) => request("DELETE", url), [request]);

  return { get, post, put, del, loading, error, setError };
};

// Specific API hooks
export const useBranches = () => {
  const { get, post, put, del, loading, error } = useApi();

  return {
    getBranches: () => get("/branches"),
    getBranch: (id) => get(`/branches/${id}`),
    createBranch: (data) => post("/branches", data),
    updateBranch: (id, data) => put(`/branches/${id}`, data),
    deleteBranch: (id) => del(`/branches/${id}`),
    loading,
    error,
  };
};

export const useCategories = () => {
  const { get, post, put, del, loading, error } = useApi();

  return {
    getCategories: (branchId) => get("/categories", { branch_id: branchId }),
    createCategory: (data) => post("/categories", data),
    updateCategory: (id, data) => put(`/categories/${id}`, data),
    deleteCategory: (id) => del(`/categories/${id}`),
    loading,
    error,
  };
};

export const useProducts = () => {
  const { get, post, put, del, loading, error } = useApi();

  return {
    getProducts: (params) => get("/products", params),
    getProduct: (id) => get(`/products/${id}`),
    createProduct: (data) => post("/products", data),
    updateProduct: (id, data) => put(`/products/${id}`, data),
    deleteProduct: (id) => del(`/products/${id}`),
    getTopSellers: (branchId, limit = 10) => get(`/products/top-sellers/${branchId}`, { limit }),
    loading,
    error,
  };
};

export const useTables = () => {
  const { get, post, put, del, loading, error } = useApi();

  return {
    getTables: (branchId) => get("/tables", { branch_id: branchId }),
    createTable: (data) => post("/tables", data),
    updateTable: (id, data) => put(`/tables/${id}`, data),
    deleteTable: (id) => del(`/tables/${id}`),
    loading,
    error,
  };
};

export const useOrders = () => {
  const { get, post, put, loading, error } = useApi();

  return {
    getOrders: (params) => get("/orders", params),
    getOrder: (id) => get(`/orders/${id}`),
    createOrder: (data) => post("/orders", data),
    updateOrder: (id, data) => put(`/orders/${id}`, data),
    updateOrderStatus: (id, status) => put(`/orders/${id}/status`, null, { params: { status } }),
    loading,
    error,
  };
};

export const usePayments = () => {
  const { post, loading, error } = useApi();

  return {
    processPayment: (data) => post("/payments", data),
    loading,
    error,
  };
};

export const useReports = () => {
  const { get, loading, error } = useApi();

  return {
    getDailyReport: (branchId, date) => get(`/reports/daily/${branchId}`, { date }),
    getSummaryReport: (branchId, period) => get(`/reports/summary/${branchId}`, { period }),
    getStaffReport: (branchId, dateFrom, dateTo) => get(`/reports/staff/${branchId}`, { date_from: dateFrom, date_to: dateTo }),
    loading,
    error,
  };
};

export const useSettings = () => {
  const { get, put, loading, error } = useApi();

  return {
    getSettings: () => get("/settings"),
    updateSettings: (data) => put("/settings", data),
    loading,
    error,
  };
};

export const useUsers = () => {
  const { get, put, del, loading, error } = useApi();

  return {
    getUsers: () => get("/users"),
    updateUser: (id, data) => put(`/users/${id}`, data),
    deleteUser: (id) => del(`/users/${id}`),
    loading,
    error,
  };
};

export const useQRMenu = () => {
  const { get, post, loading, error } = useApi();

  return {
    getMenu: (branchId) => get(`/qr/menu/${branchId}`),
    getTableInfo: (tableId) => get(`/qr/table/${tableId}`),
    createOrder: (data) => post("/qr/order", data),
    loading,
    error,
  };
};

export default api;
