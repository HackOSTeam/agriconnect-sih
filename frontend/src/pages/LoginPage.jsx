import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User, ShoppingBag, Lock, Eye, EyeOff, Sprout,
    ArrowRight, CheckCircle2, ShieldCheck, Phone, Mail,
    AlertCircle, Sparkles, KeyRound
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import Particle3DCanvas from '../components/Particle3DCanvas';

export default function LoginPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState('farmer'); // 'farmer' or 'buyer'
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Farmer Form (Name / Mobile + Password)
    const [farmerIdentifier, setFarmerIdentifier] = useState('');
    const [farmerPassword, setFarmerPassword] = useState('');
    const [showFarmerPassword, setShowFarmerPassword] = useState(false);

    // Buyer Form (Name / Email / Mobile + Password)
    const [buyerIdentifier, setBuyerIdentifier] = useState('');
    const [buyerPassword, setBuyerPassword] = useState('');
    const [showBuyerPassword, setShowBuyerPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Forgot Password Modal state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent] = useState(false);

    // Submit Login (Unified for Farmer & Buyer)
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const identifier = role === 'farmer' ? farmerIdentifier.trim() : buyerIdentifier.trim();
        const password = role === 'farmer' ? farmerPassword : buyerPassword;

        if (!identifier) {
            setError(`Please enter your registered ${role === 'farmer' ? 'Full Name or Mobile Number' : 'Name, Email, or Phone'}.`);
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setIsLoading(true);
        try {
            // First check user & role compatibility
            const checkRes = await axios.post(`${API_BASE_URL}/api/check-user`, {
                identifier: identifier,
                role: role
            });

            if (!checkRes.data.exists) {
                setError(`No registered ${role.toUpperCase()} account found with '${identifier}'. Redirecting to registration...`);
                setTimeout(() => navigate('/register'), 2000);
                setIsLoading(false);
                return;
            }

            if (checkRes.data.exists && !checkRes.data.matches_role) {
                setError(checkRes.data.message);
                setIsLoading(false);
                return;
            }

            // Perform Login
            const res = await axios.post(`${API_BASE_URL}/api/login`, {
                identifier: identifier,
                role: role,
                password: password,
                auth_type: 'password'
            });

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }
            if (res.data.user_id) {
                localStorage.setItem('userId', res.data.user_id);
            }

            if (role === 'farmer') {
                localStorage.setItem('role', 'farmer');
                localStorage.setItem('userName', res.data.name);
                localStorage.setItem('farmerId', res.data.user_id || res.data.user?.id || '');
                localStorage.setItem('farmerProfile', JSON.stringify(res.data.user));
                setSuccessMessage(`Welcome back, ${res.data.name}! Opening Kisan Dashboard...`);
                setTimeout(() => navigate('/farmer'), 800);
            } else {
                localStorage.setItem('role', 'buyer');
                localStorage.setItem('userName', res.data.name);
                localStorage.setItem('buyerId', res.data.user_id || res.data.user?.id || '');
                localStorage.setItem('buyerProfile', JSON.stringify(res.data.user));
                setSuccessMessage(`Welcome back, ${res.data.name}! Opening Buyer Marketplace...`);
                setTimeout(() => navigate('/buyer'), 800);
            }
        } catch (err) {
            const detail = err.response?.data?.detail || err.message;
            if (err.response?.status === 404) {
                setError(`${detail} Redirecting to registration...`);
                setTimeout(() => navigate('/register'), 2000);
            } else {
                setError(detail || 'Authentication failed. Please verify your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 py-12 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-hidden">
            <Particle3DCanvas className="opacity-25" />

            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#10B981] rounded-full filter blur-[150px] opacity-15 pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[150px] opacity-10 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-[#062319] via-[#0A3324] to-[#041A13] p-6 text-white flex items-center justify-between border-b border-[#10B981]/25">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl flex items-center justify-center text-[#022C22] shadow group-hover:scale-105 transition-transform">
                                <Sprout size={22} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <span className="font-extrabold font-serif text-white text-xl tracking-tight">Agri<span className="text-[#34D399]">Connect</span></span>
                                <span className="block text-[10px] text-gray-300 font-mono">Direct Trade Portal</span>
                            </div>
                        </Link>
                        <span className="text-xs bg-[#10B981]/20 text-[#34D399] px-2.5 py-1 rounded-full font-mono border border-[#10B981]/30">
                            Secure Sign In
                        </span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Title */}
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold font-serif text-[#0F172A]">Welcome Back</h1>
                            <p className="text-xs text-gray-500">Sign in with your registered Name and Password</p>
                        </div>

                        {/* Error & Success Messages */}
                        {error && (
                            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-mono">
                                <AlertCircle size={16} className="text-red-500 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-mono">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* Role Selector Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl">
                            <button
                                type="button"
                                onClick={() => { setRole('farmer'); setError(''); setSuccessMessage(''); }}
                                className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                                    role === 'farmer'
                                        ? 'bg-[#059669] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <User size={16} /> Farmer Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRole('buyer'); setError(''); setSuccessMessage(''); }}
                                className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                                    role === 'buyer'
                                        ? 'bg-[#EA580C] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <ShoppingBag size={16} /> Buyer Sign In
                            </button>
                        </div>

                        {/* ======================================================== */}
                        {/* 1. FARMER LOGIN FORM */}
                        {/* ======================================================== */}
                        {role === 'farmer' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Full Name or Registered Mobile *</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                                        <input
                                            type="text"
                                            value={farmerIdentifier}
                                            onChange={(e) => setFarmerIdentifier(e.target.value)}
                                            placeholder="e.g. Ramesh Patel or 9876543210"
                                            className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-700">Password *</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            className="text-[11px] font-bold text-emerald-700 hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                                        <input
                                            type={showFarmerPassword ? "text" : "password"}
                                            value={farmerPassword}
                                            onChange={(e) => setFarmerPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="w-full pl-10 pr-11 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowFarmerPassword(!showFarmerPassword)}
                                            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700"
                                        >
                                            {showFarmerPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In as Farmer'} <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {/* ======================================================== */}
                        {/* 2. BUYER LOGIN FORM */}
                        {/* ======================================================== */}
                        {role === 'buyer' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Business Name, Email, or Mobile *</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                                        <input
                                            type="text"
                                            value={buyerIdentifier}
                                            onChange={(e) => setBuyerIdentifier(e.target.value)}
                                            placeholder="e.g. AgroFresh Wholesalers or 9822001122"
                                            className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-700">Password *</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            className="text-[11px] font-bold text-orange-600 hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                                        <input
                                            type={showBuyerPassword ? "text" : "password"}
                                            value={buyerPassword}
                                            onChange={(e) => setBuyerPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="w-full pl-10 pr-11 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowBuyerPassword(!showBuyerPassword)}
                                            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700"
                                        >
                                            {showBuyerPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In to Marketplace'} <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {/* Footer: Register Link */}
                        <div className="text-center pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                Don't have an account yet?{' '}
                                <Link
                                    to="/register"
                                    className={`font-bold hover:underline ${role === 'farmer' ? 'text-emerald-700' : 'text-orange-600'}`}
                                >
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                                <KeyRound size={24} />
                            </div>
                            <h3 className="text-lg font-bold font-serif text-gray-900">Reset Account Password</h3>
                            <p className="text-xs text-gray-500">Enter your registered email or mobile to receive a reset verification code.</p>
                        </div>

                        {forgotSent ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs text-center space-y-3">
                                <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                                <p className="font-semibold">Reset code sent! Follow SMS/Email instructions to set a new password.</p>
                                <button
                                    type="button"
                                    onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                                    className="w-full py-2 bg-emerald-700 text-white rounded-xl font-bold text-xs"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); setForgotSent(true); }} className="space-y-3">
                                <input
                                    type="text"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="Registered Mobile or Email"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                    required
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition"
                                    >
                                        Send Reset OTP
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}