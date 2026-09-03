import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Sprout, ArrowLeft, KeyRound, Truck, Zap } from 'lucide-react';
import Particle3DCanvas from '../components/Particle3DCanvas';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@agriconnect.com');
    const [password, setPassword] = useState('admin123');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        if (email === 'admin@agriconnect.com' && password === 'admin123') {
            localStorage.setItem('role', 'logistics');
            navigate('/logistics');
        } else {
            alert('Invalid Fleet Admin Credentials.');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-hidden">
            <Particle3DCanvas className="opacity-30" />

            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[150px] opacity-15 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Dark Logistics Command Header */}
                    <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 text-white flex items-center justify-between border-b border-orange-500/30">
                        <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <ArrowLeft size={16} />
                            <span className="text-xs font-mono">Back to Home</span>
                        </Link>
                        <span className="text-xs font-mono text-[#F97316] bg-orange-500/20 px-2.5 py-0.5 rounded border border-orange-500/30">
                            Fleet Command
                        </span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 text-[#EA580C] border border-orange-200 flex items-center justify-center shadow-sm">
                                <Truck size={24} />
                            </div>
                            <h1 className="text-2xl font-bold font-serif text-[#0F172A]">Logistics Admin Portal</h1>
                            <p className="text-xs text-gray-500">Fleet managers, dispatch telemetry & route aggregation</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Admin Email"
                                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#EA580C] focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#EA580C] focus:bg-white transition"
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

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#F97316] hover:to-[#EA580C] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/25 transition"
                            >
                                Authorize & Enter Fleet Command
                            </button>
                        </form>

                        {/* Admin Fleet Access Info */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono space-y-1 text-slate-600">
                            <div className="text-slate-900 font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <KeyRound size={14} className="text-[#EA580C]" /> Default Fleet Access:
                                </span>
                                <button
                                    type="button"
                                    onClick={handleLogin}
                                    className="text-[10px] bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold transition flex items-center gap-1"
                                >
                                    <Zap size={11} /> Fast Sign In
                                </button>
                            </div>
                            <div>Email: <span className="text-slate-900 font-semibold">admin@agriconnect.com</span></div>
                            <div>Password: <span className="text-slate-900 font-semibold">••••••••</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}