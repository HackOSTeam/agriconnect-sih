import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck, MapPin, CheckCircle2, AlertCircle, Clock,
    Navigation, ShieldCheck, Sprout, ArrowLeft, RefreshCw,
    Users, Phone, Package, Fuel, Activity, Sparkles, Zap,
    ArrowRight, ShoppingBag
} from 'lucide-react';
import RouteOptimizerWidget from '../components/RouteOptimizerWidget';

export default function LogisticsDashboard() {
    const [otpInput, setOtpInput] = useState('');
    const [verifiedPickups, setVerifiedPickups] = useState([false, false, false]);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const handleVerifyOtp = (index) => {
        const updated = [...verifiedPickups];
        updated[index] = true;
        setVerifiedPickups(updated);
        showToast(`✅ Farm ${index + 1} Harvest Batch OTP Verified & Loaded into Van!`);
        setOtpInput('');
    };

    const waypoints = [
        { id: 1, name: 'Farm 1: Ramesh Patel (Haveli, Pune)', crop: '450kg Tomatoes', otp: '4910', status: verifiedPickups[0] ? 'Loaded' : 'Awaiting Pickup' },
        { id: 2, name: 'Farm 2: Suresh Shinde (Saswad)', crop: '800kg Onions', otp: '3120', status: verifiedPickups[1] ? 'Loaded' : 'Next Stop' },
        { id: 3, name: 'Farm 3: Vijay Gaikwad (Hadapsar)', crop: '350kg Capsicum', otp: '6081', status: verifiedPickups[2] ? 'Loaded' : 'Pending' },
    ];

    const completedCount = verifiedPickups.filter(Boolean).length;

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans selection:bg-[#10B981] selection:text-[#022C22]">
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#0F172A] border border-[#10B981] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#34D399]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Top Navigation Header */}
            <header className="sticky top-0 z-40 bg-[#062319] text-white border-b border-[#10B981]/25 px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl flex items-center justify-center text-[#022C22] shadow">
                        <Truck size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-white font-serif">AgriConnect Logistics & Fleet Command</h1>
                            <span className="bg-[#10B981]/20 text-[#34D399] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#10B981]/30 font-bold">
                                Version 3.0
                            </span>
                        </div>
                        <p className="text-[11px] text-[#34D399] font-mono">Autonomous Multi-Farm Aggregation & Route Optimizer</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/farmer"
                        className="hidden md:inline-flex text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 transition items-center gap-1.5"
                    >
                        <Sprout size={14} className="text-[#34D399]" /> Farmer Portal
                    </Link>
                    <Link
                        to="/buyer"
                        className="hidden md:inline-flex text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 transition items-center gap-1.5"
                    >
                        <ShoppingBag size={14} className="text-[#FB923C]" /> Buyer Portal
                    </Link>
                    <span className="bg-[#10B981]/20 text-[#34D399] text-xs px-3 py-1.5 rounded-full font-mono border border-[#10B981]/30 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                        Live Road Engine Active
                    </span>
                </div>
            </header>

            {/* Main Command Center */}
            <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* 1. Core Route Optimizer Engine Widget */}
                <RouteOptimizerWidget
                    standalone={false}
                    title="KisanRoute AI — Multi-Vehicle Fleet Optimizer"
                    subtitle="Constraint Programming • Pickup-Delivery with Time Windows • Real-Road Polyline Tracking"
                />

                {/* 2. Real-Time Farm-Gate Verification & Pickups Manifest */}
                <div className="bg-white border border-gray-200/90 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-gray-100">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 font-serif">
                                <ShieldCheck size={20} className="text-emerald-700" /> Multi-Farm Waypoint Pickups & Escrow Verification
                            </h3>
                            <p className="text-xs text-gray-500 font-sans">
                                One-touch 4-digit OTP handshake between driver and farmer at field gate
                            </p>
                        </div>
                        <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold border border-emerald-200 self-start sm:self-auto">
                            {3 - completedCount} Pickups Pending in Current Dispatch
                        </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {waypoints.map((wp, idx) => (
                            <div key={wp.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 text-xs">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{wp.name}</div>
                                        <span className="text-gray-500 font-mono">{wp.crop}</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-[11px] ${
                                        verifiedPickups[idx] ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {wp.status}
                                    </span>
                                </div>

                                {!verifiedPickups[idx] ? (
                                    <div className="pt-2 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => handleVerifyOtp(idx)}
                                            className="w-full bg-[#059669] hover:bg-[#047857] text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow"
                                        >
                                            <Zap size={14} /> 1-Click Verify OTP ({wp.otp})
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-emerald-700 font-bold font-mono flex items-center gap-1.5 pt-1 text-[11px]">
                                        <CheckCircle2 size={14} /> Batch loaded into van & escrow payment authorized
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}