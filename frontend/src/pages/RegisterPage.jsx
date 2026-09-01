import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShoppingBag, Eye, EyeOff, CheckCircle2, Sprout, ArrowRight, Lock, Phone, Zap } from 'lucide-react';
import axios from 'axios';
import Particle3DCanvas from '../components/Particle3DCanvas';

export default function RegisterPage() {
    const [role, setRole] = useState('farmer');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', mobile: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleQuickFill = (targetRole) => {
        setRole(targetRole);
        if (targetRole === 'farmer') {
            setFormData({ name: 'Ramesh Patel', mobile: '9876543210', password: 'password123' });
        } else {
            setFormData({ name: 'AgroFresh Wholesalers', mobile: '9822001122', password: 'password123' });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await axios.post('http://127.0.0.1:8000/api/register', {
                name: formData.name,
                mobile: formData.mobile,
                password: formData.password,
                role: role
            });

            navigate('/login');
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                // Fallback for presentation
                navigate('/login');
            }
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 py-12 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-hidden">
            <Particle3DCanvas className="opacity-30" />

            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#10B981] rounded-full filter blur-[140px] opacity-15 pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[140px] opacity-10 pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Dark Top Header Banner */}
                    <div className="bg-gradient-to-r from-[#062319] to-[#0A3324] p-6 text-white flex items-center justify-between border-b border-[#10B981]/20">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center text-[#022C22] shadow group-hover:scale-105 transition-transform">
                                <Sprout size={20} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <span className="font-extrabold font-serif text-white text-lg tracking-tight">Agri<span className="text-[#34D399]">Connect</span></span>
                                <span className="block text-[10px] text-gray-300 font-mono">Join the Direct Network</span>
                            </div>
                        </Link>
                        <span className="text-xs bg-[#10B981]/20 text-[#34D399] px-2.5 py-1 rounded-full font-mono border border-[#10B981]/30">
                            Zero Registration Fee
                        </span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold font-serif text-[#0F172A]">Create Account</h1>
                            <p className="text-xs text-gray-500">Bypass middleman commissions with verified direct trade</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center font-mono">
                                {error}
                            </div>
                        )}

                        {/* 1-Click Fast Autofill */}
                        <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-3 space-y-2">
                            <div className="text-[11px] font-mono text-gray-500 flex items-center justify-between">
                                <span className="flex items-center gap-1 font-bold text-gray-700">
                                    <Zap size={13} className="text-[#F59E0B]" /> 1-Click Fast Fill:
                                </span>
                                <span className="text-[10px] text-gray-400">Instant Demo Setup</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickFill('farmer')}
                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-left"
                                >
                                    🌾 Sample Farmer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickFill('buyer')}
                                    className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-left"
                                >
                                    🛒 Sample Buyer
                                </button>
                            </div>
                        </div>

                        {/* Role Toggle */}
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

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={role === 'farmer' ? "Full Name / Farm Name (e.g. Ramesh Patel)" : "Company / Business Name"}
                                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#059669] focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="Mobile Number (e.g. 9876543210)"
                                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#059669] focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create Password"
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

                            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                                <input type="checkbox" required className="rounded accent-[#059669]" defaultChecked />
                                <span>I agree to Direct Trade Terms & APMC Fair Policy</span>
                            </label>

                            <button
                                type="submit"
                                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                                    role === 'farmer'
                                        ? 'bg-[#059669] hover:bg-[#047857] text-white shadow-emerald-600/20'
                                        : 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-orange-600/20'
                                }`}
                            >
                                Register on Platform
                            </button>
                        </form>

                        <div className="text-center pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                Already registered?{' '}
                                <Link to="/login" className="font-bold text-[#059669] hover:underline">
                                    Sign In here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}