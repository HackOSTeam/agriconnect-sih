import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Sprout, BarChart3, Truck, Languages, ShoppingBag,
    MapPin, MessageCircle, Camera, TrendingUp, CheckCircle2,
    XCircle, ArrowRight, Users, Warehouse, Mic, Star,
    Sparkles, ShieldCheck, Zap, ArrowUpRight, Play, Check,
    Layers, Clock, DollarSign, Activity
} from 'lucide-react';
import Particle3DCanvas from '../components/Particle3DCanvas';
import TiltCard3D from '../components/TiltCard3D';

const LANGS = [
    { code: 'en', name: 'English', greeting: 'Direct farm produce at transparent prices' },
    { code: 'hi', name: 'हिंदी', greeting: 'खेत से सीधे मंडी, बिना बिचौलियों के' },
    { code: 'mr', name: 'मराठी', greeting: 'शेतकऱ्यांचा थेट व्यापार, जास्त नफा' },
    { code: 'ta', name: 'தமிழ்', greeting: 'விவசாயிகளிடமிருந்து நேரடியாக நியாயமான விலையில்' },
    { code: 'te', name: 'తెలుగు', greeting: 'రైతుల నుండి నేరుగా ఉత్తమ ధరలకు' },
    { code: 'bn', name: 'বাংলা', greeting: 'কৃষকের সরাসরি ফসল, সঠিক মূল্যে' },
];

const SCAN_CROPS = [
    { name: 'Fresh Tomato', grade: 'Grade A', confidence: '98.2%', status: 'Export Quality', color: '#10B981', img: '🍅', defects: '0 Defects Detected', shelfLife: '8 Days' },
    { name: 'Organic Potato', grade: 'Grade A', confidence: '96.5%', status: 'Premium Solid', color: '#10B981', img: '🥔', defects: 'Even Shape & Texture', shelfLife: '24 Days' },
    { name: 'Red Onion', grade: 'Grade B', confidence: '92.1%', status: 'Standard Market', color: '#F59E0B', img: '🧅', defects: 'Minor Outer Peeling', shelfLife: '15 Days' },
    { name: 'Green Bell Pepper', grade: 'Grade A', confidence: '99.1%', status: 'Export Quality', color: '#10B981', img: '🫑', defects: 'Crisp Firm Surface', shelfLife: '10 Days' },
];

export default function LandingPage() {
    const [activeTab, setActiveTab] = useState('farmer');
    const [activeLang, setActiveLang] = useState(LANGS[0]);
    const [isListening, setIsListening] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCropIndex, setSelectedCropIndex] = useState(0);
    const [forecastDay, setForecastDay] = useState(3);
    const [routeProgress, setRouteProgress] = useState(35);

    // Automated Route Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setRouteProgress((prev) => (prev >= 100 ? 0 : prev + 1.2));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const toggleMic = () => {
        setIsListening(true);
        setSearchQuery('Listening to speech: "Tomatoes Pune"');
        setTimeout(() => {
            setSearchQuery('Tomato - Grade A (Pune Hub)');
            setIsListening(false);
        }, 2200);
    };

    const currentCrop = SCAN_CROPS[selectedCropIndex];

    return (
        <div className="min-h-screen relative bg-white text-[#0F172A] overflow-x-hidden selection:bg-[#10B981] selection:text-[#022C22]">
            {/* 3D Dynamic Particle Canvas (subtle on white) */}
            <Particle3DCanvas className="opacity-15" />

            {/* Glowing Ambient Orbs — soft & subtle on white bg */}
            <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#10B981] rounded-full filter blur-[160px] opacity-[0.08] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#059669] rounded-full filter blur-[160px] opacity-[0.07] pointer-events-none z-0" />
            <div className="fixed top-[40%] right-[20%] w-[400px] h-[400px] bg-[#F0FDF4] rounded-full filter blur-[120px] opacity-60 pointer-events-none z-0" />

            {/* Top Bar / Live Network Status Banner */}
            <div className="relative z-50 bg-[#052E16] border-b border-emerald-800/40 py-2 px-4 text-xs font-mono flex items-center justify-between overflow-x-auto gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                    </span>
                    <span className="text-[#A7F3D0] font-semibold">LIVE AGRI-NETWORK:</span>
                    <span className="text-gray-300">12,450+ Active Farmers</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-300">4,120 Buyers Online</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[#34D399] font-bold">Avg Mandi Saving: +32.8%</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-600/40 font-bold">For farmers welfare</span>
                </div>
            </div>

            {/* 1. Navigation — white bg with green accents */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center text-[#022C22] shadow-md shadow-[#10B981]/30 group-hover:scale-105 transition-transform duration-300">
                        <Sprout size={24} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <span className="text-xl font-extrabold tracking-tight text-[#0F172A] font-serif">
                            Agri<span className="text-[#059669]">Connect</span>
                        </span>
                        <span className="hidden md:block text-[10px] text-gray-400 font-mono -mt-0.5">Smart India Hackathon Project</span>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
                    <a href="#features" className="hover:text-[#059669] transition-colors">Features</a>
                    <a href="#automation" className="hover:text-[#059669] transition-colors flex items-center gap-1.5">
                        <Sparkles size={15} className="text-[#F59E0B]" /> AI Tech
                    </a>
                    <a href="#how" className="hover:text-[#059669] transition-colors">How It Works</a>
                    <a href="#impact" className="hover:text-[#059669] transition-colors">Impact</a>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-sm font-semibold text-gray-600 hover:text-[#059669] px-4 py-2 rounded-xl hover:bg-emerald-50 transition"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="text-sm bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#10B981]/25 hover:shadow-[#10B981]/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        Join Platform <ArrowRight size={16} />
                    </Link>
                </div>
            </nav>

            {/* 2. 3D Hero Section — white bg with crisp green/dark text */}
            <header className="relative z-10 px-6 md:px-12 pt-14 pb-20 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-8 preserve-3d">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
                            <Sparkles size={14} className="text-[#F59E0B]" />
                            <span>Digital platform</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">

                        </div>
                    </div>

                    <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.06] tracking-tight text-[#0F172A]">
                        Empowering Farmers,<br />
                        <span className="text-[#059669]">Directly & Digitally.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl font-light">
                        Connecting rural Indian farmers directly with wholesale buyers through AI-powered quality grading, live mandi price forecasting, and pooled smart logistics — zero middlemen.
                    </p>

                    {/* Interactive Search Bar */}
                    <div className="bg-white border border-gray-200 shadow-lg p-2 rounded-2xl max-w-xl flex items-center gap-3">
                        <div className="pl-3 text-gray-400">
                            <ShoppingBag size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search fresh crops, wholesale buyers, mandi rates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-[#0F172A] placeholder-gray-400 outline-none text-sm font-medium"
                        />
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-1 text-xs font-bold ${isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-[#10B981] text-white hover:bg-[#059669]'
                                }`}
                            title="Voice search in regional languages"
                        >
                            <Mic size={16} />
                            {isListening ? 'Listening...' : 'Voice AI'}
                        </button>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link
                            to="/register"
                            className="bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl shadow-[#10B981]/25 hover:shadow-[#10B981]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                        >
                            <Sprout size={20} /> Farmer Registration
                        </Link>
                        <Link
                            to="/login"
                            className="bg-white text-[#0F172A] border border-gray-200 shadow px-8 py-4 rounded-2xl text-base font-bold hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3"
                        >
                            <ShoppingBag size={20} className="text-[#EA580C]" /> Buyer Portal
                        </Link>
                        <Link
                            to="/admin/login"
                            className="text-gray-500 hover:text-[#059669] px-5 py-4 rounded-2xl text-sm font-medium transition flex items-center gap-2"
                        >
                            <Truck size={16} /> Logistics Admin
                        </Link>
                    </div>

                    {/* Live Metric Stat Pills */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 max-w-xl">
                        <div>
                            <div className="text-2xl font-bold font-mono text-[#0F172A]">₹0</div>
                            <div className="text-xs text-gray-500 mt-0.5">Middleman Fee</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono text-[#059669]">3.2 hrs</div>
                            <div className="text-xs text-gray-500 mt-0.5">Average Pickup ETA</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono text-[#F59E0B]">99.4%</div>
                            <div className="text-xs text-gray-500 mt-0.5">AI Grading Accuracy</div>
                        </div>
                    </div>
                </div>

                {/* 3D Farm Photo Hero Card */}
                <div className="lg:col-span-5 perspective-1000">
                    <TiltCard3D className="bg-white border border-gray-200/80 p-5 shadow-2xl rounded-3xl">
                        {/* Card Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 layer-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <span className="text-xs font-mono text-gray-400 ml-2">agriconnect_live_field.sih</span>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-mono border border-emerald-300 animate-pulse font-bold">
                                LIVE
                            </span>
                        </div>

                        {/* Farm Photo Main Display */}
                        <div className="relative my-4 rounded-2xl overflow-hidden h-64 layer-3">
                            {/* Actual Farm Photo */}
                            <img
                                src="/farm_hero.jpg"
                                alt="Indian Farm Field at Golden Hour"
                                className="w-full h-full object-cover"
                            />
                            {/* Green Gradient Overlay for readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#022C22]/70 via-transparent to-transparent" />

                            {/* Scanning Laser Line */}
                            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_12px_#10B981] animate-laser z-20 pointer-events-none" />

                            {/* Floating Badge 1: AI Grade */}
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-emerald-300 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-float-badge">
                                <Sparkles size={14} className="text-[#059669]" />
                                <span className="text-xs font-bold text-[#059669] font-mono">Grade A (98.4%)</span>
                            </div>

                            {/* Floating Badge 2: Location Tag */}
                            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-float-subtle">
                                <CheckCircle2 size={14} className="text-[#10B981]" />
                                <span className="text-xs font-semibold text-gray-800">Haveli, Pune — Verified Farm</span>
                            </div>

                            {/* Bottom farmer name label */}
                            <div className="absolute bottom-3 right-3 bg-[#022C22]/90 px-2.5 py-1 rounded-lg">
                                <span className="text-[11px] font-mono text-[#34D399] font-bold">Ramesh Patel · 4.5 Acres</span>
                            </div>
                        </div>

                        {/* Live Stats Row (light clean) */}
                        <div className="grid grid-cols-3 gap-3 layer-2">
                            <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="text-base font-bold font-mono text-[#059669]">₹26/kg</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Today's Rate</div>
                            </div>
                            <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="text-base font-bold font-mono text-amber-700">+18%</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Demand Surge</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="text-base font-bold font-mono text-gray-800">450kg</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Ready to Ship</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-400 layer-1">
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={14} className="text-[#F59E0B]" />
                                <span>Peak harvest season active</span>
                            </div>
                            <div className="text-[#059669] font-bold">₹0 Middleman Cut</div>
                        </div>
                    </TiltCard3D>
                </div>
            </header>

            {/* 3. The Problem & Reality Breakdown */}
            <section className="relative z-10 py-16 px-6 md:px-12 bg-[#F0FDF4] border-y border-emerald-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
                            Why the Traditional Agricultural Chain is Broken
                        </h2>
                        <p className="text-gray-500 text-base">
                            Indian farmers toil for months only to lose the majority of their income to opaque middlemen layers and uncoordinated transit.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TiltCard3D className="bg-white border border-red-200 p-8 rounded-3xl shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 font-bold text-2xl border border-red-100">
                                4-6
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Intermediary Layers</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Village brokers, mandi commission agents, wholesalers, and sub-dealers each take an 8-15% cut before produce reaches buyers.
                            </p>
                        </TiltCard3D>

                        <TiltCard3D className="bg-white border border-amber-200 p-8 rounded-3xl shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 font-bold text-2xl border border-amber-100">
                                32%
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Post-Harvest Spoilage</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Unpredictable pickup windows and fragmented transport routes leave perishable crops rotting in extreme heat.
                            </p>
                        </TiltCard3D>

                        <TiltCard3D className="bg-white border border-emerald-200 p-8 rounded-3xl shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center mb-6 font-bold text-2xl border border-emerald-100">
                                70%+
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] mb-2">AgriConnect Margin</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                By connecting directly with bulk buyers and smart route optimization, farmers retain over 75% of the final consumer value.
                            </p>
                        </TiltCard3D>
                    </div>
                </div>
            </section>

            {/* 4. Automated 3D Tech Demonstration Suite */}
            <section id="automation" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4 font-mono">
                        <Zap size={14} /> AUTOMATED INTELLIGENCE SUITE
                    </div>
                    <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#0F172A] mb-4">
                        State-of-the-Art Automation
                    </h2>
                    <p className="text-gray-500 text-base md:text-lg">
                        Watch our automated algorithms in real-time action: from vision AI grading to autonomous dispatch routing.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Automation Module 1: AI Vision Quality Scanner */}
                    <TiltCard3D className="bg-gradient-to-b from-[#0F2D22] to-[#081C15] border border-[#10B981]/30 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-[#10B981]/20 text-[#34D399] rounded-xl border border-[#10B981]/30">
                                    <Camera size={22} />
                                </div>
                                <span className="text-xs font-mono text-[#34D399] bg-[#10B981]/15 px-2.5 py-1 rounded-full border border-[#10B981]/30">
                                    Vision AI Active
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Automated Quality Grading</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Smartphone camera or WhatsApp photo triggers instant defect detection and standardized grade assignment.
                            </p>

                            {/* Interactive Scan Simulator Box */}
                            <div className="bg-[#051510] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-grid opacity-20" />
                                <div className="absolute left-0 right-0 h-0.5 bg-[#10B981] shadow-[0_0_12px_#10B981] animate-laser" />
                                <div className="flex items-center justify-center h-32 text-6xl">
                                    {currentCrop.img}
                                </div>
                                <div className="mt-2 space-y-1.5 text-xs font-mono">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Coloration:</span> <span className="text-[#34D399]">98% Uniform</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Surface Firmness:</span> <span className="text-[#34D399]">Optimal</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Assigned Tier:</span> <span className="text-[#F59E0B] font-bold">{currentCrop.grade}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                            <span>Zero human bias</span>
                            <span className="text-[#34D399] font-mono">Instant Buyer Trust</span>
                        </div>
                    </TiltCard3D>

                    {/* Automation Module 2: Live Dynamic Route Optimizer */}
                    <TiltCard3D className="bg-gradient-to-b from-[#0F2D22] to-[#081C15] border border-[#10B981]/30 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-[#EA580C]/20 text-[#F97316] rounded-xl border border-[#EA580C]/30">
                                    <Truck size={22} />
                                </div>
                                <span className="text-xs font-mono text-[#F97316] bg-[#EA580C]/15 px-2.5 py-1 rounded-full border border-[#EA580C]/30">
                                    OR-Tools Routing
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Automated Route Optimization</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Auto-aggregates nearby farmer pickups into a single multi-stop loop to slash transport costs by 40%.
                            </p>

                            {/* Interactive Simulated Map Box */}
                            <div className="bg-[#051510] border border-white/10 rounded-2xl p-4 relative h-36 overflow-hidden flex items-center justify-center">
                                {/* Route Vector with Waypoints */}
                                <svg className="w-full h-full" viewBox="0 0 280 120">
                                    {/* Base Line */}
                                    <path
                                        d="M 20 90 Q 90 20, 160 80 T 260 30"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.15)"
                                        strokeWidth="3"
                                    />
                                    {/* Animated Active Route */}
                                    <path
                                        d="M 20 90 Q 90 20, 160 80 T 260 30"
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="3"
                                        className="animate-route-dash"
                                    />

                                    {/* Waypoint 1: Farm A */}
                                    <circle cx="20" cy="90" r="6" fill="#10B981" />
                                    <text x="12" y="112" fill="#A7F3D0" fontSize="9" fontFamily="monospace">Farm 1</text>

                                    {/* Waypoint 2: Farm B */}
                                    <circle cx="115" cy="45" r="6" fill="#10B981" />
                                    <text x="105" y="32" fill="#A7F3D0" fontSize="9" fontFamily="monospace">Farm 2</text>

                                    {/* Waypoint 3: Farm C */}
                                    <circle cx="185" cy="82" r="6" fill="#10B981" />
                                    <text x="175" y="104" fill="#A7F3D0" fontSize="9" fontFamily="monospace">Farm 3</text>

                                    {/* Destination: Wholesale Hub */}
                                    <circle cx="260" cy="30" r="8" fill="#F97316" />
                                    <text x="235" y="20" fill="#FDBA74" fontSize="9" fontFamily="monospace">Hub (Pune)</text>
                                </svg>

                                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#34D399] bg-[#022C22]/80 px-2 py-0.5 rounded border border-[#10B981]/30">
                                    Simulated ETA: 42 Mins
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                            <span>Saved 14.8 km per run</span>
                            <span className="text-[#F97316] font-mono font-bold">-38% Fuel Burn</span>
                        </div>
                    </TiltCard3D>

                    {/* Automation Module 3: AI Price & Demand Forecaster */}
                    <TiltCard3D className="bg-gradient-to-b from-[#0F2D22] to-[#081C15] border border-[#10B981]/30 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-[#F59E0B]/20 text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
                                    <BarChart3 size={22} />
                                </div>
                                <span className="text-xs font-mono text-[#F59E0B] bg-[#F59E0B]/15 px-2.5 py-1 rounded-full border border-[#F59E0B]/30">
                                    Predictive AI
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Demand & Price Forecasting</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Analyzes historical mandi arrivals, weather forecasts, and festival spikes to tell farmers exact harvest timing.
                            </p>

                            {/* Interactive Price Predictor Slider */}
                            <div className="bg-[#051510] border border-white/10 rounded-2xl p-4">
                                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-2">
                                    <span>Tomato Price Horizon:</span>
                                    <span className="text-[#34D399] font-bold">+{forecastDay * 6}% Potential</span>
                                </div>

                                {/* Dynamic Visual Bar Graph */}
                                <div className="h-24 flex items-end justify-between gap-2 pt-4 px-2">
                                    {[18, 20, 22, 26, 29, 32, 30].map((val, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                            <div
                                                className={`w-full rounded-t-md transition-all duration-300 ${idx === forecastDay
                                                    ? 'bg-[#10B981] shadow-[0_0_10px_#10B981]'
                                                    : 'bg-white/15'
                                                    }`}
                                                style={{ height: `${(val / 35) * 100}%` }}
                                            />
                                            <span className="text-[9px] font-mono text-gray-400">D+{idx + 1}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="6"
                                        value={forecastDay}
                                        onChange={(e) => setForecastDay(Number(e.target.value))}
                                        className="w-full accent-[#10B981] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                            <span>Hold recommendation</span>
                            <span className="text-[#34D399] font-mono font-bold">Harvest in Day {forecastDay + 1}</span>
                        </div>
                    </TiltCard3D>
                </div>
            </section>

            {/* 5. How It Works (Farmers & Buyers Tabbed) */}
            <section id="how" className="relative z-10 py-20 px-6 md:px-12 bg-[#021A13]/80 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="font-serif text-4xl font-bold text-white mb-4">How AgriConnect Works</h2>
                        <p className="text-gray-400 text-base">Simple 3-step workflow designed for zero digital friction.</p>

                        <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 mt-6 backdrop-blur-md">
                            <button
                                onClick={() => setActiveTab('farmer')}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'farmer'
                                    ? 'bg-[#10B981] text-[#022C22] shadow-lg shadow-[#10B981]/30'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                            >
                                <Sprout size={16} /> For Farmers
                            </button>
                            <button
                                onClick={() => setActiveTab('buyer')}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'buyer'
                                    ? 'bg-[#EA580C] text-white shadow-lg shadow-[#EA580C]/30'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                            >
                                <ShoppingBag size={16} /> For Buyers & Wholesalers
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {activeTab === 'farmer' ? (
                            <>
                                <TiltCard3D className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 text-[#34D399] flex items-center justify-center mb-6">
                                        <Camera size={26} />
                                    </div>
                                    <div className="text-xs font-mono text-[#34D399] mb-1 font-bold">STEP 01</div>
                                    <h3 className="text-xl font-bold text-white mb-3">Snap & List Produce</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Upload a crop photo via app, Web, or simple WhatsApp bot. Our AI scans quality, determines grade, and suggests market price.
                                    </p>
                                </TiltCard3D>

                                <TiltCard3D className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 text-[#34D399] flex items-center justify-center mb-6">
                                        <Users size={26} />
                                    </div>
                                    <div className="text-xs font-mono text-[#34D399] mb-1 font-bold">STEP 02</div>
                                    <h3 className="text-xl font-bold text-white mb-3">Instant Match & Aggregation</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Your produce is automatically matched with verified institutional buyers, restaurants, and retail cooperatives.
                                    </p>
                                </TiltCard3D>

                                <TiltCard3D className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 text-[#34D399] flex items-center justify-center mb-6">
                                        <Truck size={26} />
                                    </div>
                                    <div className="text-xs font-mono text-[#34D399] mb-1 font-bold">STEP 03</div>
                                    <h3 className="text-xl font-bold text-white mb-3">Farm Gate Pickup & Payout</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Smart logistics vehicle arrives at your field. Confirm with 4-digit OTP and receive guaranteed payment direct to UPI/Bank.
                                    </p>
                                </TiltCard3D>
                            </>
                        ) : (
                            <>
                                <TiltCard3D className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#EA580C]/20 text-[#F97316] flex items-center justify-center mb-6">
                                        <ShoppingBag size={26} />
                                    </div>
                                    <div className="text-xs font-mono text-[#F97316] mb-1 font-bold">STEP 01</div>
                                    <h3 className="text-xl font-bold text-white mb-3">Browse Verified Harvests</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Filter fresh produce by crop type, quality tier (Grade A/B), organic status, and distance from your facility.
                                    </p>
                                </TiltCard3D>

                                <TiltCard3D className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#EA580C]/20 text-[#F97316] flex items-center justify-center mb-6">
                                        <Layers size={26} />
                                    </div>
                                    <div className="text-xs font-mono text-[#F97316] mb-1 font-bold">STEP 02</div>
                                    <h3 className="text-xl font-bold text-white mb-3">Multi-Farm Auto-Order</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Need 5 tonnes? Our engine automatically pools harvest batches from 10 smallholder farmers into a single seamless invoice.
                                    </p>
                                </TiltCard3D>

                                <TiltCard3D className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#EA580C]/20 text-[#F97316] flex items-center justify-center mb-6">
                                        <MapPin size={26} />
                                    </div>
                                    <div className="text-xs font-mono text-[#F97316] mb-1 font-bold">STEP 03</div>
                                    <h3 className="text-xl font-bold text-white mb-3">Live Doorstep Delivery</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Track delivery van GPS in real time with cold-chain and freshness telemetry straight to your depot.
                                    </p>
                                </TiltCard3D>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* 6. Core Features 3D Cards */}
            <section id="features" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="font-serif text-4xl font-bold text-white mb-4">Core Ecosystem Capabilities</h2>
                    <p className="text-gray-400 text-base">Engineered specifically for rural internet resilience & Indian agriculture.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <TiltCard3D className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#10B981]/50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 text-[#34D399] flex items-center justify-center mb-4">
                            <ShoppingBag size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Digital Marketplace</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Direct listing, real-time negotiation, and transparent escrow payouts for every transaction.
                        </p>
                    </TiltCard3D>

                    <TiltCard3D className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#10B981]/50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 text-[#34D399] flex items-center justify-center mb-4">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">AI Demand Engine</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Mandi price predictions 7 days in advance to protect farmers from post-harvest market glut.
                        </p>
                    </TiltCard3D>

                    <TiltCard3D className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#EA580C]/50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-[#EA580C]/20 text-[#F97316] flex items-center justify-center mb-4">
                            <Truck size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Smart Route Pooling</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Multi-farm pickup optimization algorithm saving up to 40% in logistics and fuel expenses.
                        </p>
                    </TiltCard3D>

                    <TiltCard3D className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#EA580C]/50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-[#EA580C]/20 text-[#F97316] flex items-center justify-center mb-4">
                            <Languages size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Voice & WhatsApp Bot</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            List crops and receive voice alerts in Hindi, Marathi, Tamil, Telugu, and Bengali without typing.
                        </p>
                    </TiltCard3D>
                </div>
            </section>

            {/* 7. Multilingual Callout Section */}
            <section className="relative z-10 py-16 px-6 md:px-12 bg-gradient-to-b from-[#031D15] to-[#071510] border-y border-white/10">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 text-[#34D399] text-xs font-mono">
                        <Languages size={16} /> MULTILINGUAL ACCESSIBILITY
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                        Designed for Every Indian Farmer
                    </h2>
                    <p className="text-lg text-gray-300 italic">
                        "{activeLang.greeting}"
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        {LANGS.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => setActiveLang(l)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeLang.code === l.code
                                    ? 'bg-[#10B981] text-[#022C22] shadow-lg shadow-[#10B981]/30 scale-105'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                    }`}
                            >
                                {l.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. Modern Footer */}
            <footer className="relative z-10 bg-[#03130E] border-t border-white/10 pt-16 pb-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-2xl font-bold text-white font-serif">
                            <Sprout className="text-[#10B981]" /> AgriConnect
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Direct Agricultural Trade, AI Quality Verification & Smart Logistics Network for Bharat.
                        </p>
                        <div className="text-xs font-mono text-[#34D399]">
                            Smart India Hackathon 2024 / 2026 Initiative
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 text-sm font-mono tracking-wider">PLATFORM</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/farmer" className="hover:text-[#34D399] transition">Farmer Dashboard</Link></li>
                            <li><Link to="/buyer" className="hover:text-[#34D399] transition">Buyer Marketplace</Link></li>
                            <li><Link to="/logistics" className="hover:text-[#34D399] transition">Logistics Control</Link></li>
                            <li><Link to="/admin/login" className="hover:text-[#34D399] transition">Admin Portal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 text-sm font-mono tracking-wider">TEAM</h4>
                        <ul className="space-y-2 text-sm text-gray-400 font-mono text-xs">
                            <li>• HackOS Team Lead</li>
                            <li>• AI & Computer Vision Dev</li>
                            <li>• Backend & Logistics Architect</li>
                            <li>• Product & Frontend Designer</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 text-sm font-mono tracking-wider">CONTACT</h4>
                        <p className="text-sm text-gray-400">Smart India Hackathon</p>
                        <p className="text-[#34D399] font-medium text-sm mt-1">contact@agriconnect.gov.in</p>
                        <div className="mt-4 flex gap-2">
                            <Link to="/register" className="bg-[#10B981]/20 text-[#34D399] px-4 py-2 rounded-xl text-xs font-bold border border-[#10B981]/30 hover:bg-[#10B981]/30 transition">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                    <p>© {new Date().getFullYear()} AgriConnect. Open Source & Built for SIH.</p>
                    <div className="flex gap-6">
                        <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
                        <span className="hover:text-gray-400 cursor-pointer">API Docs</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}