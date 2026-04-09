import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Set base URL for all axios requests
axios.defaults.baseURL = '';

const CustomerAuthContext = createContext();

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (!context) {
        throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
    }
    return context;
};

export const CustomerAuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('customerToken');
            const storedCustomer = localStorage.getItem('customer');

            if (!storedToken) {
                setLoading(false);
                return;
            }

            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

            try {
                const response = await axios.get('/api/customer/me');
                const currentCustomer = response.data?.customer || (storedCustomer ? JSON.parse(storedCustomer) : null);

                setToken(storedToken);
                setCustomer(currentCustomer);

                if (currentCustomer) {
                    localStorage.setItem('customer', JSON.stringify(currentCustomer));
                }
            } catch (error) {
                console.error('Failed to restore customer session:', error);
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customer');
                delete axios.defaults.headers.common['Authorization'];
                setToken(null);
                setCustomer(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const register = async (userData) => {
        try {
            const response = await axios.post('/api/public/register', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
                errors: error.response?.data?.errors
            };
        }
    };

    // Direct login for existing customers (no OTP needed)
    const login = async ({ email }) => {
        try {
            const response = await axios.post('/api/public/login', { email });
            const { customer: loggedInCustomer, token: newToken } = response.data;

            setCustomer(loggedInCustomer);
            setToken(newToken);
            localStorage.setItem('customerToken', newToken);
            localStorage.setItem('customer', JSON.stringify(loggedInCustomer));
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
                exists: error.response?.data?.exists,
                errors: error.response?.data?.errors
            };
        }
    };

    // Check if email exists in the system
    const checkEmail = async ({ email }) => {
        try {
            const response = await axios.post('/api/public/check-email', { email });
            return { success: true, exists: response.data.exists, customerName: response.data.customer_name };
        } catch (error) {
            return { success: false, exists: false };
        }
    };

    const sendOTP = async ({ email }) => {
        try {
            const response = await axios.post('/api/public/send-otp', { email });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP',
                errors: error.response?.data?.errors
            };
        }
    };

    const verifyOTP = async ({ email, otp }) => {
        try {
            const response = await axios.post('/api/public/verify-otp', { email, otp });
            const { customer: loggedInCustomer, token: newToken } = response.data;

            setCustomer(loggedInCustomer);
            setToken(newToken);
            localStorage.setItem('customerToken', newToken);
            localStorage.setItem('customer', JSON.stringify(loggedInCustomer));
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Invalid OTP',
                errors: error.response?.data?.errors
            };
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await axios.post('/api/customer/logout');
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setCustomer(null);
            setToken(null);
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customer');
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const isAuthenticated = () => {
        return !!token && !!customer;
    };

    const value = {
        customer,
        token,
        loading,
        register,
        login,
        checkEmail,
        sendOTP,
        verifyOTP,
        logout,
        isAuthenticated
    };

    return (
        <CustomerAuthContext.Provider value={value}>
            {children}
        </CustomerAuthContext.Provider>
    );
};
