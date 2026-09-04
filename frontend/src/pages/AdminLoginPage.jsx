import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Sprout, ArrowLeft, KeyRound, Truck, Zap } from 'lucide-react';
import axios from 'axios';
import Particle3DCanvas from '../components/Particle3DCanvas';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/login', {
                identifier: name, password: password, role: 'logistics', auth_type: 'password'
            });
            if (res.data.token) localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'logistics');
            localStorage.setItem('userName', res.data.name);
            navigate('/logistics');
        } catch (err) {
            // --- BULLETPROOF ERROR EXTRACTION ---
            const errDetail = err.response?.data?.detail;
            let errMsg = 'Login failed. Please register first.';

            if (Array.isArray(errDetail)) {
                errMsg = errDetail.map(e => `${e.loc.slice(-1)[0]}: ${e.msg}`).join(', ');
            } else if (typeof errDetail === 'string') {
                errMsg = errDetail;
            } else if (err.message) {
                errMsg = err.message;
            }
            setError(errMsg);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-hidden">
            <Particle3DCanvas className="opacity-30" />
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[150px] opacity-15 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 text-white flex items-center justify-between border-b border-orange-500/30">
                        <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <ArrowLeft size={16} /><span className="text-xs font-mono">Back to Home</span>
                        </Link>
                        <span className="text-xs font-mono text-[#F97316] bg-orange-500/20 px-2.5 py-0.5 rounded border border-orange-500/30">Fleet Command</span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 text-[#EA580C] border border-orange-200 flex items-center justify-center shadow-sm">
                                <Truck size={24} />
                            </div>
                            <h1 className="text-2xl font-bold font-serif text-[#0F172A]">Logistics Partner Portal</h1>
                            <p className="text-xs text-gray-500">Login to manage pickups & routes</p>
                        </div>

                        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center">{error}</div>}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#EA580C] focus:bg-white transition" required />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#EA580C] focus:bg-white transition" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#F97316] hover:to-[#EA580C] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/25 transition">
                                Authorize & Enter Fleet Command
                            </button>
                        </form>

                        <div className="text-center pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">New Fleet Partner? <Link to="/register/logistics" className="font-bold text-[#EA580C] hover:underline">Register here</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}