import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return (token && storedUser) ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Optional: validate token with backend here if needed
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (email, password) => {
        try {
            const response = await api.post('/auth/register', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    const formatCurrency = (amount) => {
        const symbol = user?.currency || '€';
        const numAmount = Number(amount) || 0;

        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR', // Usamos EUR como base para el formato numérico (1.000,00)
            useGrouping: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount).replace('€', symbol); // Reemplazamos el símbolo por el del usuario
    };

    // Better simpler approach requested by user "elegir moneda" usually implies symbol.
    // Let's just assume user stores the symbol directly like '€', '$', '£'.
    const currencySymbol = user?.currency || '€';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, currencySymbol, formatCurrency }}>
            {!loading && children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);
