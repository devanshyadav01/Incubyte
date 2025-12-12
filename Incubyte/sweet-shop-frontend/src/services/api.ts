import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export interface User {
    id: number;
    email: string;
    isAdmin: boolean;
}

export interface Sweet {
    id: number;
    name: string;
    category: string;
    price: number;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

// Auth APIs
export const authAPI = {
    register: (email: string, password: string) =>
        api.post('/auth/register', { email, password }),

    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password })
};

// Sweets APIs
export const sweetsAPI = {
    getAll: () => api.get('/sweets'),

    search: (params: { name?: string; category?: string; minPrice?: number; maxPrice?: number }) =>
        api.get('/sweets/search', { params }),

    add: (sweet: Omit<Sweet, 'id' | 'createdAt' | 'updatedAt'>) =>
        api.post('/sweets', sweet),

    update: (id: number, updates: Partial<Sweet>) =>
        api.put(`/sweets/${id}`, updates),

    delete: (id: number) =>
        api.delete(`/sweets/${id}`),

    purchase: (id: number, quantity: number = 1) =>
        api.post(`/sweets/${id}/purchase`, { quantity }),

    restock: (id: number, quantity: number) =>
        api.post(`/sweets/${id}/restock`, { quantity })
};

export default api;
