import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck, MapPin, CheckCircle2, AlertCircle, Clock,
    Navigation, ShieldCheck, Sprout, ArrowLeft, RefreshCw,
    Users, Phone, Package, Fuel, Activity, Sparkles, Zap
} from 'lucide-react';

export default function LogisticsDashboard() {
    const [selectedRoute, setSelectedRoute] = useState('route-1');
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
    const loadPercent = Math.min(100, Math.round(20 + completedCount * 26.6));

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans">
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#0F172A] border border-[#10B981] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#34D399]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Top Navigation Header (Dark Slate/Emerald Command Strip) */}
            <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-[#10B981]/25 px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-9 h-9 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl flex items-center justify-center text-[#022C22] shadow">
                        <Truck size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white font-serif">AgriConnect Logistics Fleet Command</h1>
                        <p className="text-[10px] text-[#34D399] font-mono">Dynamic Multi-Farm Aggregation Engine</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="bg-[#10B981]/20 text-[#34D399] text-xs px-3 py-1 rounded-full font-mono border border-[#10B981]/30 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                        8 Vehicles Active in Pune Cluster
                    </span>
                </div>
            </header>

            {/* Main Command Room */}
            <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* 4 Crisp White Real-time Fleet Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">ACTIVE DISPATCH RUNS</span>
                        <div className="text-3xl font-bold text-[#0F172A] font-mono mt-1">14 Vans</div>
                        <div className="text-[11px] text-emerald-700 mt-1 font-bold">98.2% On-Schedule</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">AGGREGATED LOAD</span>
                        <div className="text-3xl font-bold text-[#0F172A] font-mono mt-1">18.4 Tonnes</div>
                        <div className="text-[11px] text-emerald-700 mt-1 font-bold">Combined from 42 Farms</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">POOLED FUEL SAVINGS</span>
                        <div className="text-3xl font-bold text-[#EA580C] font-mono mt-1">-38.4%</div>
                        <div className="text-[11px] text-gray-500 mt-1 font-medium">vs Solo Farmer Trips</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">COLD-CHAIN FRESHNESS</span>
                        <div className="text-3xl font-bold text-emerald-700 font-mono mt-1">99.4%</div>
                        <div className="text-[11px] text-emerald-700 mt-1 font-bold">Zero Spoilage Today</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Live Visual Route Simulator (High Contrast Dark Box) */}
                    <div className="lg:col-span-7 bg-[#07241A] text-white border border-[#10B981]/30 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                        <div className="flex justify-between items-center pb-3 border-b border-white/10">
                            <div>
                                <h3 className="font-bold text-white text-base">Route Loop: Pune East Cluster #OR-12</h3>
                                <p className="text-xs text-gray-300">Driver: Santosh Jadhav (Tata Ace MH-12-QE-4920)</p>
                            </div>
                            <span className="text-xs bg-[#10B981]/20 text-[#34D399] px-2.5 py-1 rounded font-mono font-bold">
                                {3 - completedCount} Waypoints Remaining
                            </span>
                        </div>

                        {/* Interactive SVG Radar Map */}
                        <div className="bg-[#031710] h-64 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                            <svg className="w-full h-full" viewBox="0 0 320 160">
                                <path d="M 30 130 Q 110 30, 200 110 T 300 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                                <path d="M 30 130 Q 110 30, 200 110 T 300 40" fill="none" stroke="#10B981" strokeWidth="4" className="animate-route-dash" />

                                {/* Waypoint 1 */}
                                <circle cx="30" cy="130" r="7" fill={verifiedPickups[0] ? '#10B981' : '#F59E0B'} />
                                <text x="15" y="152" fill="#A7F3D0" fontSize="10" fontFamily="monospace">Farm 1 (Haveli)</text>

                                {/* Waypoint 2 */}
                                <circle cx="140" cy="62" r="7" fill={verifiedPickups[1] ? '#10B981' : '#F59E0B'} />
                                <text x="110" y="50" fill="#A7F3D0" fontSize="10" fontFamily="monospace">Farm 2 (Saswad)</text>

                                {/* Waypoint 3 */}
                                <circle cx="225" cy="115" r="7" fill={verifiedPickups[2] ? '#10B981' : '#F59E0B'} />
                                <text x="195" y="135" fill="#A7F3D0" fontSize="10" fontFamily="monospace">Farm 3 (Hadapsar)</text>

                                {/* Destination */}
                                <circle cx="300" cy="40" r="9" fill="#EA580C" />
                                <text x="240" y="28" fill="#FDBA74" fontSize="10" fontFamily="monospace">Wholesale Depot</text>
                            </svg>

                            <div className="absolute bottom-3 left-4 text-xs font-mono text-gray-300 bg-[#022C22]/90 px-3 py-1.5 rounded-xl border border-[#10B981]/30">
                                🚚 Vehicle En Route • Estimated Next Arrival: 14 Mins
                            </div>
                        </div>

                        {/* Vehicle Load Capacity Bar */}
                        <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between text-gray-300">
                                <span>Tata Ace Capacity Utilization:</span>
                                <span className="text-[#34D399] font-bold">{Math.round((loadPercent / 100) * 2000)}kg / 2,000kg ({loadPercent}% Full)</span>
                            </div>
                            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full rounded-full shadow-[0_0_12px_#10B981] transition-all duration-700"
                                    style={{ width: `${loadPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Waypoint Pickups Verification Column (Crisp Light Box) */}
                    <div className="lg:col-span-5 bg-white border border-gray-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 text-base">Multi-Farm Waypoint Pickups</h3>
                            <span className="text-xs text-gray-500 font-mono">OTP Verification</span>
                        </div>

                        <div className="space-y-3">
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
                                        <div className="flex gap-2 pt-2 border-t border-gray-200">
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
                </div>
            </main>
        </div>
    );
}