import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingBag, TrendingUp, Truck,
    MessageCircle, Wallet, UserCheck, Plus, Mic, Camera,
    CheckCircle2, Sparkles, MapPin, FileText, Bell, Search,
    ArrowUpRight, Clock, ShieldCheck, ChevronRight, X, Phone,
    DollarSign, Filter, RefreshCw, AlertCircle, Sprout, ArrowRight,
    Zap, Check, Share2, Download, Eye, Layers
} from 'lucide-react';
import axios from 'axios';
import TiltCard3D from '../components/TiltCard3D';

export default function FarmerDashboard() {
    const [activeView, setActiveView] = useState('overview');
    const [showAddListing, setShowAddListing] = useState(false);

    const initialSampleProducts = [
        { id: 1, crop_name: 'Organic Roma Tomatoes', category: 'Vegetable', variety: 'Roma Hybrid', quantity_kg: 450, unit: 'kg', price_per_kg: 24, quality_grade: 'Grade A', pickup_location: 'Haveli, Pune', organic: 'Yes', image_url: null, mandiDemand: '+14% High' },
        { id: 2, crop_name: 'Nashik Red Onions', category: 'Vegetable', variety: 'Garwa', quantity_kg: 1200, unit: 'kg', price_per_kg: 19, quality_grade: 'Grade A', pickup_location: 'Pune Field 2', organic: 'No', image_url: null, mandiDemand: '+8% Rising' },
        { id: 3, crop_name: 'Green Crisp Capsicum', category: 'Vegetable', variety: 'Indra', quantity_kg: 350, unit: 'kg', price_per_kg: 34, quality_grade: 'Grade A', pickup_location: 'Pune Polyhouse', organic: 'Yes', image_url: null, mandiDemand: '+22% Peak' },
    ];

    const [products, setProducts] = useState(initialSampleProducts);
    const [loading, setLoading] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const farmerName = localStorage.getItem('userName') || 'Ramesh Patel';

    const [newProduct, setNewProduct] = useState({
        crop_name: '', category: 'Vegetable', variety: '', quantity_kg: '', unit: 'kg',
        moq: '', price_per_kg: '', negotiable: 'Yes', harvest_date: '', shelf_life: '',
        available_from: '', organic: 'No', pickup_location: 'Auto-detected: Pune, Maharashtra', pickup_window: 'Morning'
    });
    const [aiGrade, setAiGrade] = useState('Pending');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [notificationCount, setNotificationCount] = useState(3);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/products/?farmer_name=${encodeURIComponent(farmerName)}`);
            if (res.data && res.data.length > 0) {
                setProducts(res.data);
            } else {
                setProducts(initialSampleProducts);
            }
        } catch (error) {
            console.error("API error fetching products:", error);
            setProducts(initialSampleProducts);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            triggerAiScanAutomation();
        }
    };

    const triggerAiScanAutomation = () => {
        setIsScanning(true);
        showToast('🔍 AI Vision Scanner: Analyzing fruit firmness, skin texture & size uniformity...');
        setTimeout(() => {
            setIsScanning(false);
            setAiGrade('Grade A (Export Quality)');
            showToast('✨ AI Verification Complete: Grade A (Export Quality) • 98.4% Confidence');
        }, 1800);
    };

    const handleAddProduct = async (e) => {
        if (e) e.preventDefault();
        if (!newProduct.crop_name || !newProduct.quantity_kg || !newProduct.price_per_kg) {
            showToast('⚠️ Please fill required fields: Crop Name, Quantity, and Price');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('farmer_name', farmerName);
            formData.append('crop_name', newProduct.crop_name);
            formData.append('category', newProduct.category);
            formData.append('variety', newProduct.variety);
            formData.append('quantity_kg', newProduct.quantity_kg);
            formData.append('unit', newProduct.unit);
            formData.append('moq', newProduct.moq);
            formData.append('price_per_kg', newProduct.price_per_kg);
            formData.append('negotiable', newProduct.negotiable);
            formData.append('harvest_date', newProduct.harvest_date);
            formData.append('available_from', newProduct.available_from);
            formData.append('shelf_life', newProduct.shelf_life);
            formData.append('organic', newProduct.organic);
            formData.append('pickup_location', newProduct.pickup_location);
            formData.append('pickup_window', newProduct.pickup_window);
            formData.append('quality_grade', aiGrade === 'Pending' ? 'Grade A' : aiGrade);
            if (imageFile) formData.append('image', imageFile);

            await axios.post('http://127.0.0.1:8000/api/products/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast('✅ Produce published successfully to Buyer Marketplace!');
            setNewProduct({
                crop_name: '', category: 'Vegetable', variety: '', quantity_kg: '', unit: 'kg',
                moq: '', price_per_kg: '', negotiable: 'Yes', harvest_date: '', shelf_life: '',
                available_from: '', organic: 'No', pickup_location: 'Auto-detected: Pune, Maharashtra', pickup_window: 'Morning'
            });
            setImageFile(null);
            setImagePreview(null);
            setAiGrade('Pending');
            setShowAddListing(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            const created = {
                id: Date.now(),
                farmer_name: farmerName,
                crop_name: newProduct.crop_name,
                category: newProduct.category,
                quantity_kg: newProduct.quantity_kg,
                unit: newProduct.unit,
                price_per_kg: newProduct.price_per_kg,
                quality_grade: aiGrade === 'Pending' ? 'Grade A' : aiGrade,
                pickup_location: newProduct.pickup_location,
                image_url: imagePreview,
                organic: newProduct.organic,
                mandiDemand: '+18% High'
            };
            setProducts([created, ...products]);
            setShowAddListing(false);
            showToast('✅ Produce published successfully to local marketplace session!');
        }
    };

    const handleSuggestPrice = () => {
        const suggested = Math.floor(Math.random() * (36 - 25 + 1) + 25);
        setNewProduct(prev => ({ ...prev, price_per_kg: suggested }));
        showToast(`✨ AI Mandi Algorithm: Recommends ₹${suggested}/${newProduct.unit || 'kg'} (+18% higher than local broker)`);
    };

    const handleVoiceAssist = () => {
        setIsVoiceActive(true);
        showToast('🎙️ AI Listening... "Add 500kg Tomatoes at 26 rupees per kg"');
        setTimeout(() => {
            setNewProduct(prev => ({
                ...prev,
                crop_name: 'Hybrid Salad Tomatoes',
                quantity_kg: '500',
                price_per_kg: '26',
                category: 'Vegetable',
                variety: 'Avinash-2',
                unit: 'kg'
            }));
            setAiGrade('Grade A (Export Quality)');
            setIsVoiceActive(false);
            setShowAddListing(true);
            showToast('✅ Voice AI Auto-filled: 500kg Hybrid Tomatoes at ₹26/kg!');
        }, 1800);
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'listings', label: 'My Listings', icon: Package, badge: products.length },
        { id: 'orders', label: 'Wholesale Orders', icon: ShoppingBag, badge: '2 Active' },
        { id: 'forecast', label: 'Mandi Forecast', icon: TrendingUp },
        { id: 'logistics', label: 'Logistics & Pickup', icon: Truck },
        { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
        { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet },
        { id: 'profile', label: 'Kisan Profile', icon: UserCheck },
    ];

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans">
            {/* Animated Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#062319] border border-[#10B981] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#34D399]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* --- TOP STICKY DASHBOARD NAVBAR (HIGH-CONTRAST EMERALD HEADER) --- */}
            <header className="sticky top-0 z-40 bg-[#062319] text-white border-b border-[#10B981]/25 shadow-lg">
                {/* 1. Main Header Strip */}
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
                    {/* Brand & Mode Tag */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl flex items-center justify-center text-[#022C22] shadow-md shadow-[#10B981]/30 group-hover:scale-105 transition-transform">
                                <Sprout size={22} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <span className="text-xl font-extrabold text-white font-serif tracking-tight">Agri<span className="text-[#34D399]">Connect</span></span>
                                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest bg-[#10B981]/20 text-[#34D399] px-2 py-0.5 rounded border border-[#10B981]/30">Farmer Hub</span>
                            </div>
                        </Link>
                    </div>

                    {/* Center Live Mandi Ticker */}
                    <div className="hidden lg:flex items-center gap-4 bg-[#03150E] px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                        </span>
                        <span className="text-gray-300">Pune APMC: Tomato <span className="text-[#34D399] font-bold">₹26/kg (▲ 8%)</span></span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-300">Onion <span className="text-[#34D399] font-bold">₹20/kg (▲ 4%)</span></span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-300">Capsicum <span className="text-[#34D399] font-bold">₹34/kg (▲ 12%)</span></span>
                    </div>

                    {/* Right Controls & Profile */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleVoiceAssist}
                            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                                isVoiceActive ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-white/10 hover:bg-white/15 text-[#34D399] border-white/15'
                            }`}
                            title="Voice AI Listing Creator"
                        >
                            <Mic size={16} />
                            <span className="hidden md:inline">Voice Assistant</span>
                        </button>

                        <button
                            onClick={() => { setShowAddListing(true); setActiveView('listings'); }}
                            className="bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#10B981]/25 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={16} /> <span>Add Listing</span>
                        </button>

                        <button
                            onClick={() => showToast("🔔 3 buyers in Pune cluster are actively bidding on your produce!")}
                            className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 hover:text-white transition"
                        >
                            <Bell size={18} />
                            {notificationCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10B981] rounded-full ring-2 ring-[#062319]" />
                            )}
                        </button>

                        {/* Farmer User Profile Pill */}
                        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-[#022C22] font-bold flex items-center justify-center text-xs">
                                {farmerName[0] || 'R'}
                            </div>
                            <div className="text-left hidden md:block">
                                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                                    {farmerName}
                                    <CheckCircle2 size={12} className="text-[#10B981]" />
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">Kisan ID #4920</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Top Sub-Header Navigation Tabs Bar */}
                <div className="px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/10 py-2 bg-[#041B13]">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-[#10B981] text-[#022C22] shadow-md shadow-[#10B981]/25 font-bold'
                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                                {item.badge !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                                        isActive ? 'bg-[#022C22] text-[#34D399]' : 'bg-white/10 text-gray-300'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* --- MAIN DASHBOARD CONTENT (BALANCED LIGHT & DARK SURFACES) --- */}
            <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
                {/* --- 1. OVERVIEW VIEW --- */}
                {activeView === 'overview' && (
                    <div className="space-y-8">
                        {/* Welcome Hero Banner with High-Tech Dark Surface */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#062319] via-[#0A3324] to-[#041A13] border border-[#10B981]/30 p-6 sm:p-8 shadow-xl text-white">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/15 rounded-full filter blur-[80px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 bg-[#10B981]/20 text-[#34D399] px-3 py-1 rounded-full text-xs font-mono border border-[#10B981]/30">
                                        <UserCheck size={14} /> Aadhaar-Verified Kisan ID #4920
                                    </div>
                                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                                        Namaste, {farmerName}! 🌾
                                    </h1>
                                    <p className="text-gray-300 text-sm max-w-xl">
                                        Your harvest is currently live across 3 regional procurement clusters. Predicted demand for Tomatoes is rising +18% this week.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => { setShowAddListing(true); setActiveView('listings'); }}
                                        className="bg-[#10B981] hover:bg-[#34D399] text-[#022C22] font-extrabold px-5 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-[#10B981]/30 transition"
                                    >
                                        <Plus size={18} /> Add Harvest Lot
                                    </button>
                                    <button
                                        onClick={() => setActiveView('forecast')}
                                        className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-5 py-3 rounded-2xl text-sm font-semibold transition flex items-center gap-2"
                                    >
                                        <TrendingUp size={18} className="text-[#F59E0B]" /> Price Forecast
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4 Crisp White Stat Cards with Subtle Borders & Soft Depth */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-[#10B981] transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Harvest Lots</span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                        <Package size={18} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">{products.length}</div>
                                <div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                                    <ArrowUpRight size={14} /> +2 Listed this week
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-[#EA580C] transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending Orders</span>
                                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                                        <ShoppingBag size={18} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">2 Active</div>
                                <div className="text-[11px] text-[#EA580C] mt-2 flex items-center gap-1 font-semibold">
                                    <Clock size={14} /> 1 Pickup scheduled today
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-emerald-500 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Direct Earnings</span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                        <Wallet size={18} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">₹48,500</div>
                                <div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                                    <CheckCircle2 size={13} /> 100% Escrow Settled
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-amber-500 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Middleman Margin Saved</span>
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                        <TrendingUp size={18} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">+34.8%</div>
                                <div className="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-semibold">
                                    <span>vs APMC Commission</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Listings Overview Grid (Crisp Light Cards) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-[#0F172A] font-serif">Active Produce Catalog</h2>
                                    <p className="text-xs text-gray-500">Live batches ready for buyer wholesale matches</p>
                                </div>
                                <button
                                    onClick={() => setActiveView('listings')}
                                    className="text-xs text-[#059669] hover:underline flex items-center gap-1 font-bold"
                                >
                                    Manage All Listings ({products.length}) <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {products.map((p) => (
                                    <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="h-40 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.crop_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-6xl filter drop-shadow-md">
                                                        {p.crop_name?.toLowerCase().includes('tomato') ? '🍅' : p.crop_name?.toLowerCase().includes('onion') ? '🧅' : p.crop_name?.toLowerCase().includes('pepper') || p.crop_name?.toLowerCase().includes('capsicum') ? '🫑' : '🥔'}
                                                    </span>
                                                )}
                                                <span className="absolute top-3 right-3 bg-white/95 text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">
                                                    {p.quality_grade || 'Grade A'}
                                                </span>
                                                {p.organic === 'Yes' && (
                                                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                                                        Organic
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-[#0F172A]">{p.crop_name}</h3>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} className="text-[#059669]" /> {p.pickup_location || 'Pune Field'}
                                                        </p>
                                                    </div>
                                                    <span className="text-xl font-bold font-mono text-[#059669]">
                                                        ₹{p.price_per_kg}/{p.unit || 'kg'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-100">
                                                    <span>Available: <b className="text-gray-900">{p.quantity_kg} {p.unit || 'kg'}</b></span>
                                                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                                                        {p.mandiDemand || 'High Demand'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 pt-0 flex gap-2">
                                            <button
                                                onClick={() => showToast(`Opening batch details for ${p.crop_name}`)}
                                                className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition"
                                            >
                                                Edit Lot
                                            </button>
                                            <button
                                                onClick={() => showToast(`✅ Marked ${p.crop_name} as dispatched & payment queued`)}
                                                className="py-2 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition"
                                            >
                                                Dispatch
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 2. MY LISTINGS VIEW (AI VISION QUALITY SCANNER & FORM) --- */}
                {activeView === 'listings' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A] font-serif">My Produce Listings</h2>
                                <p className="text-xs text-gray-500">Manage, edit, or publish verified harvest batches</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleVoiceAssist}
                                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                                        isVoiceActive ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <Mic size={16} /> Voice Fill Form
                                </button>
                                <button
                                    onClick={() => setShowAddListing(!showAddListing)}
                                    className="bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] font-extrabold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-[#10B981]/25 hover:scale-105 transition"
                                >
                                    {showAddListing ? <X size={18} /> : <Plus size={18} />}
                                    {showAddListing ? 'Close Form' : 'Add New Product'}
                                </button>
                            </div>
                        </div>

                        {/* High-Tech Expandable Add Listing Section */}
                        {showAddListing && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/40 shadow-xl space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#0F172A]">Create New Harvest Listing</h3>
                                            <p className="text-xs text-gray-500">Integrated with AI Vision Quality Scanner & Price Recommender</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddListing(false)} className="text-gray-400 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid lg:grid-cols-12 gap-8">
                                    {/* Left Form Inputs */}
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Crop Name *</label>
                                                <input
                                                    list="crop-suggestions"
                                                    placeholder="e.g. Tomato, Potato, Onion"
                                                    value={newProduct.crop_name}
                                                    onChange={(e) => setNewProduct({ ...newProduct, crop_name: e.target.value })}
                                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition"
                                                    required
                                                />
                                                <datalist id="crop-suggestions">
                                                    <option value="Tomato" />
                                                    <option value="Potato" />
                                                    <option value="Onion" />
                                                    <option value="Green Chilli" />
                                                    <option value="Capsicum" />
                                                </datalist>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Category</label>
                                                <select
                                                    value={newProduct.category}
                                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition"
                                                >
                                                    <option>Vegetable</option>
                                                    <option>Fruit</option>
                                                    <option>Grain</option>
                                                    <option>Pulses</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Variety (Optional)</label>
                                                <input
                                                    placeholder="e.g. Roma, Hybrid"
                                                    value={newProduct.variety}
                                                    onChange={(e) => setNewProduct({ ...newProduct, variety: e.target.value })}
                                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Total Quantity *</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={newProduct.quantity_kg}
                                                        onChange={(e) => setNewProduct({ ...newProduct, quantity_kg: e.target.value })}
                                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition"
                                                        required
                                                    />
                                                    <select
                                                        value={newProduct.unit}
                                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                                        className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none"
                                                    >
                                                        <option>kg</option>
                                                        <option>Quintal</option>
                                                        <option>Tonne</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Min Order Qty (MOQ)</label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 50"
                                                    value={newProduct.moq}
                                                    onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })}
                                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Asking Price per {newProduct.unit || 'kg'} (₹) *</label>
                                                <input
                                                    type="number"
                                                    placeholder="Asking Price in ₹"
                                                    value={newProduct.price_per_kg}
                                                    onChange={(e) => setNewProduct({ ...newProduct, price_per_kg: e.target.value })}
                                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition"
                                                    required
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={handleSuggestPrice}
                                                    className="w-full p-3.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition shadow-sm"
                                                >
                                                    <Sparkles size={18} className="text-amber-600" /> AI Price Suggestion
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 py-2">
                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newProduct.negotiable === 'Yes'}
                                                    onChange={() => setNewProduct({ ...newProduct, negotiable: newProduct.negotiable === 'Yes' ? 'No' : 'Yes' })}
                                                    className="rounded accent-[#059669] w-4 h-4"
                                                />
                                                <span>Price Negotiable for Bulk</span>
                                            </label>

                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newProduct.organic === 'Yes'}
                                                    onChange={() => setNewProduct({ ...newProduct, organic: newProduct.organic === 'Yes' ? 'No' : 'Yes' })}
                                                    className="rounded accent-[#059669] w-4 h-4"
                                                />
                                                <span>Certified Organic / Pesticide-Free</span>
                                            </label>
                                        </div>

                                        {/* Real Camera / Photo Upload for AI Vision Grading */}
                                        <div className="p-6 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 text-center relative overflow-hidden">
                                            <Camera className="mx-auto text-emerald-700 mb-2" size={32} />
                                            <h4 className="text-sm font-bold text-gray-900">Upload Crop Photo for AI Vision Quality Assessment</h4>
                                            <p className="text-xs text-gray-500 mt-1">Neural computer vision checks size uniformity, ripeness, and blemishes</p>
                                            <div className="flex justify-center gap-3 mt-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="text-xs text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#059669] file:text-white hover:file:bg-[#047857] cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={triggerAiScanAutomation}
                                                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 transition shadow-sm"
                                                >
                                                    ⚡ Simulate AI Scan
                                                </button>
                                            </div>

                                            {isScanning && (
                                                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-emerald-800 font-bold animate-pulse">
                                                    <Sparkles size={14} /> AI Vision Scanner running inference...
                                                </div>
                                            )}

                                            {aiGrade !== 'Pending' && !isScanning && (
                                                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full text-xs font-mono font-bold border border-emerald-300 shadow-sm">
                                                    <CheckCircle2 size={14} className="text-emerald-700" /> AI Verified: {aiGrade}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleAddProduct}
                                                className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] py-4 rounded-xl font-extrabold text-base shadow-lg shadow-emerald-600/20 hover:scale-[1.01] transition"
                                            >
                                                Publish Listing to Marketplace
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowAddListing(false); showToast('Saved draft to local storage'); }}
                                                className="px-6 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold"
                                            >
                                                Save Draft
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Live Preview Card */}
                                    <div className="lg:col-span-4 space-y-4">
                                        <div className="text-xs font-mono text-gray-500 font-bold flex items-center gap-1">
                                            <Sparkles size={14} className="text-emerald-600" /> LIVE BUYER PREVIEW
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                                            <div className="h-44 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Crop Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center">
                                                        <span className="text-6xl">🌾</span>
                                                        <p className="text-[11px] text-gray-400 mt-1">Photo Preview Area</p>
                                                    </div>
                                                )}
                                                <span className="absolute top-3 right-3 bg-white text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">
                                                    {aiGrade}
                                                </span>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900">{newProduct.crop_name || 'Crop Name'}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} className="text-emerald-600" /> {newProduct.pickup_location}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold font-mono text-emerald-700">
                                                            ₹{newProduct.price_per_kg || '0'}/{newProduct.unit || 'kg'}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono">Direct Rate</span>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-600">
                                                    <span>Available: <b>{newProduct.quantity_kg || '0'} {newProduct.unit}</b></span>
                                                    {newProduct.organic === 'Yes' && (
                                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Organic</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Produce Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {products.map((p) => (
                                <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="h-40 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.crop_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-6xl">
                                                    {p.crop_name?.toLowerCase().includes('tomato') ? '🍅' : p.crop_name?.toLowerCase().includes('onion') ? '🧅' : p.crop_name?.toLowerCase().includes('capsicum') ? '🫑' : '🥔'}
                                                </span>
                                            )}
                                            <span className="absolute top-3 right-3 bg-white text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">
                                                {p.quality_grade || 'Grade A'}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{p.crop_name}</h3>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <MapPin size={12} className="text-[#059669]" /> {p.pickup_location || 'Haveli, Pune'}
                                                    </p>
                                                </div>
                                                <span className="text-xl font-bold font-mono text-[#059669]">
                                                    ₹{p.price_per_kg}/{p.unit || 'kg'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-3">
                                                Lot Volume: <span className="text-gray-900 font-bold">{p.quantity_kg} {p.unit || 'kg'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5 pt-0 flex gap-2">
                                        <button
                                            onClick={() => showToast(`Opening batch editor for ${p.crop_name}`)}
                                            className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition"
                                        >
                                            Edit Lot
                                        </button>
                                        <button
                                            onClick={() => showToast(`Marked ${p.crop_name} as sold! Instant payout initiated.`)}
                                            className="py-2 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#EA580C] text-xs font-bold rounded-xl transition"
                                        >
                                            Mark Sold
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- 3. ORDERS VIEW --- */}
                {activeView === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Wholesale & Aggregated Orders</h2>
                                <p className="text-xs text-gray-500">Live order matching and vehicle pickup dispatch</p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-800 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                                2 Active Pickups
                            </span>
                        </div>

                        <div className="space-y-4">
                            {/* Order Card 1 */}
                            <div className="bg-white border border-emerald-300 p-6 rounded-2xl shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-gray-100">
                                    <div>
                                        <span className="text-xs font-mono text-emerald-700 font-bold">ORDER #AG-8821</span>
                                        <h3 className="text-lg font-bold text-gray-900">BigBasket Procurement Hub (Pune)</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-700 font-mono">₹12,500</div>
                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">Pickup Scheduled</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <span className="text-gray-500 block">Produce</span>
                                        <span className="font-bold text-gray-900">500kg Hybrid Tomatoes</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Assigned Rate</span>
                                        <span className="font-bold text-gray-900">₹25.00 / kg</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Pickup Vehicle</span>
                                        <span className="font-bold text-gray-900">Tata Ace (MH-12-QE-4920)</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Driver Security OTP</span>
                                        <span className="font-bold text-[#EA580C] font-mono text-sm">4910</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="pt-2">
                                    <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
                                        <span className="text-emerald-700 font-bold">1. Order Matched ✓</span>
                                        <span className="text-emerald-700 font-bold">2. Van En Route 🚚</span>
                                        <span className="text-gray-400">3. OTP Confirmed</span>
                                        <span className="text-gray-400">4. UPI Settled</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-[#10B981] h-full w-1/2 rounded-full shadow-[0_0_10px_#10B981]" />
                                    </div>
                                </div>
                            </div>

                            {/* Order Card 2 */}
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-gray-100">
                                    <div>
                                        <span className="text-xs font-mono text-gray-500 font-bold">ORDER #AG-8790</span>
                                        <h3 className="text-lg font-bold text-gray-900">Kalyani Supermarket Chain</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 font-mono">₹24,000</div>
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-mono font-bold">Delivered & Paid</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <span className="text-gray-500 block">Produce</span>
                                        <span className="font-bold text-gray-900">1,200kg Red Onions</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Rate</span>
                                        <span className="font-bold text-gray-900">₹20.00 / kg</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Payout Status</span>
                                        <span className="font-bold text-emerald-700 font-mono">Credited to Bank</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Invoice</span>
                                        <button onClick={() => showToast('Downloading Tax Receipt PDF...')} className="text-emerald-700 underline font-semibold">
                                            Download Tax Receipt
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 4. MANDI PRICE FORECAST VIEW --- */}
                {activeView === 'forecast' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-mono mb-2 border border-amber-200">
                                    <Sparkles size={14} className="text-amber-600" /> AI Predictive Mandi Trends
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Mandi Demand & Price Forecasting</h2>
                                <p className="text-xs text-gray-500">7-Day outlook based on seasonal festival spikes & arrival volumes</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-mono text-emerald-900 font-bold">
                                Recommendation: <b>Hold Tomato harvest for Thursday (+27% profit)</b>
                            </div>
                        </div>

                        {/* Interactive Graph Simulation (Dark Contrast Box for Visual Punch) */}
                        <div className="bg-[#07241A] text-white p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl border border-[#10B981]/25">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white text-lg">Tomato APMC Price Trend (₹/kg)</h3>
                                    <p className="text-xs text-gray-300">Predictive neural simulation based on 5 regional wholesale yards</p>
                                </div>
                                <span className="text-xs font-mono text-[#34D399] bg-white/10 px-3 py-1 rounded-full">
                                    94.2% AI Accuracy
                                </span>
                            </div>

                            <div className="h-64 flex items-end justify-between gap-3 pt-8 pb-2 px-4 bg-[#031710] rounded-2xl border border-white/10 relative">
                                {[
                                    { day: 'Mon (Today)', price: 22, bar: 50, note: 'Base' },
                                    { day: 'Tue', price: 23, bar: 55, note: '+4%' },
                                    { day: 'Wed', price: 25, bar: 65, note: '+12%' },
                                    { day: 'Thu (Peak)', price: 28, bar: 88, note: '+27% Highest', peak: true },
                                    { day: 'Fri', price: 27, bar: 80, note: '+22%' },
                                    { day: 'Sat', price: 26, bar: 75, note: '+18%' },
                                    { day: 'Sun', price: 24, bar: 60, note: '+9%' },
                                ].map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer" onClick={() => showToast(`Price on ${d.day}: ₹${d.price}/kg (${d.note})`)}>
                                        <span className="text-xs font-mono font-bold text-white group-hover:text-[#34D399] transition">
                                            ₹{d.price}
                                        </span>
                                        <div
                                            className={`w-full rounded-t-xl transition-all duration-500 ${
                                                d.peak
                                                    ? 'bg-gradient-to-t from-[#10B981] to-[#34D399] shadow-[0_0_20px_#10B981]'
                                                    : 'bg-white/20 hover:bg-[#10B981]/60'
                                            }`}
                                            style={{ height: `${d.bar}%` }}
                                        />
                                        <span className="text-[11px] font-mono text-gray-300">{d.day}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-gray-400 block">Wholesale Demand Index</span>
                                    <span className="text-lg font-bold text-[#34D399]">High (8.4/10)</span>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-gray-400 block">Nearby Mandi Glut Risk</span>
                                    <span className="text-lg font-bold text-emerald-400">Low (No Excess Inflow)</span>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-gray-400 block">Suggested Action</span>
                                    <span className="text-lg font-bold text-[#F59E0B]">Harvest Thursday Morning</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 5. LOGISTICS & PICKUP VIEW --- */}
                {activeView === 'logistics' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Smart Farm-Gate Logistics</h2>
                                <p className="text-xs text-gray-500">Pooled vehicle aggregation and live driver dispatch</p>
                            </div>
                            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-mono font-bold border border-emerald-200">
                                Route Engine #OR-49
                            </span>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Live Pickup Details */}
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Assigned Van: Tata Ace (MH-12-QE-4920)</h3>
                                        <p className="text-xs text-gray-500">Driver: Santosh Jadhav • +91 98221 44102</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-500">Pickup Location:</span>
                                        <span className="text-gray-900 font-semibold">Survey No. 42, Haveli, Pune</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-500">Estimated Arrival:</span>
                                        <span className="text-emerald-700 font-bold font-mono">Today at 11:30 AM (In 25 mins)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-500">Aggregated Batch:</span>
                                        <span className="text-gray-900 font-semibold">500kg Tomatoes (Pooled with 2 other farms)</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-emerald-800 font-medium">Pickup Security OTP</div>
                                        <div className="text-2xl font-bold font-mono text-[#EA580C]">4910</div>
                                    </div>
                                    <button
                                        onClick={() => showToast('OTP shared with driver Santosh')}
                                        className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
                                    >
                                        Share with Driver
                                    </button>
                                </div>
                            </div>

                            {/* Simulated Route Visualizer (High Contrast Dark Box) */}
                            <div className="bg-[#07241A] text-white border border-white/10 p-6 rounded-2xl flex flex-col justify-between shadow-lg">
                                <h3 className="font-bold text-white text-sm mb-3">Live Multi-Stop Route Telemetry</h3>
                                <div className="bg-[#031710] h-48 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                                    <svg className="w-full h-full" viewBox="0 0 280 120">
                                        <path d="M 20 80 Q 90 20, 160 70 T 260 30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                                        <path d="M 20 80 Q 90 20, 160 70 T 260 30" fill="none" stroke="#10B981" strokeWidth="3" className="animate-route-dash" />
                                        <circle cx="20" cy="80" r="5" fill="#10B981" />
                                        <circle cx="115" cy="40" r="7" fill="#F59E0B" className="animate-ping" />
                                        <circle cx="115" cy="40" r="5" fill="#F59E0B" />
                                        <circle cx="260" cy="30" r="7" fill="#EA580C" />
                                    </svg>
                                    <div className="absolute bottom-3 left-3 text-[10px] font-mono text-[#34D399] bg-[#022C22]/90 px-2 py-1 rounded border border-[#10B981]/30">
                                        Van Status: Moving to Stop 2 (Your Farm)
                                    </div>
                                </div>
                                <div className="text-xs text-gray-300 mt-3 flex justify-between">
                                    <span>Pooled transit savings: <b className="text-[#34D399]">₹320 on this run</b></span>
                                    <span className="text-[#34D399]">Zero Brokerage Friction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 6. WHATSAPP KISAN BOT VIEW --- */}
                {activeView === 'whatsapp' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">WhatsApp AI Assistant Sync</h2>
                                <p className="text-xs text-gray-500">List crops, check APMC rates, and receive orders straight on WhatsApp</p>
                            </div>
                            <span className="bg-[#25D366]/20 text-[#128C7E] px-3 py-1 rounded-xl text-xs font-mono font-bold border border-[#25D366]/40">
                                +91 90211 44000
                            </span>
                        </div>

                        {/* WhatsApp Simulation Chat */}
                        <div className="max-w-xl mx-auto bg-[#07241A] text-white border border-[#25D366]/40 rounded-3xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                <div className="w-10 h-10 rounded-full bg-[#25D366] text-[#022C22] flex items-center justify-center font-bold">
                                    <MessageCircle size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">AgriConnect Kisan Bot</h4>
                                    <p className="text-[11px] text-[#25D366] font-mono">Online • Official Verified Channel</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="bg-[#1F2C24] p-3.5 rounded-2xl max-w-[80%] text-gray-200 shadow">
                                    Namaste Ramesh ji! 🌾 Send a photo of your harvest and quantity to create a direct listing instantly.
                                </div>
                                <div className="bg-[#054C37] p-3.5 rounded-2xl max-w-[80%] ml-auto text-white shadow space-y-1">
                                    <div>📷 [Sent photo of Tomatoes]</div>
                                    <div className="text-[10px] text-gray-300">"450kg Tomatoes ready in Haveli Pune"</div>
                                </div>
                                <div className="bg-[#1F2C24] p-3.5 rounded-2xl max-w-[80%] text-gray-200 shadow space-y-1">
                                    <div className="text-[#34D399] font-bold">✅ AI Grade Assigned: Grade A (98% Firmness)</div>
                                    <div>Suggested Rate: <b>₹26/kg</b>. Published to 4,000+ wholesale buyers.</div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => showToast('Opening WhatsApp link: wa.me/919021144000')}
                                    className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#022C22] font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow"
                                >
                                    <MessageCircle size={18} /> Connect My WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 7. WALLET & PAYOUTS VIEW --- */}
                {activeView === 'wallet' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Kisan Digital Wallet</h2>
                                <p className="text-xs text-gray-500">Direct escrow settlements and instant bank withdrawals</p>
                            </div>
                            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-mono font-bold border border-emerald-200">
                                KYC Verified
                            </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-[#062319] to-[#0A3324] text-white border border-[#10B981]/40 p-6 rounded-3xl shadow-xl space-y-4">
                                <span className="text-xs font-mono text-gray-300">AVAILABLE BALANCE</span>
                                <div className="text-4xl font-bold font-mono text-[#34D399]">₹48,500.00</div>
                                <button
                                    onClick={() => showToast('Transfer of ₹48,500 initiated to Bank Account ending in **4910')}
                                    className="w-full bg-[#10B981] hover:bg-[#34D399] text-[#022C22] font-extrabold py-3.5 rounded-xl text-sm shadow transition"
                                >
                                    Withdraw to Bank Account
                                </button>
                            </div>

                            <div className="md:col-span-2 bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 text-sm">Recent Direct Settlements</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
                                        <div>
                                            <div className="font-bold text-gray-900">BigBasket Procurement (500kg Tomato)</div>
                                            <div className="text-gray-500 text-[10px]">Today, 10:15 AM • Trx #TX88210</div>
                                        </div>
                                        <span className="font-bold font-mono text-emerald-700 text-sm">+₹12,500.00</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
                                        <div>
                                            <div className="font-bold text-gray-900">Kalyani Retail (1200kg Onion)</div>
                                            <div className="text-gray-500 text-[10px]">Aug 28 • Trx #TX87902</div>
                                        </div>
                                        <span className="font-bold font-mono text-emerald-700 text-sm">+₹24,000.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 8. PROFILE VIEW --- */}
                {activeView === 'profile' && (
                    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#047857] text-[#022C22] flex items-center justify-center font-bold text-2xl font-serif shadow">
                                {farmerName[0] || 'R'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{farmerName}</h2>
                                <p className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Verified Agricultural Producer
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                                <span className="text-gray-500 block mb-1">Primary Farm Location</span>
                                <span className="text-gray-900 font-bold">Haveli, Pune District, Maharashtra</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                                <span className="text-gray-500 block mb-1">Registered Land Area</span>
                                <span className="text-gray-900 font-bold">4.5 Acres (Irrigated)</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                                <span className="text-gray-500 block mb-1">Primary Crops</span>
                                <span className="text-gray-900 font-bold">Tomato, Onion, Cabbage, Chilli</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                                <span className="text-gray-500 block mb-1">Language Preference</span>
                                <span className="text-gray-900 font-bold">Marathi / Hindi / English</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}