import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingBag, TrendingUp, Truck,
    MessageCircle, Wallet, UserCheck, Plus, Mic, Camera,
    CheckCircle2, Sparkles, MapPin, FileText, Bell, Search,
    ArrowUpRight, Clock, ShieldCheck, ChevronRight, X, Phone,
    DollarSign, Filter, RefreshCw, AlertCircle, Sprout, ArrowRight,
    Zap, Check, Share2, Download, Eye, Layers, Edit, Trash2
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import TiltCard3D from '../components/TiltCard3D';
import ForecastWidget from '../components/ForecastWidget';

export default function FarmerDashboard() {
    const [activeView, setActiveView] = useState('overview');
    const [showAddListing, setShowAddListing] = useState(false);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const farmerName = localStorage.getItem('userName') || 'Tanmayi Khot';
    const farmerId = localStorage.getItem('farmerId') || localStorage.getItem('userId') || '';

    const getAuthHeaders = (isMultipart = false) => {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (isMultipart) headers['Content-Type'] = 'multipart/form-data';
        return headers;
    };

    const [editingProduct, setEditingProduct] = useState(null);
    const [restockQty, setRestockQty] = useState(0);

    const [walletData, setWalletData] = useState({ balance: 48500, formatted_balance: '₹48,500.00', middleman_saving_pct: '+34.8%', transactions: [] });
    const [ordersData, setOrdersData] = useState([]);
    const [farmerOrderFilter, setFarmerOrderFilter] = useState('all');
    const [profileData, setProfileData] = useState({ village_district: 'Haveli, Pune', state: 'Maharashtra', primary_crops: 'Tomato, Onion', id_type: 'Aadhaar', id_number: '4920-8812-3341', upi_id: 'ramesh@okaxis' });

    const [newProduct, setNewProduct] = useState({
        crop_name: '', category: 'Vegetable', variety: '', quantity_kg: '', unit: 'kg',
        moq: '', price_per_kg: '', negotiable: 'Yes', harvest_date: '', shelf_life: '',
        available_from: '', organic: 'No', pickup_location: 'Auto-detected: Pune', pickup_window: 'Morning',
        cancellationWindow: 24
    });

    const [aiGrade, setAiGrade] = useState('Pending');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const currentFarmerName = localStorage.getItem('userName') || farmerName;
            const currentFarmerId = localStorage.getItem('farmerId') || localStorage.getItem('userId') || farmerId;
            let url = `${API_BASE_URL}/api/products/?farmer_name=${encodeURIComponent(currentFarmerName)}`;
            if (currentFarmerId) {
                url += `&farmer_id=${encodeURIComponent(currentFarmerId)}`;
            }
            const res = await axios.get(url, { headers: getAuthHeaders() });
            setProducts(res.data || []);
        } catch (error) {
            console.error("API error fetching products:", error);
            showToast("⚠️ Could not reach server.");
        } finally {
            setLoading(false);
        }
    };

    const fetchWallet = async () => {
        try {
            const currentFarmerName = localStorage.getItem('userName') || farmerName;
            const res = await axios.get(`${API_BASE_URL}/api/wallet/${encodeURIComponent(currentFarmerName)}`, { headers: getAuthHeaders() });
            if (res.data) setWalletData(res.data);
        } catch (err) { console.error("Error fetching wallet:", err); }
    };

    const fetchOrders = async () => {
        try {
            const currentFarmerName = localStorage.getItem('userName') || farmerName;
            const currentFarmerId = localStorage.getItem('farmerId') || localStorage.getItem('userId') || farmerId;
            let url = `${API_BASE_URL}/api/orders/?farmer_name=${encodeURIComponent(currentFarmerName)}`;
            if (currentFarmerId) {
                url += `&farmer_id=${encodeURIComponent(currentFarmerId)}`;
            }
            const res = await axios.get(url, { headers: getAuthHeaders() });
            if (res.data) setOrdersData(res.data);
        } catch (err) { console.error("Error fetching orders:", err); }
    };

    const fetchProfile = async () => {
        try {
            const currentFarmerName = localStorage.getItem('userName') || farmerName;
            const cached = localStorage.getItem('farmerProfile');
            if (cached) setProfileData(prev => ({ ...prev, ...JSON.parse(cached) }));
            const res = await axios.get(`${API_BASE_URL}/api/user/profile?identifier=${encodeURIComponent(currentFarmerName)}`, { headers: getAuthHeaders() });
            if (res.data) setProfileData(res.data);
        } catch (err) { console.error("Error fetching profile:", err); }
    };

    useEffect(() => {
        fetchProducts();
        fetchWallet();
        fetchOrders();
        fetchProfile();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); triggerAiScanAutomation(); }
    };

    const triggerAiScanAutomation = () => {
        setIsScanning(true); showToast('🔍 AI Vision Scanner: Analyzing fruit firmness...');
        setTimeout(() => { setIsScanning(false); setAiGrade('Grade A (Export Quality)'); showToast('✨ AI Verification Complete: Grade A • 98.4% Confidence'); }, 1800);
    };

    const handleAddProduct = async (e) => {
        if (e) e.preventDefault();
        if (!newProduct.crop_name || !newProduct.quantity_kg || !newProduct.price_per_kg) { showToast('⚠️ Please fill required fields'); return; }
        try {
            const currentFarmerName = localStorage.getItem('userName') || farmerName;
            const currentFarmerId = localStorage.getItem('farmerId') || localStorage.getItem('userId');

            const formData = new FormData();
            formData.append('farmer_name', currentFarmerName);
            if (currentFarmerId) {
                formData.append('farmer_id', currentFarmerId);
            }
            formData.append('crop_name', newProduct.crop_name);
            formData.append('category', newProduct.category || 'Vegetable');
            formData.append('variety', newProduct.variety || '');
            formData.append('quantity_kg', parseFloat(newProduct.quantity_kg));
            formData.append('unit', newProduct.unit || 'kg');
            formData.append('moq', newProduct.moq || '10');
            formData.append('price_per_kg', parseFloat(newProduct.price_per_kg));
            formData.append('negotiable', newProduct.negotiable || 'Yes');
            formData.append('harvest_date', newProduct.harvest_date || '');
            formData.append('available_from', newProduct.available_from || '');
            formData.append('shelf_life', newProduct.shelf_life || '');
            formData.append('organic', newProduct.organic || 'No');
            formData.append('pickup_location', newProduct.pickup_location || 'Pune, Maharashtra');
            formData.append('pickup_window', newProduct.pickup_window || 'Morning');
            formData.append('quality_grade', aiGrade === 'Pending' ? 'Grade A (Export Quality)' : aiGrade);
            formData.append('cancellation_window_hours', newProduct.cancellationWindow || 24);
            if (imageFile) formData.append('image', imageFile);

            const res = await axios.post(`${API_BASE_URL}/api/products/`, formData, {
                headers: getAuthHeaders(true)
            });
            console.log("Produce created successfully:", res.data);
            showToast('✅ Produce published successfully to Buyer Marketplace!');
            setNewProduct({ crop_name: '', category: 'Vegetable', variety: '', quantity_kg: '', unit: 'kg', moq: '', price_per_kg: '', negotiable: 'Yes', harvest_date: '', shelf_life: '', available_from: '', organic: 'No', pickup_location: 'Pune', pickup_window: 'Morning', cancellationWindow: 24 });
            setImageFile(null); setImagePreview(null); setAiGrade('Pending'); setShowAddListing(false);
            await fetchProducts();
        } catch (error) {
            console.error("Error creating product:", error);
            showToast(`✕ Failed to save produce: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
                price_per_kg: parseFloat(editingProduct.price_per_kg),
                quality_grade: editingProduct.quality_grade,
                harvest_date: editingProduct.harvest_date,
                negotiable: editingProduct.negotiable,
                add_quantity: parseFloat(restockQty) || 0
            }, { headers: getAuthHeaders() });
            showToast(`✅ ${editingProduct.crop_name} updated & restocked!`);
            setEditingProduct(null); setRestockQty(0); fetchProducts();
        } catch (err) { showToast('Failed to update product'); }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Permanently delete this listing?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/products/${productId}`, { headers: getAuthHeaders() });
                showToast('🗑️ Product deleted!');
                fetchProducts();
            } catch (err) { showToast('Failed to delete product'); }
        }
    };

    const handleSuggestPrice = () => {
        const suggested = Math.floor(Math.random() * (36 - 25 + 1) + 25);
        setNewProduct(prev => ({ ...prev, price_per_kg: suggested }));
        showToast(`✨ AI Mandi: Recommends ₹${suggested}/${newProduct.unit || 'kg'} (+18% vs broker)`);
    };

    const handleVoiceAssist = () => {
        setIsVoiceActive(true); showToast('🎙️ AI Listening...');
        setTimeout(() => {
            setNewProduct(prev => ({ ...prev, crop_name: 'Hybrid Tomatoes', quantity_kg: '500', price_per_kg: '26', category: 'Vegetable', variety: 'Avinash-2', unit: 'kg' }));
            setAiGrade('Grade A (Export Quality)'); setIsVoiceActive(false); setShowAddListing(true);
            showToast('✅ Voice AI Auto-filled: 500kg Tomatoes at ₹26/kg!');
        }, 1800);
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'listings', label: 'My Listings', icon: Package, badge: products.length },
        { id: 'orders', label: 'Incoming Orders', icon: ShoppingBag, badge: ordersData.filter(o => o.status === 'placed').length > 0 ? `${ordersData.filter(o => o.status === 'placed').length} New` : undefined },
        { id: 'forecast', label: 'Mandi Forecast', icon: TrendingUp },
        { id: 'logistics', label: 'Logistics & Pickup', icon: Truck },
        { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
        { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet },
        { id: 'profile', label: 'Kisan Profile', icon: UserCheck },
    ];

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans">
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#062319] border border-[#10B981] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#34D399]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            <header className="sticky top-0 z-40 bg-[#062319] text-white border-b border-[#10B981]/25 shadow-lg">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl flex items-center justify-center text-[#022C22] shadow-md shadow-[#10B981]/30 group-hover:scale-105 transition-transform"><Sprout size={22} className="stroke-[2.5]" /></div>
                            <div><span className="text-xl font-extrabold text-white font-serif tracking-tight">Agri<span className="text-[#34D399]">Connect</span></span><span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest bg-[#10B981]/20 text-[#34D399] px-2 py-0.5 rounded border border-[#10B981]/30">Farmer Hub</span></div>
                        </Link>
                    </div>
                    <div className="hidden lg:flex items-center gap-4 bg-[#03150E] px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono">
                        <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span></span>
                        <span className="text-gray-300">Pune APMC: Tomato <span className="text-[#34D399] font-bold">₹26/kg (- 8%)</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleVoiceAssist} className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-white/10 hover:bg-white/15 text-[#34D399] border-white/15'}`}><Mic size={16} /><span className="hidden md:inline">Voice</span></button>
                        <button onClick={() => { setShowAddListing(true); setActiveView('listings'); }} className="bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#10B981]/25 hover:scale-105 active:scale-95 transition-all"><Plus size={16} /> <span>Add Listing</span></button>
                        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-[#022C22] font-bold flex items-center justify-center text-xs">{farmerName[0] || 'R'}</div>
                            <div className="text-left hidden md:block"><div className="text-xs font-bold text-white leading-tight flex items-center gap-1">{farmerName}<CheckCircle2 size={12} className="text-[#10B981]" /></div><div className="text-[10px] text-gray-400 font-mono">Kisan ID #4920</div></div>
                        </div>
                    </div>
                </div>
                <div className="px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/10 py-2 bg-[#041B13]">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button key={item.id} onClick={() => { setActiveView(item.id); if (item.id === 'orders') fetchOrders(); if (item.id === 'listings') fetchProducts(); }} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${isActive ? 'bg-[#10B981] text-[#022C22] shadow-md shadow-[#10B981]/25 font-bold' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={16} /><span>{item.label}</span>
                                {item.badge !== undefined && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? 'bg-[#022C22] text-[#34D399]' : 'bg-white/10 text-gray-300'}`}>{item.badge}</span>}
                            </button>
                        );
                    })}
                </div>
            </header>

            <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
                {/* --- 1. OVERVIEW VIEW --- */}
                {activeView === 'overview' && (
                    <div className="space-y-8">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#062319] via-[#0A3324] to-[#041A13] border border-[#10B981]/30 p-6 sm:p-8 shadow-xl text-white">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/15 rounded-full filter blur-[80px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 bg-[#10B981]/20 text-[#34D399] px-3 py-1 rounded-full text-xs font-mono border border-[#10B981]/30"><UserCheck size={14} /> Aadhaar-Verified Kisan ID #4920</div>
                                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">Namaste, {farmerName}! 🌾</h1>
                                    <p className="text-gray-300 text-sm max-w-xl">Your harvest is currently live across 3 regional procurement clusters. Predicted demand for Tomatoes is rising +18% this week.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button onClick={() => { setShowAddListing(true); setActiveView('listings'); }} className="bg-[#10B981] hover:bg-[#34D399] text-[#022C22] font-extrabold px-5 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-[#10B981]/30 transition"><Plus size={18} /> Add Harvest Lot</button>
                                    <button onClick={() => setActiveView('forecast')} className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-5 py-3 rounded-2xl text-sm font-semibold transition flex items-center gap-2"><TrendingUp size={18} className="text-[#F59E0B]" /> Price Forecast</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-[#10B981] transition-all">
                                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Harvest Lots</span><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold"><Package size={18} /></div></div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">{products.length}</div><div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold"><ArrowUpRight size={14} /> +2 Listed this week</div>
                            </div>
                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-[#EA580C] transition-all">
                                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending Orders</span><div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold"><ShoppingBag size={18} /></div></div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">{ordersData.filter(o => o.status === 'placed').length} Active</div><div className="text-[11px] text-[#EA580C] mt-2 flex items-center gap-1 font-semibold"><Clock size={14} /> Awaiting acceptance</div>
                            </div>
                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-emerald-500 transition-all">
                                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Direct Earnings</span><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold"><Wallet size={18} /></div></div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">{walletData.formatted_balance}</div><div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold"><CheckCircle2 size={13} /> 100% Escrow Settled</div>
                            </div>
                            <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-sm hover:border-amber-500 transition-all">
                                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Middleman Margin Saved</span><div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold"><TrendingUp size={18} /></div></div>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono">{walletData.middleman_saving_pct}</div><div className="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-semibold"><span>vs APMC Commission</span></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><div><h2 className="text-xl font-bold text-[#0F172A] font-serif">Active Produce Catalog</h2><p className="text-xs text-gray-500">Live batches ready for buyer wholesale matches</p></div><button onClick={() => setActiveView('listings')} className="text-xs text-[#059669] hover:underline flex items-center gap-1 font-bold">Manage All Listings ({products.length}) <ChevronRight size={14} /></button></div>
                            {products.length === 0 ? (
                                <div className="bg-white border border-dashed border-emerald-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
                                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto text-3xl shadow-sm">🌱</div>
                                    <div className="space-y-1"><h3 className="text-lg font-bold text-gray-900 font-serif">No Produce Listed Yet</h3><p className="text-xs text-gray-500 max-w-sm mx-auto">You haven't added any listings. Click 'Add Produce' to create your first harvest batch.</p></div>
                                    <button onClick={() => setShowAddListing(true)} className="px-5 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 mx-auto transition hover:scale-105"><Plus size={15} /> Add Your First Produce Listing</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {products.slice(0, 3).map((p) => (
                                        <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="h-40 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                                    {p.image_url ? <img src={p.image_url} alt={p.crop_name} className="w-full h-full object-cover" /> : <span className="text-6xl filter drop-shadow-md">{p.crop_name?.toLowerCase().includes('tomato') ? '🍅' : '🥔'}</span>}
                                                    <span className="absolute top-3 right-3 bg-white/95 text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">{p.quality_grade || 'Grade A'}</span>
                                                </div>
                                                <div className="p-5 space-y-3">
                                                    <div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-[#0F172A]">{p.crop_name}</h3><p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={12} className="text-[#059669]" /> {p.pickup_location || 'Pune Field'}</p></div><span className="text-xl font-bold font-mono text-[#059669]">₹{p.price_per_kg}/{p.unit || 'kg'}</span></div>
                                                    <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-100"><span>Available: <b className="text-gray-900">{p.quantity_kg} {p.unit || 'kg'}</b></span><span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">High Demand</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- 2. MY LISTINGS VIEW --- */}
                {activeView === 'listings' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
                            <div><h2 className="text-2xl font-bold text-[#0F172A] font-serif">My Produce Listings</h2><p className="text-xs text-gray-500">Manage, edit, or publish verified harvest batches</p></div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleVoiceAssist} className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${isVoiceActive ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}><Mic size={16} /> Voice Fill Form</button>
                                <button onClick={() => setShowAddListing(!showAddListing)} className="bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] font-extrabold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-[#10B981]/25 hover:scale-105 transition">{showAddListing ? <X size={18} /> : <Plus size={18} />}{showAddListing ? 'Close Form' : 'Add New Product'}</button>
                            </div>
                        </div>

                        {showAddListing && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/40 shadow-xl space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold"><Sparkles size={20} /></div><div><h3 className="text-xl font-bold text-[#0F172A]">Create New Harvest Listing</h3><p className="text-xs text-gray-500">Integrated with AI Vision Quality Scanner & Price Recommender</p></div></div>
                                    <button onClick={() => setShowAddListing(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                                </div>
                                <div className="grid lg:grid-cols-12 gap-8">
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Crop Name *</label><input list="crop-suggestions" placeholder="e.g. Tomato, Potato, Onion" value={newProduct.crop_name} onChange={(e) => setNewProduct({ ...newProduct, crop_name: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition" required /><datalist id="crop-suggestions"><option>Tomato</option><option>Potato</option><option>Onion</option><option>Green Chilli</option><option>Capsicum</option></datalist></div>
                                            <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Category</label><select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition"><option>Vegetable</option><option>Fruit</option><option>Grain</option><option>Pulses</option></select></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Variety (Optional)</label><input placeholder="e.g. Roma, Hybrid" value={newProduct.variety} onChange={(e) => setNewProduct({ ...newProduct, variety: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition" /></div>
                                            <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Total Quantity *</label><div className="flex gap-2"><input type="number" placeholder="Qty" value={newProduct.quantity_kg} onChange={(e) => setNewProduct({ ...newProduct, quantity_kg: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition" required /><select value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none"><option>kg</option><option>Quintal</option><option>Tonne</option></select></div></div>
                                            <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Min Order Qty (MOQ)</label><input type="number" placeholder="e.g. 50" value={newProduct.moq} onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Asking Price per {newProduct.unit || 'kg'} (₹) *</label><input type="number" placeholder="Asking Price in ₹" value={newProduct.price_per_kg} onChange={(e) => setNewProduct({ ...newProduct, price_per_kg: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition" required /></div>
                                            <div className="flex items-end"><button type="button" onClick={handleSuggestPrice} className="w-full p-3.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition shadow-sm"><Sparkles size={18} className="text-amber-600" /> AI Price Suggestion</button></div>
                                        </div>
                                        <div><label className="text-xs font-semibold text-gray-700 block mb-1.5">Order Cancellation Window (Hours)</label><input type="number" placeholder="e.g. 24 (Buyer can cancel within this time)" value={newProduct.cancellationWindow} onChange={(e) => setNewProduct({ ...newProduct, cancellationWindow: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-[#059669] focus:bg-white transition" /></div>
                                        <div className="flex flex-wrap items-center gap-6 py-2">
                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={newProduct.negotiable === 'Yes'} onChange={() => setNewProduct({ ...newProduct, negotiable: newProduct.negotiable === 'Yes' ? 'No' : 'Yes' })} className="rounded accent-[#059669] w-4 h-4" /><span>Price Negotiable for Bulk</span></label>
                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={newProduct.organic === 'Yes'} onChange={() => setNewProduct({ ...newProduct, organic: newProduct.organic === 'Yes' ? 'No' : 'Yes' })} className="rounded accent-[#059669] w-4 h-4" /><span>Certified Organic / Pesticide-Free</span></label>
                                        </div>
                                        <div className="p-6 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 text-center relative overflow-hidden">
                                            <Camera className="mx-auto text-emerald-700 mb-2" size={32} /><h4 className="text-sm font-bold text-gray-900">Upload Crop Photo for AI Vision Quality Assessment</h4><p className="text-xs text-gray-500 mt-1">Neural computer vision checks size uniformity, ripeness, and blemishes</p>
                                            <div className="flex justify-center gap-3 mt-3">
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#059669] file:text-white hover:file:bg-[#047857] cursor-pointer" />
                                                <button type="button" onClick={triggerAiScanAutomation} className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 transition shadow-sm">⚡ Simulate AI Scan</button>
                                            </div>
                                            {isScanning && <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-emerald-800 font-bold animate-pulse"><Sparkles size={14} /> AI Vision Scanner running inference...</div>}
                                            {aiGrade !== 'Pending' && !isScanning && <div className="mt-3 inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full text-xs font-mono font-bold border border-emerald-300 shadow-sm"><CheckCircle2 size={14} className="text-emerald-700" /> AI Verified: {aiGrade}</div>}
                                        </div>
                                        <div className="flex gap-4 pt-2">
                                            <button type="button" onClick={handleAddProduct} className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-[#022C22] py-4 rounded-xl font-extrabold text-base shadow-lg shadow-emerald-600/20 hover:scale-[1.01] transition">Publish Listing to Marketplace</button>
                                            <button type="button" onClick={() => { setShowAddListing(false); showToast('Saved draft to local storage'); }} className="px-6 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold">Save Draft</button>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-4 space-y-4">
                                        <div className="text-xs font-mono text-gray-500 font-bold flex items-center gap-1"><Sparkles size={14} className="text-emerald-600" /> LIVE BUYER PREVIEW</div>
                                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                                            <div className="h-44 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                                {imagePreview ? <img src={imagePreview} alt="Crop Preview" className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-6xl">🌾</span><p className="text-[11px] text-gray-400 mt-1">Photo Preview Area</p></div>}
                                                <span className="absolute top-3 right-3 bg-white text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">{aiGrade}</span>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                <div className="flex justify-between items-start"><div><h4 className="font-bold text-lg text-gray-900">{newProduct.crop_name || 'Crop Name'}</h4><p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={12} className="text-emerald-600" /> {newProduct.pickup_location}</p></div><div className="text-right"><div className="text-lg font-bold font-mono text-emerald-700">₹{newProduct.price_per_kg || '0'}/{newProduct.unit || 'kg'}</div><span className="text-[10px] text-gray-400 font-mono">Direct Rate</span></div></div>
                                                <div className="pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-600"><span>Available: <b>{newProduct.quantity_kg || '0'} {newProduct.unit}</b></span>{newProduct.organic === 'Yes' && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Organic</span>}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {products.map((p) => (
                                <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="h-40 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                            {p.image_url ? <img src={p.image_url} alt={p.crop_name} className="w-full h-full object-cover" /> : <span className="text-6xl">{p.crop_name?.toLowerCase().includes('tomato') ? '🍅' : '🥔'}</span>}
                                            <span className="absolute top-3 right-3 bg-white text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">{p.quality_grade || 'Grade A'}</span>
                                            {p.status === 'sold' && <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">SOLD OUT</span>}
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-gray-900">{p.crop_name}</h3><p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} className="text-[#059669]" /> {p.pickup_location || 'Pune'}</p></div><span className="text-xl font-bold font-mono text-[#059669]">₹{p.price_per_kg}/{p.unit || 'kg'}</span></div>
                                            <div className="mt-3 flex justify-between items-center text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"><span>Available Stock: <b className={p.quantity_kg > 0 ? 'text-emerald-700' : 'text-red-500'}>{p.quantity_kg} {p.unit || 'kg'}</b></span><span>MOQ: <b>{p.moq || 25}kg</b></span></div>
                                        </div>
                                    </div>
                                    <div className="p-5 pt-0 flex gap-2">
                                        <button onClick={() => setEditingProduct(p)} className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"><Edit size={14} /> Edit / Restock</button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"><Trash2 size={14} /> Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- 3. ORDERS VIEW (DYNAMIC HISTORY WITH FILTERS) --- */}
                {activeView === 'orders' && (() => {
                    const filteredOrders = ordersData.filter(o => {
                        const s = (o.status || '').toLowerCase();
                        if (farmerOrderFilter === 'all') return true;
                        if (farmerOrderFilter === 'action') return ['placed', 'pending farmer confirmation', 'pending'].includes(s);
                        if (farmerOrderFilter === 'confirmed') return ['confirmed', 'accepted', 'picked up', 'in transit', 'delivered'].includes(s);
                        if (farmerOrderFilter === 'rejected') return ['rejected', 'cancelled'].includes(s);
                        return true;
                    });
                    return (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">Incoming Wholesale Orders</h2>
                                <p className="text-xs text-gray-500">Accept orders to authorize pickup & lock escrow payment to your wallet</p>
                            </div>
                            {/* Filter Tabs */}
                            <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl text-xs font-semibold">
                                <button onClick={() => setFarmerOrderFilter('all')} className={`px-3 py-1.5 rounded-xl transition ${farmerOrderFilter === 'all' ? 'bg-white text-gray-900 shadow font-bold' : 'text-gray-500 hover:text-gray-900'}`}>All ({ordersData.length})</button>
                                <button onClick={() => setFarmerOrderFilter('action')} className={`px-3 py-1.5 rounded-xl transition ${farmerOrderFilter === 'action' ? 'bg-amber-100 text-amber-900 shadow font-bold' : 'text-gray-500 hover:text-amber-800'}`}>Needs Action ({ordersData.filter(o => ['placed', 'pending farmer confirmation', 'pending'].includes((o.status || '').toLowerCase())).length})</button>
                                <button onClick={() => setFarmerOrderFilter('confirmed')} className={`px-3 py-1.5 rounded-xl transition ${farmerOrderFilter === 'confirmed' ? 'bg-emerald-100 text-emerald-900 shadow font-bold' : 'text-gray-500 hover:text-emerald-800'}`}>Confirmed ({ordersData.filter(o => ['confirmed', 'accepted', 'picked up', 'in transit', 'delivered'].includes((o.status || '').toLowerCase())).length})</button>
                                <button onClick={() => setFarmerOrderFilter('rejected')} className={`px-3 py-1.5 rounded-xl transition ${farmerOrderFilter === 'rejected' ? 'bg-red-100 text-red-900 shadow font-bold' : 'text-gray-500 hover:text-red-800'}`}>Rejected ({ordersData.filter(o => ['rejected', 'cancelled'].includes((o.status || '').toLowerCase())).length})</button>
                            </div>
                        </div>
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                                <span className="text-6xl">📦</span>
                                <h3 className="text-xl font-bold text-gray-900">{farmerOrderFilter === 'all' ? 'No Orders Yet' : 'No Orders in This Category'}</h3>
                                <p className="text-xs text-gray-500">{farmerOrderFilter === 'all' ? 'When a buyer places an order for your produce, it will appear here instantly.' : 'Try switching the filter above.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map((order) => {
                                    const st = (order.status || '').toLowerCase();
                                    const isPending = ['placed', 'pending farmer confirmation', 'pending'].includes(st);
                                    const isConfirmed = ['confirmed', 'accepted'].includes(st);
                                    const isPickedUp = st === 'picked up' || st === 'picked_up';
                                    const isInTransit = st === 'in transit' || st === 'in_transit';
                                    const isDelivered = st === 'delivered';
                                    const isRejected = ['rejected', 'cancelled'].includes(st);

                                    return (
                                    <div key={order.id} className={`bg-white p-6 rounded-2xl shadow-sm space-y-5 border-l-4 ${
                                        isPending ? 'border-amber-400 border border-amber-200' :
                                        (isConfirmed || isPickedUp || isInTransit || isDelivered) ? 'border-emerald-500 border border-emerald-200' :
                                        'border-red-400 border border-red-100'
                                    }`}>
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <div>
                                                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">ORDER</span>
                                                <h3 className="text-base font-bold text-gray-900 font-mono">#{order.order_number}</h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-emerald-700 font-mono">₹{order.total_amount}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{order.payment_method || 'NEFT/RTGS'}</div>
                                                </div>
                                                <span className={`text-[11px] px-3 py-1.5 rounded-full font-mono font-bold whitespace-nowrap ${
                                                    isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                    isConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                    isPickedUp ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                    isInTransit ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                    isDelivered ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                    'bg-red-100 text-red-700 border border-red-100'
                                                }`}>
                                                    {isPending ? '⏳ Awaiting Farmer Confirmation' :
                                                     isConfirmed ? '✅ Confirmed (Ready for Pickup)' :
                                                     isPickedUp ? '🚚 Picked Up from Farm Gate' :
                                                     isInTransit ? '🛣️ In Transit to Depot' :
                                                     isDelivered ? '🎉 Delivered to Buyer' :
                                                     st === 'rejected' ? '✕ Rejected (Stock Released)' :
                                                     '✕ Cancelled by Buyer'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <span className="text-gray-400 block uppercase font-bold text-[10px] mb-0.5">Buyer</span>
                                                <span className="font-bold text-gray-900">{order.buyer_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase font-bold text-[10px] mb-0.5">Produce & Qty</span>
                                                <span className="font-bold text-gray-900">{order.quantity_kg}kg {order.crop_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase font-bold text-[10px] mb-0.5">Locked Rate</span>
                                                <span className="font-bold text-emerald-700 font-mono">₹{order.price_per_kg}/kg</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase font-bold text-[10px] mb-0.5">Placed</span>
                                                <span className="font-mono text-gray-700">{order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}</span>
                                            </div>
                                        </div>
                                        {/* Delivery & Notes */}
                                        {(order.delivery_address || order.order_note) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {order.delivery_address && (
                                                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl text-xs">
                                                        <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="text-blue-400 uppercase font-bold text-[10px] block">Delivery Depot</span>
                                                            <span className="text-blue-900 font-semibold">{order.delivery_address}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {order.order_note && (
                                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl text-xs">
                                                        <FileText size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="text-amber-400 uppercase font-bold text-[10px] block">Buyer Note</span>
                                                            <span className="text-amber-900 font-semibold">{order.order_note}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Action Buttons & Lifecycle Controls */}
                                        {isPending ? (
                                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post(`${API_BASE_URL}/api/orders/update_status`, { order_id: order.id, status: 'rejected' }, { headers: getAuthHeaders() });
                                                            showToast('✕ Order Rejected. Soft reservation released back to inventory.');
                                                            fetchOrders();
                                                            fetchProducts();
                                                        } catch (err) { showToast('Failed to reject order'); }
                                                    }}
                                                    className="flex-1 sm:flex-none px-5 py-3 bg-gray-100 hover:bg-red-50 hover:border-red-200 border border-gray-200 text-gray-700 hover:text-red-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                                                >
                                                    <X size={15} /> Reject Order
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post(`${API_BASE_URL}/api/orders/update_status`, { order_id: order.id, status: 'confirmed' }, { headers: getAuthHeaders() });
                                                            showToast('✅ Order Confirmed! Stock permanently deducted & escrow locked.');
                                                            fetchOrders();
                                                            fetchProducts();
                                                            fetchWallet();
                                                        } catch (err) { showToast('Failed to accept order'); }
                                                    }}
                                                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl font-bold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                                                >
                                                    <Check size={15} /> Accept & Lock Escrow
                                                </button>
                                            </div>
                                        ) : isConfirmed ? (
                                             <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                                                <p className="text-[11px] text-emerald-700 font-mono font-bold">
                                                    ✅ Escrow credited to wallet. Ready for dispatch.
                                                </p>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post(`${API_BASE_URL}/api/orders/update_status`, { order_id: order.id, status: 'Picked Up' }, { headers: getAuthHeaders() });
                                                            showToast('🚚 Order marked as Picked Up!');
                                                            fetchOrders();
                                                        } catch (err) { showToast('Failed to advance status'); }
                                                    }}
                                                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                >
                                                    <Truck size={14} /> Mark Picked Up →
                                                </button>
                                            </div>
                                        ) : isPickedUp ? (
                                             <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                                                <p className="text-[11px] text-blue-700 font-mono font-bold">
                                                    🚚 Produce picked up from farm gate by logistics.
                                                </p>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post(`${API_BASE_URL}/api/orders/update_status`, { order_id: order.id, status: 'In Transit' }, { headers: getAuthHeaders() });
                                                            showToast('🛣️ Order marked as In Transit!');
                                                            fetchOrders();
                                                        } catch (err) { showToast('Failed to advance status'); }
                                                    }}
                                                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                >
                                                    <Truck size={14} /> Mark In Transit →
                                                </button>
                                            </div>
                                        ) : isInTransit ? (
                                             <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                                                <p className="text-[11px] text-purple-700 font-mono font-bold">
                                                    🛣️ In transit to central APMC buyer hub.
                                                </p>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post(`${API_BASE_URL}/api/orders/update_status`, { order_id: order.id, status: 'Delivered' }, { headers: getAuthHeaders() });
                                                            showToast('🎉 Order marked as Delivered!');
                                                            fetchOrders();
                                                        } catch (err) { showToast('Failed to advance status'); }
                                                    }}
                                                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                >
                                                    <Check size={14} /> Mark Delivered ✅
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="pt-2 border-t border-gray-100">
                                                <p className="text-[11px] text-gray-500 font-mono text-right">
                                                    {isDelivered ? '🎉 Order successfully delivered to buyer.' :
                                                     st === 'rejected' ? '🔄 Product stock has been automatically released back to your listings.' :
                                                     '✕ Order was cancelled by the buyer.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    );
                })()}

                {/* --- 4. MANDI PRICE FORECAST VIEW --- */}
                {activeView === 'forecast' && (
                    <div className="space-y-4">
                        {/* ── Header ── */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-mono mb-2 border border-amber-200">
                                    <Sparkles size={14} className="text-amber-600" /> AI Mandi Intelligence — AGMARKNET
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 font-serif">Mandi Demand & Price Forecasting</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Live AI insights from real AGMARKNET data — updated daily</p>
                            </div>
                            <div className="bg-[#041B13] border border-[#10B981]/30 px-4 py-2 rounded-xl text-xs font-mono text-[#34D399]">
                                📡 Source: data.gov.in (NDSAP)
                            </div>
                        </div>

                        {/* ── Live AI Forecast Widget ── */}
                        <div className="bg-[#07241A] rounded-3xl border border-[#10B981]/25 p-5 sm:p-6 shadow-xl">
                            <ForecastWidget
                                role="farmer"
                                defaultCommodity={(profileData.primary_crops || '').split(',')[0].trim() || 'Tomato'}
                                defaultMarket={(profileData.village_district || '').split(',').slice(-1)[0].trim() || 'Pune'}
                            />
                        </div>

                        {/* ── Tips Banner ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                                <span className="text-xl">📦</span>
                                <div><span className="text-emerald-900 font-bold block">Storage Tip</span><span className="text-emerald-700">If price is rising, hold produce 7–10 days in cold storage to maximize returns.</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2">
                                <span className="text-xl">🚚</span>
                                <div><span className="text-blue-900 font-bold block">Transport Window</span><span className="text-blue-700">Ship early morning (5–8 AM) to avoid mandi congestion on peak days.</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                                <span className="text-xl">📊</span>
                                <div><span className="text-amber-900 font-bold block">Market Intelligence</span><span className="text-amber-700">Monsoon months typically bring supply dips — plan staggered harvests.</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 5. LOGISTICS & PICKUP VIEW --- */}
                {activeView === 'logistics' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div><h2 className="text-2xl font-bold text-gray-900 font-serif">Smart Farm-Gate Logistics</h2><p className="text-xs text-gray-500">Pooled vehicle aggregation and live driver dispatch</p></div>
                            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-mono font-bold border border-emerald-200">Route Engine #OR-49</span>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-gray-100"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold"><Truck size={20} /></div><div><h3 className="font-bold text-gray-900">Assigned Van: Tata Ace (MH-12-QE-4920)</h3><p className="text-xs text-gray-500">Driver: Santosh Jadhav • +91 98221 44102</p></div></div>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Pickup Location:</span><span className="text-gray-900 font-semibold">Survey No. 42, Haveli, Pune</span></div>
                                    <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Estimated Arrival:</span><span className="text-emerald-700 font-bold font-mono">Today at 11:30 AM (In 25 mins)</span></div>
                                    <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Aggregated Batch:</span><span className="text-gray-900 font-semibold">500kg Tomatoes (Pooled with 2 other farms)</span></div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                                    <div><div className="text-xs text-emerald-800 font-medium">Pickup Security OTP</div><div className="text-2xl font-bold font-mono text-[#EA580C]">4910</div></div>
                                    <button onClick={() => showToast('OTP shared with driver Santosh')} className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition">Share with Driver</button>
                                </div>
                            </div>
                            <div className="bg-[#07241A] text-white border border-white/10 p-6 rounded-2xl flex flex-col justify-between shadow-lg">
                                <h3 className="font-bold text-white text-sm mb-3">Live Multi-Stop Route Telemetry</h3>
                                <div className="bg-[#031710] h-48 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                                    <svg className="w-full h-full" viewBox="0 0 280 120">
                                        <path d="M 20 80 Q 90 20, 160 70 T 260 30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                                        <path d="M 20 80 Q 90 20, 160 70 T 260 30" fill="none" stroke="#10B981" strokeWidth="3" className="animate-route-dash" />
                                        <circle cx="20" cy="80" r="5" fill="#10B981" /><circle cx="115" cy="40" r="7" fill="#F59E0B" className="animate-ping" /><circle cx="115" cy="40" r="5" fill="#F59E0B" /><circle cx="260" cy="30" r="7" fill="#EA580C" />
                                    </svg>
                                    <div className="absolute bottom-3 left-3 text-[10px] font-mono text-[#34D399] bg-[#022C22]/90 px-2 py-1 rounded border border-[#10B981]/30">Van Status: Moving to Stop 2 (Your Farm)</div>
                                </div>
                                <div className="text-xs text-gray-300 mt-3 flex justify-between"><span>Pooled transit savings: <b className="text-[#34D399]">₹320 on this run</b></span><span className="text-[#34D399]">Zero Brokerage Friction</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 6. WHATSAPP KISAN BOT VIEW --- */}
                {activeView === 'whatsapp' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div><h2 className="text-2xl font-bold text-gray-900 font-serif">WhatsApp AI Assistant Sync</h2><p className="text-xs text-gray-500">List crops, check APMC rates, and receive orders straight on WhatsApp</p></div>
                            <span className="bg-[#25D366]/20 text-[#128C7E] px-3 py-1 rounded-xl text-xs font-mono font-bold border border-[#25D366]/40">+91 90211 44000</span>
                        </div>
                        <div className="max-w-xl mx-auto bg-[#07241A] text-white border border-[#25D366]/40 rounded-3xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                <div className="w-10 h-10 rounded-full bg-[#25D366] text-[#022C22] flex items-center justify-center font-bold"><MessageCircle size={22} /></div>
                                <div><h4 className="font-bold text-white text-sm">AgriConnect Kisan Bot</h4><p className="text-[11px] text-[#25D366] font-mono">Online • Official Verified Channel</p></div>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div className="bg-[#1F2C24] p-3.5 rounded-2xl max-w-[80%] text-gray-200 shadow">Namaste Ramesh ji! 🌾 Send a photo of your harvest and quantity to create a direct listing instantly.</div>
                                <div className="bg-[#054C37] p-3.5 rounded-2xl max-w-[80%] ml-auto text-white shadow space-y-1"><div>📷 [Sent photo of Tomatoes]</div><div className="text-[10px] text-gray-300">"450kg Tomatoes ready in Haveli Pune"</div></div>
                                <div className="bg-[#1F2C24] p-3.5 rounded-2xl max-w-[80%] text-gray-200 shadow space-y-1"><div className="text-[#34D399] font-bold">✅ AI Grade Assigned: Grade A (98% Firmness)</div><div>Suggested Rate: <b>₹26/kg</b>. Published to 4,000+ wholesale buyers.</div></div>
                            </div>
                            <div className="pt-2"><button onClick={() => showToast('Opening WhatsApp link: wa.me/919021144000')} className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#022C22] font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow"><MessageCircle size={18} /> Connect My WhatsApp</button></div>
                        </div>
                    </div>
                )}

                {/* --- 7. WALLET & PAYOUTS VIEW --- */}
                {activeView === 'wallet' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div><h2 className="text-2xl font-bold text-gray-900 font-serif">Kisan Digital Wallet</h2><p className="text-xs text-gray-500">Direct escrow settlements and instant bank withdrawals</p></div>
                            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-mono font-bold border border-emerald-200">KYC Verified</span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-[#062319] to-[#0A3324] text-white border border-[#10B981]/40 p-6 rounded-3xl shadow-xl space-y-4">
                                <span className="text-xs font-mono text-gray-300">AVAILABLE BALANCE</span>
                                <div className="text-4xl font-bold font-mono text-[#34D399]">{walletData.formatted_balance}</div>
                                <button onClick={async () => { try { await axios.post(`${API_BASE_URL}/api/wallet/withdraw`, { user_name: farmerName, amount: 5000 }); showToast(`✅ Withdrawal of ₹5,000 initiated!`); fetchWallet(); } catch (err) { showToast(`Transfer initiated to bank ending in **4910`); } }} className="w-full bg-[#10B981] hover:bg-[#34D399] text-[#022C22] font-extrabold py-3.5 rounded-xl text-sm shadow transition">Withdraw to Bank / UPI</button>
                            </div>
                            <div className="md:col-span-2 bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 text-sm">Recent Direct Settlements</h3>
                                <div className="space-y-2 text-xs">
                                    {walletData.transactions && walletData.transactions.length > 0 ? (
                                        walletData.transactions.slice(0, 5).map(trx => (
                                            <div key={trx.id || trx.reference_id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
                                                <div><div className="font-bold text-gray-900">{trx.title}</div><div className="text-gray-500 text-[10px]">{trx.created_at} • Trx #{trx.reference_id}</div></div>
                                                <span className={`font-bold font-mono text-sm ${trx.type === 'credit' ? 'text-emerald-700' : 'text-orange-600'}`}>{trx.formatted_amount}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-gray-500 text-center py-4">No recent settlements</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 8. PROFILE VIEW --- */}
                {activeView === 'profile' && (
                    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#047857] text-[#022C22] flex items-center justify-center font-bold text-2xl font-serif shadow">{farmerName[0] || 'R'}</div>
                            <div><h2 className="text-2xl font-bold text-gray-900">{farmerName}</h2><p className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Verified Agricultural Producer ({profileData.sub_role || 'Individual'})</p></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Primary Farm Location</span><span className="text-gray-900 font-bold">{profileData.village_district || 'Haveli, Pune'}, {profileData.state || 'Maharashtra'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">ID Verification ({profileData.id_type || 'Aadhaar'})</span><span className="text-gray-900 font-bold">{profileData.id_number || '4920-8812-3341'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Primary Registered Crops</span><span className="text-gray-900 font-bold">{profileData.primary_crops || 'Tomato, Onion, Cabbage, Chilli'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Direct Settlement UPI</span><span className="text-gray-900 font-bold">{profileData.upi_id || 'Not linked'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Bank Name & Branch</span><span className="text-gray-900 font-bold">{profileData.bank_name ? `${profileData.bank_name} (${profileData.branch_name || 'Main'})` : 'State Bank of India'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Account & IFSC Code</span><span className="text-gray-900 font-bold">{profileData.account_number ? `A/C: ${profileData.account_number} • IFSC: ${profileData.ifsc_code || 'SBIN0001234'}` : 'Direct Escrow Settlement Verified'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Account Holder & Type</span><span className="text-gray-900 font-bold">{profileData.account_holder_name || farmerName} ({profileData.account_type || 'Savings'})</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80"><span className="text-gray-500 block mb-1">Account Category</span><span className="text-gray-900 font-bold">{profileData.fpo_name ? `FPO: ${profileData.fpo_name}` : 'Independent Farmer'}</span></div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- EDIT / RESTOCK MODAL --- */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 font-serif">Edit & Restock Listing</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-gray-700 block mb-1">Available Stock (Current)</label><input type="number" value={editingProduct.quantity_kg} disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" /></div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Add Restock Quantity (kg)</label>
                                <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="e.g. 500 (adds to existing stock)" className="w-full p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-sm text-gray-900 outline-none focus:border-[#059669]" />
                                <p className="text-[11px] text-emerald-700 mt-1 font-medium">💡 Adding stock will automatically revert "Sold Out" listings back to "Active".</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">Asking Price (₹/kg)</label><input type="number" value={editingProduct.price_per_kg} onChange={(e) => setEditingProduct({ ...editingProduct, price_per_kg: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#059669]" /></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">Quality Grade</label><select value={editingProduct.quality_grade} onChange={(e) => setEditingProduct({ ...editingProduct, quality_grade: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#059669]"><option>Grade A</option><option>Grade B</option><option>Grade C</option></select></div>
                            </div>
                            <div><label className="text-xs font-bold text-gray-700 block mb-1">Harvest Date</label><input type="date" value={editingProduct.harvest_date} onChange={(e) => setEditingProduct({ ...editingProduct, harvest_date: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#059669]" /></div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={editingProduct.negotiable === 'Yes'} onChange={() => setEditingProduct({ ...editingProduct, negotiable: editingProduct.negotiable === 'Yes' ? 'No' : 'Yes' })} className="rounded accent-[#059669] w-4 h-4" />
                                <span>Price Negotiable for Bulk</span>
                            </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition">Cancel</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition">Save & Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
