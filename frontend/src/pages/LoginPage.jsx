import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useCart } from '../customer/context/CartContext';
import toast from 'react-hot-toast';

// Food images for the side panel
const loginImage = '/images/login-food.jpg';
const otpImage = '/images/otp-food.jpg';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { sendOTP, verifyOTP } = useCustomerAuth();
    const { itemCount } = useCart();
    const [step, setStep] = useState(1); // 1: email, 2: OTP
    const [email, setEmail] = useState(location.state?.email || '');
    const [redirectTo] = useState(location.state?.redirectTo || null);
    const [otp, setOTP] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const authMessage = location.state?.authMessage;

        if (!authMessage) {
            return;
        }

        toast.error(authMessage);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await sendOTP({ email });

        if (result.success) {
            toast.success('OTP sent to your email!');
            setStep(2);
        } else {
            setError(result.message);
            toast.error(result.message);
        }
        setLoading(false);
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await verifyOTP({ email, otp });

        if (result.success) {
            toast.success('Login successful!');
            navigate(redirectTo || (itemCount > 0 ? '/cart' : '/my-orders'));
        } else {
            setError(result.message);
            toast.error(result.message);
        }
        setLoading(false);
    };

    const handleResendOTP = async () => {
        setLoading(true);
        const result = await sendOTP({ email });
        if (result.success) {
            toast.success('New OTP sent!');
            setOTP('');
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image (2/3 of screen) */}
            <div className="hidden lg:flex lg:w-2/3 relative">
                <img
                    src={step === 1 ? loginImage : otpImage}
                    alt="Delicious Food"
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                
                {/* Content on image */}
                <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                    <h1 className="text-5xl font-bold mb-4">
                        {step === 1 ? 'Welcome Back!' : 'Almost There!'}
                    </h1>
                    <p className="text-xl text-gray-200 max-w-md">
                        {step === 1 
                            ? 'Sign in to order your favorite dishes and track your orders.'
                            : 'Enter the verification code we sent to your email.'
                        }
                    </p>
                    
                    {/* Decorative elements */}
                    <div className="mt-8 flex items-center gap-4">
                        <div className="w-12 h-1 bg-amber-500 rounded-full" />
                        <span className="text-amber-400 font-medium">The Wooden Plate</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form (1/3 of screen) */}
            <div className="w-full lg:w-1/3 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-6 lg:p-8">
                <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 ? 'Enter your email to receive OTP' : 'Enter the OTP sent to your email'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-amber-600 hover:text-amber-500">
                                    Sign up
                                </Link>
                            </p>
                        </div>

                        <div className="text-center pt-4 border-t border-gray-200">
                            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                                ← Back to Home
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                Enter OTP
                            </label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength="6"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center text-2xl tracking-widest"
                                placeholder="000000"
                            />
                            <p className="mt-1 text-sm text-gray-500 text-center">
                                OTP sent to {email}
                            </p>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => { setStep(1); setOTP(''); setError(''); }}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Change email
                            </button>
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="text-sm text-amber-600 hover:text-amber-500 disabled:opacity-50"
                            >
                                Resend OTP
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t border-gray-200">
                            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                                ← Back to Home
                            </Link>
                        </div>
                    </form>
                )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
