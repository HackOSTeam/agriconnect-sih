import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag, ShoppingCart, Package, Layers, Truck,
    TrendingUp, User, Search, Mic, Filter, MapPin, CheckCircle2,
    Sparkles, ArrowRight, ShieldCheck, Star, ChevronRight, X,
    Plus, Minus, Trash2, Clock, AlertCircle, RefreshCw, Sprout,
    Zap, Check, DollarSign
} from 'lucide-react';
import axios from 'axios';

export default function BuyerDashboard() {
    const [activeView, setActiveView] = useState('browse');
    const initialMarketplaceProducts = [
        { id: 1, crop_name: 'Organic Red Tomatoes', category: 'Vegetable', farmer_name: 'Ramesh Patel', quantity_kg: 850, unit: 'kg', price_per_kg: 24, quality_grade: 'Grade A', pickup_location: 'Haveli, Pune', organic: 'Yes' },
        { id: 2, crop_name: 'Nashik Garwa Onions', category: 'Vegetable', farmer_name: 'Suresh Shinde', quantity_kg: 2400, unit: 'kg', price_per_kg: 19, quality_grade: 'Grade A', pickup_location: 'Nashik', organic: 'No' },
        { id: 3, crop_name: 'Kufri Jyoti Potatoes', category: 'Vegetable', farmer_name: 'Anil Deshmukh', quantity_kg: 1800, unit: 'kg', price_per_kg: 17, quality_grade: 'Grade B', pickup_location: 'Satara', organic: 'No' },
        { id: 4, crop_name: 'Green Crisp Capsicum', category: 'Vegetable', farmer_name: 'Vijay Gaikwad', quantity_kg: 600, unit: 'kg', price_per_kg: 34, quality_grade: 'Grade A', pickup_location: 'Pune Polyhouse', organic: 'Yes' },
        { id: 5, crop_name: 'Fresh Nagpur Oranges', category: 'Fruit', farmer_name: 'Prakash Rao', quantity_kg: 1500, unit: 'kg', price_per_kg: 48, quality_grade: 'Grade A', pickup_location: 'Nagpur', organic: 'Yes' },
        { id: 6, crop_name: 'Sharbati Wheat Grain', category: 'Grain', farmer_name: 'Mukesh Choudhary', quantity_kg: 5000, unit: 'kg', price_per_kg: 38, quality_grade: 'Grade A', pickup_location: 'Madhya Pradesh Border', organic: 'No' }
    ];

    const [products, setProducts] = useState(initialMarketplaceProducts);
    const [cart, setCart] = useState([]);
    const [isBulk] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Crops');
    const [selectedGrade, setSelectedGrade] = useState('Any Grade');
    const [maxPrice, setMaxPrice] = useState(60);
    const [isListening, setIsListening] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const buyerName = localStorage.getItem('userName') || 'AgroFresh Wholesalers';

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/products/');
            if (res.data && res.data.length > 0) {
                setProducts(res.data);
            } else {
                setProducts(initialMarketplaceProducts);
            }
        } catch (error) {
            console.error(error);
            setProducts(initialMarketplaceProducts);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addToCart = (prod) => {
        setCart([...cart, { ...prod, orderQty: prod.orderQty || 50 }]);
        showToast(`🛒 Added ${prod.crop_name} to procurement cart!`);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleVoiceSearch = () => {
        setIsListening(true);
        showToast('🎙️ AI Voice Search... Say: "Grade A Tomatoes in Pune"');
        setTimeout(() => {
            setSearchQuery('Tomato');
            setIsListening(false);
            showToast('🔍 Voice match: Found 2 matching Tomato batches');
        }, 1800);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.farmer_name && p.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'All Crops' || p.category === selectedCategory;
        const matchesGrade = selectedGrade === 'Any Grade' || p.quality_grade === selectedGrade || (selectedGrade === 'Grade A' && p.quality_grade?.includes('A'));
        const matchesPrice = Number(p.price_per_kg) <= maxPrice;
        return matchesSearch && matchesCategory && matchesGrade && matchesPrice;
    });

    const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price_per_kg) * (item.orderQty || 50)), 0);

    const menuItems = [
        { id: 'browse', label: 'Browse Harvests', icon: ShoppingBag, badge: `${filteredProducts.length} Lots` },
        { id: 'cart', label: 'Cart & Aggregation', icon: ShoppingCart, badge: cart.length > 0 ? `${cart.length}` : undefined },
        { id: 'orders', label: 'My Procurement Orders', icon: Package, badge: '1 In Transit' },
        ...(isBulk ? [{ id: 'bulk', label: 'Cooperative Bulk Contracts', icon: Layers }] : []),
        { id: 'tracking', label: 'Live GPS Telemetry', icon: Truck },
        { id: 'trends', label: 'Mandi Signals & AI', icon: TrendingUp },
        { id: 'profile', label: 'Buyer GST Profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans">
            {/* Animated Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#0F172A] border border-[#EA580C] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#F97316]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* --- TOP STICKY DASHBOARD NAVBAR (DARK CONTRAST STRIP) --- */}
            <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-[#EA580C]/25 shadow-lg">
                {/* 1. Main Header Strip */}
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#EA580C] to-[#C2410C] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#EA580C]/30 group-hover:scale-105 transition-transform">
                                <ShoppingBag size={22} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <span className="text-xl font-extrabold text-white font-serif tracking-tight">Agri<span className="text-[#F97316]">Connect</span></span>
                                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest bg-[#EA580C]/20 text-[#F97316] px-2 py-0.5 rounded border border-[#EA580C]/30">Buyer Portal</span>
                            </div>
                        </Link>
                    </div>

                    {/* Center Search Bar with Voice Button */}
                    <div className="flex-1 max-w-md hidden md:flex items-center bg-[#1E293B] border border-white/15 rounded-full px-4 py-1.5 shadow-inner">
                        <Search size={16} className="text-gray-400 mr-2.5" />
                        <input
                            type="text"
                            placeholder="Search crop, variety, or farmer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-white text-xs outline-none placeholder-gray-400"
                        />
                        <button
                            onClick={handleVoiceSearch}
                            className={`p-1.5 rounded-full transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[#F97316] hover:bg-white/10'}`}
                            title="Voice Search"
                        >
                            <Mic size={16} />
                        </button>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-3">
                        {/* Cart Button */}
                        <button
                            onClick={() => setActiveView('cart')}
                            className="relative bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#EA580C]/25 hover:scale-105 active:scale-95 transition-all"
                        >
                            <ShoppingCart size={16} />
                            <span>Cart</span>
                            {cart.length > 0 && (
                                <span className="bg-white text-[#EA580C] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono ml-1">
                                    {cart.length}
                                </span>
                            )}
                        </button>

                        {/* Buyer Profile Pill */}
                        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#9A3412] text-white font-bold flex items-center justify-center text-xs">
                                {buyerName[0] || 'B'}
                            </div>
                            <div className="text-left hidden md:block">
                                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                                    {buyerName}
                                    <CheckCircle2 size={12} className="text-[#10B981]" />
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">GST Verified Buyer</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Top Sub-Header Navigation Tabs Bar */}
                <div className="px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/10 py-2 bg-[#0A1120]">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/30 font-bold'
                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                                {item.badge !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                                        isActive ? 'bg-white text-[#EA580C] font-bold' : 'bg-white/10 text-gray-300'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* --- MAIN BUYER CONTENT AREA --- */}
            <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
                {/* --- 1. BROWSE PRODUCE VIEW --- */}
                {activeView === 'browse' && (
                    <div className="space-y-6">
                        {/* Filters Toolbar */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-[#0F172A] font-serif">Verified Direct Farm Harvests</h1>
                                    <p className="text-xs text-gray-500">Zero middleman fees • Auto-aggregated for wholesale delivery</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#EA580C]"
                                    >
                                        <option>All Crops</option>
                                        <option>Vegetable</option>
                                        <option>Fruit</option>
                                        <option>Grain</option>
                                    </select>

                                    <select
                                        value={selectedGrade}
                                        onChange={(e) => setSelectedGrade(e.target.value)}
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#EA580C]"
                                    >
                                        <option>Any Grade</option>
                                        <option>Grade A</option>
                                        <option>Grade B</option>
                                    </select>

                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs">
                                        <span className="text-gray-500">Max ₹:</span>
                                        <input
                                            type="number"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                                            className="w-14 bg-transparent font-mono text-gray-900 font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Produce Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((p) => (
                                <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-400 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="h-44 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.crop_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-7xl filter drop-shadow-md">
                                                    {p.crop_name?.toLowerCase().includes('tomato') ? '🍅' : p.crop_name?.toLowerCase().includes('onion') ? '🧅' : p.crop_name?.toLowerCase().includes('orange') ? '🍊' : p.crop_name?.toLowerCase().includes('wheat') ? '🌾' : '🥔'}
                                                </span>
                                            )}
                                            <span className="absolute top-3 right-3 bg-white text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">
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
                                                    <h3 className="font-bold text-lg text-gray-900">{p.crop_name}</h3>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} className="text-emerald-600" /> By {p.farmer_name || 'Farmer'} ({p.pickup_location || 'Pune'})
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold font-mono text-[#EA580C]">
                                                        ₹{p.price_per_kg}/{p.unit || 'kg'}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400">Direct mandi rate</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-100">
                                                <span>Available: <b>{p.quantity_kg} {p.unit || 'kg'}</b></span>
                                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                                                    Ready for Dispatch
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 pt-0">
                                        <button
                                            onClick={() => addToCart(p)}
                                            className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition"
                                        >
                                            <Plus size={16} /> Add to Wholesale Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- 2. CART & AGGREGATION VIEW --- */}
                {activeView === 'cart' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Wholesale Procurement Cart</h2>
                                <p className="text-xs text-gray-500">Pooled dispatch orders from verified farm gates</p>
                            </div>
                            <span className="text-xs font-mono text-[#EA580C] bg-orange-50 px-3 py-1 rounded-xl border border-orange-200 font-bold">
                                {cart.length} Crop Lots
                            </span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                                <span className="text-6xl">🛒</span>
                                <h3 className="text-xl font-bold text-gray-900">Your wholesale cart is empty</h3>
                                <p className="text-xs text-gray-500">Browse verified produce and add lots to group for combined logistics.</p>
                                <button
                                    onClick={() => setActiveView('browse')}
                                    className="bg-[#EA580C] hover:bg-[#C2410C] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow"
                                >
                                    Browse Fresh Produce
                                </button>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 space-y-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-3">
                                        <Sparkles size={20} className="shrink-0 text-emerald-700" />
                                        <span><b>⚡ Auto-Aggregation Active:</b> Orders from nearby Pune farms are bundled into a single delivery van, saving you ₹420 in transit fees!</span>
                                    </div>

                                    {cart.map((item, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl">
                                                    {item.crop_name?.toLowerCase().includes('tomato') ? '🍅' : item.crop_name?.toLowerCase().includes('onion') ? '🧅' : '🌱'}
                                                </span>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{item.crop_name}</h4>
                                                    <p className="text-xs text-gray-500">Farmer: {item.farmer_name} • {item.pickup_location}</p>
                                                    <span className="text-[11px] font-mono text-emerald-700 font-bold">{item.quality_grade || 'Grade A'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-sm font-bold font-mono text-gray-900">
                                                        ₹{Number(item.price_per_kg) * 50}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">50 {item.unit || 'kg'} lot @ ₹{item.price_per_kg}/kg</div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(idx)}
                                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="lg:col-span-4 bg-white border border-gray-200 p-6 rounded-3xl space-y-6 h-fit shadow-sm">
                                    <h3 className="font-bold text-gray-900 text-base">Order Summary</h3>

                                    <div className="space-y-3 text-xs font-mono">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal ({cart.length} Lots)</span>
                                            <span>₹{cartTotal}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Pooled Logistics Fee</span>
                                            <span className="text-emerald-700 font-bold">₹180 <span className="line-through text-gray-400">₹600</span></span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Middleman Commission</span>
                                            <span className="text-emerald-700 font-bold">₹0.00 (Direct Trade)</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900">
                                            <span>Total Payable</span>
                                            <span className="text-[#EA580C] font-mono">₹{cartTotal + 180}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { showToast('🎉 Order placed successfully! Logistics dispatched.'); setCart([]); setActiveView('orders'); }}
                                        className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-orange-600/25 transition"
                                    >
                                        Place Direct Farm Order
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- 3. ORDERS VIEW --- */}
                {activeView === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">My Procurement Orders</h2>
                                <p className="text-xs text-gray-500">Real-time status tracking & verified invoice downloads</p>
                            </div>
                        </div>

                        <div className="bg-white border border-emerald-300 p-6 rounded-3xl space-y-4 shadow-sm">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <span className="text-xs font-mono text-emerald-700 font-bold">ORDER #AG-9901</span>
                                    <h3 className="text-lg font-bold text-gray-900">Pune Smallholder Cluster (1,200kg Produce)</h3>
                                </div>
                                <span className="bg-emerald-100 text-emerald-900 text-xs px-3 py-1 rounded-full font-mono font-bold">
                                    🚚 In Transit (ETA: 45 Mins)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                                <div>
                                    <span className="text-gray-500 block">Items</span>
                                    <span className="text-gray-900 font-bold">500kg Tomato, 700kg Onion</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Total Invoiced</span>
                                    <span className="text-emerald-700 font-bold">₹28,400</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Delivery Vehicle</span>
                                    <span className="text-gray-900 font-bold">Tata 407 (MH-14-AZ-2022)</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Invoice</span>
                                    <button onClick={() => showToast('Downloading GST Invoice #AG-9901 PDF...')} className="text-emerald-700 underline font-semibold">
                                        Download GST Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 4. BULK CONTRACTS VIEW --- */}
                {activeView === 'bulk' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 px-3 py-1 rounded-full text-xs font-mono mb-2 border border-orange-200">
                                <Layers size={14} /> Cooperative Demand Aggregation
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif">Bulk & Recurring Harvest Contracts</h2>
                            <p className="text-xs text-gray-500">Lock in weekly deliveries with farmer FPOs at guaranteed wholesale rates</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 text-base">Setup Recurring Weekly Demand</h3>
                                <p className="text-xs text-gray-500">Enter your weekly volume requirements. We aggregate smallholder farmers to fulfill it continuously.</p>
                                <div className="space-y-3 text-xs">
                                    <input placeholder="Required Crop (e.g. Tomato)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#EA580C]" />
                                    <input placeholder="Weekly Tonnes Required (e.g. 5 Tonnes)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#EA580C]" />
                                    <button onClick={() => showToast('Cooperative contract inquiry broadcast to 240+ FPOs!')} className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-3 rounded-xl font-bold transition">
                                        Broadcast to 240+ Farmer FPOs
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 text-base">Active Cooperative Contracts</h3>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs space-y-2">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>Nashik Onion FPO Pool</span>
                                        <span className="text-emerald-700">Active (3 Tonnes/Week)</span>
                                    </div>
                                    <p className="text-gray-500 text-[11px]">Direct contract across 12 farmers • Rate fixed at ₹18.50/kg</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 5. LIVE GPS TELEMETRY VIEW (HIGH CONTRAST DARK BOX) --- */}
                {activeView === 'tracking' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Live Fleet & Produce Telemetry</h2>
                                <p className="text-xs text-gray-500">GPS waypoint telemetry and in-transit produce freshness monitoring</p>
                            </div>
                            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 font-bold">
                                Van Active: MH-14-AZ-2022
                            </span>
                        </div>

                        <div className="bg-[#07241A] text-white border border-[#10B981]/30 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                            <div className="h-64 bg-[#031710] rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                                <svg className="w-full h-full" viewBox="0 0 280 120">
                                    <path d="M 30 90 Q 100 30, 180 80 T 260 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                                    <path d="M 30 90 Q 100 30, 180 80 T 260 40" fill="none" stroke="#EA580C" strokeWidth="3" className="animate-route-dash" />
                                    <circle cx="30" cy="90" r="5" fill="#10B981" />
                                    <circle cx="120" cy="48" r="5" fill="#10B981" />
                                    <circle cx="190" cy="80" r="8" fill="#F97316" className="animate-ping" />
                                    <circle cx="190" cy="80" r="6" fill="#F97316" />
                                    <circle cx="260" cy="40" r="7" fill="#34D399" />
                                </svg>
                                <div className="absolute top-3 left-4 text-xs font-mono text-gray-300 bg-[#022C22]/90 px-3 py-1 rounded-xl border border-[#10B981]/30">
                                    🚚 Van en route to Wholesale Depot (ETA: 38 Mins)
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-gray-400 block">Total Trip Distance</span>
                                    <span className="text-white font-bold text-sm">34.2 km (3 stops)</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-gray-400 block">Transit Temperature</span>
                                    <span className="text-[#34D399] font-bold text-sm">22°C (Optimal Freshness)</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-gray-400 block">OTP for Delivery Receiving</span>
                                    <span className="text-[#F59E0B] font-bold text-sm">8819</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 6. MANDI SIGNALS VIEW --- */}
                {activeView === 'trends' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 font-serif">Mandi Price Trends & Buy Signals</h2>
                            <p className="text-xs text-gray-500">AI procurement signals on best time to buy vs wait</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white border border-emerald-300 p-6 rounded-3xl shadow-sm">
                                <span className="text-xs font-mono text-emerald-700 font-bold">BUY SIGNAL: STRONG</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-1">Potatoes (Satara Hub)</h3>
                                <p className="text-xs text-gray-500 mt-2">Prices are at a 30-day low of ₹17/kg due to peak harvest arrival. Buy today.</p>
                            </div>
                            <div className="bg-white border border-orange-300 p-6 rounded-3xl shadow-sm">
                                <span className="text-xs font-mono text-[#EA580C] font-bold">HOLD SIGNAL</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-1">Tomatoes (Pune Hub)</h3>
                                <p className="text-xs text-gray-500 mt-2">Demand rising by 24% over next 4 days. Expected price stabilization next Monday.</p>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm">
                                <span className="text-xs font-mono text-gray-500 font-bold">STABLE MARKET</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-1">Onions (Nashik)</h3>
                                <p className="text-xs text-gray-500 mt-2">Steady inflow across all APMC yards. Price holding at ₹19/kg.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 7. PROFILE VIEW --- */}
                {activeView === 'profile' && (
                    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white flex items-center justify-center font-bold text-2xl font-serif shadow">
                                {buyerName[0] || 'B'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{buyerName}</h2>
                                <p className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Registered Wholesale Buyer (GSTIN Verified)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <span className="text-gray-500 block mb-1">Business Registration</span>
                                <span className="text-gray-900 font-bold">GSTIN: 27AAAAA0000A1Z5</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <span className="text-gray-500 block mb-1">Delivery Depot Address</span>
                                <span className="text-gray-900 font-bold">Market Yard, Gultekdi, Pune 411037</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <span className="text-gray-500 block mb-1">Weekly Procurement Capacity</span>
                                <span className="text-gray-900 font-bold">15 - 25 Tonnes</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <span className="text-gray-500 block mb-1">Payment Method</span>
                                <span className="text-gray-900 font-bold">Auto-Debit Escrow (ICICI Bank)</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}