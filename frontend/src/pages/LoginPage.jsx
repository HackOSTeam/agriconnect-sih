import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShoppingBag, Lock, Eye, EyeOff, Mic, Sprout, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';
import Particle3DCanvas from '../components/Particle3DCanvas';

export default function LoginPage() {
    const [role, setRole] = useState('farmer');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [activeLang, setActiveLang] = useState('EN');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/login', {
                identifier: name,
                password: password,
                role: role
            });

            const userRole = response.data.role;
            const userName = response.data.name;

            localStorage.setItem('role', userRole);
            localStorage.setItem('userName', userName);

            navigate(`/${userRole}`);
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                // Fallback demo login for presentation
                localStorage.setItem('role', role);
                localStorage.setItem('userName', name || (role === 'farmer' ? 'Ramesh Patel' : 'AgroFresh Wholesalers'));
                navigate(`/${role}`);
            }
        }
    };

    const handleQuickAutofill = (selectedRole) => {
        setRole(selectedRole);
        if (selectedRole === 'farmer') {
            setName('Ramesh Patel');
            setPassword('password123');
        } else if (selectedRole === 'buyer') {
            setName('AgroFresh Wholesalers');
            setPassword('password123');
        }
    };

    const handleVoiceAssist = () => {
        setIsListening(true);
        setTimeout(() => {
            setName(role === 'farmer' ? 'Ramesh Patel' : 'AgroFresh Wholesalers');
            setPassword('password123');
            setIsListening(false);
        }, 1200);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-hidden">
            {/* Ambient Background Particles */}
            <Particle3DCanvas className="opacity-30" />

            {/* Glowing Ambient Gradient Accents */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#10B981] rounded-full filter blur-[140px] opacity-15 pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[140px] opacity-10 pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg">
                {/* Main Balanced Dual-Tone Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Dark Top Header Banner for High Contrast */}
                    <div className="bg-gradient-to-r from-[#062319] to-[#0A3324] p-6 text-white flex items-center justify-between border-b border-[#10B981]/20">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center text-[#022C22] shadow group-hover:scale-105 transition-transform">
                                <Sprout size={20} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <span className="font-extrabold font-serif text-white text-lg tracking-tight">Agri<span className="text-[#34D399]">Connect</span></span>
                                <span className="block text-[10px] text-gray-300 font-mono">Secure Access Portal</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2">
                            <div className="flex bg-white/10 border border-white/15 rounded-full p-0.5 text-xs font-mono">
                                {['EN', 'हिं', 'म'].map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setActiveLang(l)}
                                        className={`px-2.5 py-0.5 rounded-full transition ${activeLang === l ? 'bg-[#10B981] text-[#022C22] font-bold' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleVoiceAssist}
                                className={`p-2 rounded-xl border transition ${isListening ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-white/10 border-white/15 text-[#34D399] hover:bg-white/20'}`}
                                title="Voice AI Demo Helper"
                            >
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold font-serif text-[#0F172A]">Welcome Back</h1>
                            <p className="text-xs text-gray-500">Sign in to manage farm harvests, wholesale orders & dispatch</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center font-mono">
                                {error}
                            </div>
                        )}

                        {/* Quick 1-Click Demo Automation Pills */}
                        <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-3 space-y-2">
                            <div className="text-[11px] font-mono text-gray-500 flex items-center justify-between">
                                <span className="flex items-center gap-1 font-bold text-gray-700">
                                    <Zap size={13} className="text-[#F59E0B]" /> 1-Click Demo Autofill:
                                </span>
                                <span className="text-[10px] text-gray-400">SIH Fast Demo</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickAutofill('farmer')}
                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-left"
                                >
                                    🌾 Farmer (Ramesh)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickAutofill('buyer')}
                                    className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-left"
                                >
                                    🛒 Buyer (AgroFresh)
                                </button>
                            </div>
                        </div>

                        {/* Role Toggle Switch */}
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setRole('farmer')}
                                className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                    role === 'farmer'
                                        ? 'bg-[#059669] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <User size={16} /> Farmer
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('buyer')}
                                className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                    role === 'buyer'
                                        ? 'bg-[#EA580C] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <ShoppingBag size={16} /> Buyer / Wholesaler
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={role === 'farmer' ? "Farmer Name or Mobile (e.g. Ramesh Patel)" : "Business Name or Mobile"}
                                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#059669] focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password (e.g. password123)"
                                    className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#059669] focus:bg-white transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded accent-[#059669]" defaultChecked />
                                    <span>Remember credentials</span>
                                </label>
                                <span className="text-[#059669] font-medium hover:underline cursor-pointer">Forgot Password?</span>
                            </div>

                            <button
                                type="submit"
                                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                                    role === 'farmer'
                                        ? 'bg-[#059669] hover:bg-[#047857] text-white shadow-emerald-600/20'
                                        : 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-orange-600/20'
                                }`}
                            >
                                Sign In to AgriConnect
                            </button>
                        </form>

                        <div className="text-center pt-2 border-t border-gray-100 space-y-3">
                            <p className="text-xs text-gray-500">
                                New to AgriConnect?{' '}
                                <Link to="/register" className="font-bold text-[#059669] hover:underline">
                                    Register Account
                                </Link>
                            </p>
                            <Link to="/admin/login" className="inline-block text-[11px] text-gray-400 hover:text-gray-700">
                                Logistics Admin Fleet Portal →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}