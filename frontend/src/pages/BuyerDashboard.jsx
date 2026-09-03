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
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [isBulk] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Crops');
    const [selectedGrade, setSelectedGrade] = useState('Any Grade');
    const [maxPrice, setMaxPrice] = useState(10000);
    const [isListening, setIsListening] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const buyerName = localStorage.getItem('userName') || 'Tanmayi';
    const buyerId = localStorage.getItem('buyerId') || localStorage.getItem('userId') || '';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const [checkoutStep, setCheckoutStep] = useState('cart');
    const [placedOrders, setPlacedOrders] = useState([]);
    const [deliveryAddress, setDeliveryAddress] = useState('Market Yard, Gultekdi, Pune 411037');
    const [orderNote, setOrderNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (NEFT/RTGS)');
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [buyerOrderFilter, setBuyerOrderFilter] = useState('all');

    const [buyerProfile, setBuyerProfile] = useState({
        name: buyerName, gstin: '27AAAAA0000A1Z5', delivery_address: 'Market Yard, Gultekdi, Pune 411037',
        monthly_volume: '15 - 25 Tonnes', business_type: 'Grocery Chain / Wholesaler', sub_role: 'bulk'
    });

    const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3500); };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/products/');
            setProducts((res.data || []).filter(p => p.status === 'active' && p.quantity_kg > 0));
        } catch (error) { console.error("Error fetching products:", error); setProducts([]); }
    };

    const fetchBuyerProfile = async () => {
        try {
            const currentBuyer = localStorage.getItem('userName') || buyerName;
            const cached = localStorage.getItem('buyerProfile');
            if (cached) setBuyerProfile(prev => ({ ...prev, ...JSON.parse(cached) }));
            const res = await axios.get(`http://127.0.0.1:8000/api/user/profile?identifier=${encodeURIComponent(currentBuyer)}`, { headers: getAuthHeaders() });
            if (res.data) setBuyerProfile(prev => ({ ...prev, ...res.data }));
        } catch (err) { console.error("Error fetching profile:", err); }
    };

    const fetchBuyerOrders = async () => {
        try {
            const currentBuyer = localStorage.getItem('userName') || buyerName;
            const res = await axios.get(`http://127.0.0.1:8000/api/orders/?buyer_name=${encodeURIComponent(currentBuyer)}`, { headers: getAuthHeaders() });
            setBuyerOrders(res.data || []);
        } catch (err) { console.error("Error fetching orders:", err); }
    };

    const fetchCart = async () => {
        try {
            const currentBuyer = localStorage.getItem('userName') || buyerName;
            const res = await axios.get(`http://127.0.0.1:8000/api/cart?buyer_name=${encodeURIComponent(currentBuyer)}`, { headers: getAuthHeaders() });
            if (res.data && res.data.items) {
                setCart(res.data.items.map(item => ({
                    ...item,
                    orderQty: item.quantity_kg
                })));
            }
        } catch (err) {
            console.error("Error fetching server cart:", err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchBuyerProfile();
        fetchBuyerOrders();
        fetchCart();
    }, []);

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to cancel this sub-order? Stock will be returned to the farmer.')) {
            try {
                await axios.post('http://127.0.0.1:8000/api/orders/cancel', { order_id: orderId }, { headers: getAuthHeaders() });
                showToast('✅ Sub-order cancelled successfully!');
                fetchBuyerOrders();
                fetchProducts();
            } catch (err) { showToast(err.response?.data?.detail || 'Failed to cancel order'); }
        }
    };

    const addToCart = async (prod, requestedQty = null) => {
        try {
            const currentBuyer = localStorage.getItem('userName') || buyerName;
            const minMoq = prod.moq ? (parseFloat(prod.moq) || 10) : 10;
            const existing = cart.find(c => (c.product_id === prod.id || c.id === prod.id));
            const targetQty = requestedQty !== null ? requestedQty : (existing ? existing.orderQty + minMoq : minMoq);

            const res = await axios.post('http://127.0.0.1:8000/api/cart/add', {
                buyer_name: currentBuyer,
                product_id: prod.id,
                quantity_kg: targetQty,
                cancellation_window_hours: prod.cancellation_window_hours || 24
            }, { headers: getAuthHeaders() });

            if (res.data && res.data.items) {
                setCart(res.data.items.map(item => ({
                    ...item,
                    orderQty: item.quantity_kg
                })));
            }
            showToast(`🛒 Reserved ${targetQty}kg ${prod.crop_name} in cart!`);
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Could not add to cart.');
        }
    };

    const updateCartQty = async (item, newQty) => {
        const qtyNum = Number(newQty);
        if (qtyNum <= 0) {
            await removeFromCart(item.id);
            return;
        }
        try {
            const currentBuyer = localStorage.getItem('userName') || buyerName;
            const res = await axios.post('http://127.0.0.1:8000/api/cart/update', {
                buyer_name: currentBuyer,
                cart_item_id: item.id,
                quantity_kg: qtyNum
            }, { headers: getAuthHeaders() });
            if (res.data && res.data.items) {
                setCart(res.data.items.map(i => ({ ...i, orderQty: i.quantity_kg })));
            }
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Could not update quantity.');
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            const currentBuyer = localStorage.getItem('userName') || buyerName;
            const res = await axios.post('http://127.0.0.1:8000/api/cart/remove', {
                buyer_name: currentBuyer,
                cart_item_id: cartItemId
            }, { headers: getAuthHeaders() });
            if (res.data && res.data.items) {
                setCart(res.data.items.map(i => ({ ...i, orderQty: i.quantity_kg })));
            }
            showToast('Item removed & reserved stock released.');
            fetchProducts();
        } catch (err) {
            showToast('Failed to remove item from cart.');
        }
    };

    const handleVoiceSearch = () => {
        setIsListening(true); showToast('🎙️ AI Voice Search...');
        setTimeout(() => { setSearchQuery('Tomato'); setIsListening(false); showToast('🔍 Voice match found!'); }, 1800);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.farmer_name && p.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'All Crops' || p.category === selectedCategory;
        const matchesGrade = selectedGrade === 'Any Grade' || p.quality_grade === selectedGrade || (selectedGrade === 'Grade A' && p.quality_grade?.includes('A'));
        return matchesSearch && matchesCategory && matchesGrade && Number(p.price_per_kg) <= maxPrice;
    });

    const menuItems = [
        { id: 'browse', label: 'Browse Harvests', icon: ShoppingBag, badge: `${filteredProducts.length} Lots` },
        { id: 'cart', label: 'Cart & Aggregation', icon: ShoppingCart, badge: cart.length > 0 ? `${cart.length}` : undefined },
        { id: 'orders', label: 'My Orders', icon: Package, badge: buyerOrders.length > 0 ? `${buyerOrders.length}` : undefined },
        ...(isBulk ? [{ id: 'bulk', label: 'Bulk Contracts', icon: Layers }] : []),
        { id: 'tracking', label: 'Live GPS', icon: Truck },
        { id: 'trends', label: 'Mandi Signals', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    // Filter and group orders by order_group_id for Amazon/Zomato style history
    const filteredBuyerOrders = buyerOrders.filter(order => {
        const s = (order.status || '').toLowerCase();
        if (buyerOrderFilter === 'all') return true;
        if (buyerOrderFilter === 'placed') return ['placed', 'pending farmer confirmation', 'pending'].includes(s);
        if (buyerOrderFilter === 'confirmed') return ['confirmed', 'accepted', 'picked up', 'in transit', 'delivered'].includes(s);
        if (buyerOrderFilter === 'rejected') return ['rejected', 'cancelled'].includes(s);
        return true;
    });

    const getOrderStageIndex = (status) => {
        const s = (status || '').toLowerCase();
        if (['placed', 'pending farmer confirmation', 'pending'].includes(s)) return 0;
        if (['confirmed', 'accepted'].includes(s)) return 1;
        if (['picked up', 'picked_up'].includes(s)) return 2;
        if (['in transit', 'in_transit'].includes(s)) return 3;
        if (['delivered'].includes(s)) return 4;
        return -1;
    };

    const groupedOrderHistory = filteredBuyerOrders.reduce((acc, order) => {
        const groupId = order.order_group_id || order.order_number;
        if (!acc[groupId]) acc[groupId] = [];
        acc[groupId].push(order);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans">
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#0F172A] border border-[#EA580C] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#F97316]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-[#EA580C]/25 shadow-lg">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
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
                    <div className="flex-1 max-w-md hidden md:flex items-center bg-[#1E293B] border border-white/15 rounded-full px-4 py-1.5 shadow-inner">
                        <Search size={16} className="text-gray-400 mr-2.5" />
                        <input type="text" placeholder="Search crop, variety, or farmer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent text-white text-xs outline-none placeholder-gray-400" />
                        <button onClick={handleVoiceSearch} className={`p-1.5 rounded-full transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[#F97316] hover:bg-white/10'}`} title="Voice Search"><Mic size={16} /></button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setCheckoutStep('cart'); setActiveView('cart'); }} className="relative bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#EA580C]/25 hover:scale-105 active:scale-95 transition-all">
                            <ShoppingCart size={16} /><span>Cart</span>
                            {cart.length > 0 && <span className="bg-white text-[#EA580C] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono ml-1">{cart.length}</span>}
                        </button>
                        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#9A3412] text-white font-bold flex items-center justify-center text-xs">{buyerName[0] || 'B'}</div>
                            <div className="text-left hidden md:block">
                                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">{buyerName}<CheckCircle2 size={12} className="text-[#10B981]" /></div>
                                <div className="text-[10px] text-gray-400 font-mono">GST Verified Buyer</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/10 py-2 bg-[#0A1120]">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${isActive ? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/30 font-bold' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={16} /><span>{item.label}</span>
                                {item.badge !== undefined && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? 'bg-white text-[#EA580C] font-bold' : 'bg-white/10 text-gray-300'}`}>{item.badge}</span>}
                            </button>
                        );
                    })}
                </div>
            </header>

            <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
                {/* --- 1. BROWSE PRODUCE VIEW --- */}
                {activeView === 'browse' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-[#0F172A] font-serif">Verified Direct Farm Harvests</h1>
                                    <p className="text-xs text-gray-500">Zero middleman fees • Auto-aggregated for wholesale delivery</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#EA580C]"><option>All Crops</option><option>Vegetable</option><option>Fruit</option><option>Grain</option></select>
                                    <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#EA580C]"><option>Any Grade</option><option>Grade A</option><option>Grade B</option></select>
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs">
                                        <span className="text-gray-500">Max ₹:</span>
                                        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-14 bg-transparent font-mono text-gray-900 font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {filteredProducts.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#EA580C] border border-orange-200 flex items-center justify-center mx-auto shadow-sm text-3xl">🌾</div>
                                <div className="space-y-1"><h3 className="text-lg font-bold text-gray-900 font-serif">No Produce Listed Yet</h3><p className="text-xs text-gray-500 max-w-md mx-auto">Active farmers have not posted lots matching your current filter.</p></div>
                                <button onClick={fetchProducts} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition">Refresh Marketplace</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map((p) => (
                                    <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-400 transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="h-44 bg-[#07241A] relative flex items-center justify-center overflow-hidden">
                                                {p.image_url ? <img src={p.image_url} alt={p.crop_name} className="w-full h-full object-cover" /> : <span className="text-7xl filter drop-shadow-md">{p.crop_name?.toLowerCase().includes('tomato') ? '🍅' : p.crop_name?.toLowerCase().includes('onion') ? '🧅' : '🥔'}</span>}
                                                <span className="absolute top-3 right-3 bg-white text-[#064E3B] text-xs px-2.5 py-1 rounded-full font-mono font-bold shadow">{p.quality_grade || 'Grade A'}</span>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div><h3 className="font-bold text-lg text-gray-900">{p.crop_name}</h3><p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={12} className="text-emerald-600" /> By {p.farmer_name} ({p.pickup_location})</p></div>
                                                    <div className="text-right"><div className="text-xl font-bold font-mono text-[#EA580C]">₹{p.price_per_kg}/{p.unit || 'kg'}</div><span className="text-[10px] text-gray-400">Direct mandi rate</span></div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-100"><span>Available: <b>{p.quantity_kg} {p.unit || 'kg'}</b></span><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">Ready for Dispatch</span></div>
                                            </div>
                                        </div>
                                        <div className="p-5 pt-0"><button onClick={() => addToCart(p)} className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition"><Plus size={16} /> Add to Wholesale Cart</button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- 2. CART & MULTI-STEP CHECKOUT VIEW --- */}
                {activeView === 'cart' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">
                                    {checkoutStep === 'cart' && 'Wholesale Procurement Cart'}
                                    {checkoutStep === 'address' && 'Delivery Address'}
                                    {checkoutStep === 'note' && 'Order Instructions'}
                                    {checkoutStep === 'payment' && 'Payment & Checkout'}
                                    {checkoutStep === 'success' && 'Order Confirmed!'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {checkoutStep === 'cart' && 'Step 1 of 4: Review items grouped by farmer'}
                                    {checkoutStep === 'address' && 'Step 2 of 4: Confirm delivery depot'}
                                    {checkoutStep === 'note' && 'Step 3 of 4: Add special instructions'}
                                    {checkoutStep === 'payment' && 'Step 4 of 4: Finalize payment breakdown'}
                                    {checkoutStep === 'success' && 'Your orders have been placed directly with farmers'}
                                </p>
                            </div>
                            {checkoutStep !== 'success' && (
                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-400">
                                    <span className={checkoutStep === 'cart' ? 'text-[#EA580C]' : ''}>1. Cart</span> →
                                    <span className={checkoutStep === 'address' ? 'text-[#EA580C]' : ''}>2. Address</span> →
                                    <span className={checkoutStep === 'note' ? 'text-[#EA580C]' : ''}>3. Note</span> →
                                    <span className={checkoutStep === 'payment' ? 'text-[#EA580C]' : ''}>4. Pay</span>
                                </div>
                            )}
                        </div>

                        {/* STEP 1: CART */}
                        {checkoutStep === 'cart' && (
                            cart.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                                    <span className="text-6xl">🛒</span>
                                    <h3 className="text-xl font-bold text-gray-900">Your wholesale cart is empty</h3>
                                    <p className="text-xs text-gray-500">Browse verified produce and add lots to group for combined logistics.</p>
                                    <button onClick={() => setActiveView('browse')} className="bg-[#EA580C] hover:bg-[#C2410C] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow">Browse Fresh Produce</button>
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-12 gap-8">
                                    <div className="lg:col-span-8 space-y-6">
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-3">
                                            <Sparkles size={20} className="shrink-0 text-emerald-700" />
                                            <span><b>⚡ Auto-Aggregation Active:</b> Orders from the same region are bundled into a single delivery van, saving you transit fees!</span>
                                        </div>
                                        {Object.entries(cart.reduce((acc, item) => {
                                            if (!acc[item.farmer_name]) acc[item.farmer_name] = [];
                                            acc[item.farmer_name].push(item);
                                            return acc;
                                        }, {})).map(([farmerName, items]) => (
                                            <div key={farmerName} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4">
                                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><MapPin size={16} className="text-[#EA580C]" /> {farmerName} <span className="text-xs font-mono text-gray-400">(Sub-Cart)</span></h3>
                                                    <span className="text-xs font-mono text-gray-500">Subtotal: ₹{items.reduce((s, i) => s + (i.price_per_kg * i.orderQty), 0)}</span>
                                                </div>
                                                {items.map((item) => {
                                                    const maxQty = item.quantity_kg;
                                                    const minQty = item.moq || 25;
                                                    const isInvalid = item.orderQty < minQty || item.orderQty > maxQty;
                                                    return (
                                                        <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">{item.crop_name?.toLowerCase().includes('tomato') ? '🍅' : '🌱'}</span>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900">{item.crop_name}</h4>
                                                                    <p className="text-gray-500">₹{item.price_per_kg}/kg • Stock: {maxQty}kg • MOQ: {minQty}kg</p>
                                                                    {isInvalid && <p className="text-red-500 font-mono text-[10px] mt-1">{item.orderQty < minQty ? `Min ${minQty}kg required` : `Max ${maxQty}kg available`}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <input type="number" value={item.orderQty} min={minQty} max={maxQty} onChange={(e) => updateCartQty(item, e.target.value)} className={`w-20 p-2 border rounded-lg text-center font-mono font-bold ${isInvalid ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-900'}`} />
                                                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50" title="Remove from cart"><Trash2 size={16} /></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="lg:col-span-4 bg-white border border-gray-200 p-6 rounded-3xl space-y-6 h-fit shadow-sm sticky top-24">
                                        <h3 className="font-bold text-gray-900 text-base">Order Summary</h3>
                                        {(() => {
                                            const subtotal = cart.reduce((s, i) => s + (i.price_per_kg * i.orderQty), 0);
                                            const totalQty = cart.reduce((s, i) => s + i.orderQty, 0);
                                            const isBulk = buyerProfile.sub_role === 'bulk';
                                            const bulkMin = 100;
                                            const meetsBulkMin = !isBulk || totalQty >= bulkMin;
                                            const hasInvalidQty = cart.some(i => i.orderQty < (i.moq || 25) || i.orderQty > i.quantity_kg);
                                            return (
                                                <>
                                                    <div className="space-y-3 text-xs font-mono">
                                                        <div className="flex justify-between text-gray-600"><span>Subtotal ({totalQty}kg)</span><span>₹{subtotal}</span></div>
                                                        <div className="flex justify-between text-gray-600"><span>Pooled Logistics Fee</span><span className="text-emerald-700 font-bold">₹180</span></div>
                                                        <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900"><span>Total</span><span className="text-[#EA580C] font-mono">₹{subtotal + 180}</span></div>
                                                    </div>
                                                    {isBulk && !meetsBulkMin && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-mono text-center">⚠️ Add {bulkMin - totalQty}kg more for bulk checkout.</div>}
                                                    <button onClick={() => setCheckoutStep('address')} disabled={!meetsBulkMin || hasInvalidQty} className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition ${meetsBulkMin && !hasInvalidQty ? 'bg-[#EA580C] hover:bg-[#C2410C] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Proceed to Delivery <ArrowRight size={16} className="inline ml-2" /></button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )
                        )}

                        {/* STEP 2: ADDRESS */}
                        {checkoutStep === 'address' && (
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm space-y-6 max-w-3xl mx-auto">
                                <h3 className="font-bold text-lg text-gray-900">Confirm Delivery Depot</h3>
                                <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#EA580C]" rows={4} />
                                <div className="flex gap-4">
                                    <button onClick={() => setCheckoutStep('cart')} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition">Back to Cart</button>
                                    <button onClick={() => setCheckoutStep('note')} className="flex-1 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold text-sm transition shadow">Continue</button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: NOTE */}
                        {checkoutStep === 'note' && (
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm space-y-6 max-w-3xl mx-auto">
                                <h3 className="font-bold text-lg text-gray-900">Special Instructions for Farmers/Logistics</h3>
                                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="e.g. Please deliver before 10 AM. Need quality check on arrival." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#EA580C]" rows={4} />
                                <div className="flex gap-4">
                                    <button onClick={() => setCheckoutStep('address')} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition">Back</button>
                                    <button onClick={() => setCheckoutStep('payment')} className="flex-1 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold text-sm transition shadow">Proceed to Payment</button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PAYMENT */}
                        {checkoutStep === 'payment' && (
                            <div className="grid lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 space-y-6">
                                    {Object.entries(cart.reduce((acc, item) => {
                                        if (!acc[item.farmer_name]) acc[item.farmer_name] = [];
                                        acc[item.farmer_name].push(item);
                                        return acc;
                                    }, {})).map(([farmerName, items]) => (
                                        <div key={farmerName} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                            <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Sub-Order: {farmerName}</h3>
                                            {items.map(item => (
                                                <div key={item.id} className="flex justify-between text-xs py-2">
                                                    <span>{item.crop_name} ({item.orderQty}kg @ ₹{item.price_per_kg})</span>
                                                    <span className="font-bold">₹{item.orderQty * item.price_per_kg}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 mt-2 border-t border-gray-100">
                                                <span>Farmer Subtotal</span>
                                                <span>₹{items.reduce((s, i) => s + (i.price_per_kg * i.orderQty), 0)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="lg:col-span-4 bg-white border border-gray-200 p-6 rounded-3xl space-y-6 h-fit shadow-sm">
                                    <h3 className="font-bold text-gray-900 text-base">Payment Method</h3>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#EA580C]">
                                        <option>Bank Transfer (NEFT/RTGS)</option>
                                        <option>UPI / QR Code</option>
                                        <option>Cash on Delivery (COD)</option>
                                    </select>
                                    <div className="space-y-2 text-xs font-mono border-t pt-4">
                                         <div className="flex justify-between text-gray-600"><span>Items Total</span><span>₹{cart.reduce((s, i) => s + (i.price_per_kg * i.orderQty), 0)}</span></div>
                                         <div className="flex justify-between text-gray-600"><span>Logistics Fee</span><span>₹180</span></div>
                                         <div className="flex justify-between text-gray-600"><span>GST / Taxes</span><span>₹0.00</span></div>
                                         <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t mt-2"><span>Grand Total</span><span className="text-[#EA580C]">₹{cart.reduce((s, i) => s + (i.price_per_kg * i.orderQty), 0) + 180}</span></div>
                                     </div>
                                     <button
                                         onClick={async () => {
                                             try {
                                                 const currentBuyer = localStorage.getItem('userName') || buyerName;
                                                 const res = await axios.post('http://127.0.0.1:8000/api/checkout', {
                                                     buyer_name: currentBuyer,
                                                     delivery_address: deliveryAddress || buyerProfile.delivery_address || 'Market Yard, Gultekdi, Pune 411037',
                                                     order_note: orderNote || 'Standard wholesale delivery with quality inspection.',
                                                     payment_method: paymentMethod || 'Bank Transfer (NEFT/RTGS)',
                                                     items: cart.map(i => ({ 
                                                         product_id: i.product_id || i.id, 
                                                         farmer_name: i.farmer_name, 
                                                         crop_name: i.crop_name, 
                                                         quantity_kg: Number(i.orderQty || i.quantity_kg), 
                                                         price_per_kg: Number(i.price_per_kg), 
                                                         cancellation_window_hours: i.cancellation_window_hours || 24 
                                                     }))
                                                 }, { headers: getAuthHeaders() });
                                                 setPlacedOrders(res.data.orders);
                                                 setCart([]);
                                                 setCheckoutStep('success');
                                                 fetchBuyerOrders();
                                                 fetchProducts();
                                                 showToast(`🎉 Order Placed! Reference #${res.data.order_group_id || 'AG'}`);
                                             } catch (err) {
                                                 showToast(err.response?.data?.detail || 'Checkout failed. Stock changed.');
                                                 setCheckoutStep('cart');
                                             }
                                         }}
                                         className="w-full py-4 rounded-2xl font-bold text-sm shadow-xl bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-orange-600/25 transition"
                                     >Confirm & Place Order</button>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: SUCCESS ACKNOWLEDGEMENT */}
                        {checkoutStep === 'success' && (
                            <div className="bg-white border border-emerald-300 p-8 sm:p-10 rounded-3xl shadow-lg text-center max-w-3xl mx-auto space-y-6">
                                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-pulse">
                                    <CheckCircle2 size={48} className="stroke-[2.5]" />
                                </div>
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-mono font-bold mb-2">
                                        <Sparkles size={13} className="text-emerald-600" /> OFFICIAL PROCURER ACKNOWLEDGEMENT
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Order Successfully Placed!</h2>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        Your order has been routed to individual farmers. You will receive live SMS & app tracking once accepted.
                                    </p>
                                </div>

                                {/* Prominent Order Group ID */}
                                {placedOrders[0]?.order_group_id && (
                                    <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#EA580C]/30 rounded-2xl p-5 text-center">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Order Group Reference</p>
                                        <p className="text-2xl font-extrabold font-mono text-[#F97316] tracking-wider">{placedOrders[0].order_group_id}</p>
                                        <p className="text-[11px] text-gray-400 mt-1">Share this ID with the farmer or logistics team</p>
                                    </div>
                                )}

                                <div className="grid sm:grid-cols-2 gap-4 text-left text-xs bg-gray-50 p-5 rounded-2xl border border-gray-200 font-mono">
                                    <div>
                                        <span className="text-gray-400 block uppercase font-bold text-[10px]">Delivery Depot</span>
                                        <p className="text-gray-800 font-semibold mt-0.5">{deliveryAddress || 'Central APMC Hub'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block uppercase font-bold text-[10px]">Payment Terms</span>
                                        <p className="text-emerald-700 font-bold mt-0.5">{paymentMethod}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-left bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                    <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                                        <span>Sub-Order Summary:</span>
                                        <span className="text-xs font-mono font-bold text-[#EA580C]">{placedOrders.length} Farmer Allocations</span>
                                    </h3>
                                    <div className="divide-y divide-gray-200/80">
                                        {placedOrders.map(o => (
                                            <div key={o.id} className="flex justify-between items-center py-2.5 text-xs font-mono">
                                                <div>
                                                    <span className="text-[#EA580C] font-bold mr-2">#{o.order_number}</span>
                                                    <span className="text-gray-900 font-bold">{o.crop_name}</span>
                                                    <span className="text-gray-500 text-[11px] block sm:inline sm:ml-2">by {o.farmer_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-700 font-bold">{o.quantity_kg}kg @ ₹{o.price_per_kg}/kg</span>
                                                    <span className="text-emerald-700 font-bold block">₹{o.total_amount}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between pt-3 border-t border-gray-200 font-bold text-sm">
                                        <span className="text-gray-600">Grand Total (excl. logistics)</span>
                                        <span className="text-[#EA580C] font-mono">₹{placedOrders.reduce((s, o) => s + o.total_amount, 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button 
                                        onClick={() => { setCheckoutStep('cart'); setActiveView('orders'); }} 
                                        className="flex-1 bg-[#EA580C] hover:bg-[#C2410C] text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-lg shadow-orange-600/25"
                                    >
                                        Track in My Orders →
                                    </button>
                                    <button 
                                        onClick={() => { setCheckoutStep('cart'); setActiveView('browse'); }} 
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition"
                                    >
                                        Continue Procurement
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- 3. ORDERS VIEW (ZOMATO/AMAZON STYLE GROUPED HISTORY) --- */}
                {activeView === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">My Procurement Orders</h2>
                                <p className="text-xs text-gray-500">Real-time status tracking, farmer acceptance & direct farm-gate pickups</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchBuyerOrders} className="p-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition" title="Refresh Orders"><RefreshCw size={16} /></button>
                                {/* Filter Tabs */}
                                <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl text-xs font-semibold">
                                    <button onClick={() => setBuyerOrderFilter('all')} className={`px-3 py-1.5 rounded-xl transition ${buyerOrderFilter === 'all' ? 'bg-white text-gray-900 shadow font-bold' : 'text-gray-500 hover:text-gray-900'}`}>All ({buyerOrders.length})</button>
                                    <button onClick={() => setBuyerOrderFilter('placed')} className={`px-3 py-1.5 rounded-xl transition ${buyerOrderFilter === 'placed' ? 'bg-amber-100 text-amber-900 shadow font-bold' : 'text-gray-500 hover:text-amber-800'}`}>Pending ({buyerOrders.filter(o => o.status === 'placed').length})</button>
                                    <button onClick={() => setBuyerOrderFilter('confirmed')} className={`px-3 py-1.5 rounded-xl transition ${buyerOrderFilter === 'confirmed' ? 'bg-emerald-100 text-emerald-900 shadow font-bold' : 'text-gray-500 hover:text-emerald-800'}`}>Confirmed ({buyerOrders.filter(o => o.status === 'confirmed').length})</button>
                                    <button onClick={() => setBuyerOrderFilter('rejected')} className={`px-3 py-1.5 rounded-xl transition ${buyerOrderFilter === 'rejected' ? 'bg-red-100 text-red-900 shadow font-bold' : 'text-gray-500 hover:text-red-800'}`}>Rejected/Cancelled ({buyerOrders.filter(o => o.status === 'rejected' || o.status === 'cancelled').length})</button>
                                </div>
                            </div>
                        </div>

                        {Object.keys(groupedOrderHistory).length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                                <span className="text-6xl">📦</span>
                                <h3 className="text-xl font-bold text-gray-900">No Orders Found</h3>
                                <p className="text-xs text-gray-500">No orders match the selected filter. Browse verified harvests to place lots.</p>
                                <button onClick={() => setActiveView('browse')} className="bg-[#EA580C] hover:bg-[#C2410C] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow">Browse Fresh Produce</button>
                            </div>
                        ) : (
                            Object.entries(groupedOrderHistory).map(([groupId, subOrders]) => (
                                <div key={groupId} className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div>
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">ORDER BUNDLE</span>
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 font-mono">#{groupId}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                                            <span>Placed: {subOrders[0].created_at ? new Date(subOrders[0].created_at).toLocaleString() : 'Today'}</span>
                                            <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-bold text-gray-800">{subOrders.length} Sub-Orders</span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {subOrders.map(order => {
                                            const sLower = (order.status || '').toLowerCase();
                                            const isPending = ['placed', 'pending farmer confirmation', 'pending'].includes(sLower);
                                            return (
                                                <div key={order.id} className="p-6 space-y-4 hover:bg-gray-50/50 transition">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div className="space-y-1.5 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-xs font-mono text-emerald-700 font-bold">SUB-ORDER #{order.order_number}</span>
                                                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                                                                    isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                                    ['confirmed', 'accepted'].includes(sLower) ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                                    ['picked up', 'picked_up'].includes(sLower) ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                                    ['in transit', 'in_transit'].includes(sLower) ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                                    sLower === 'delivered' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                                                                    'bg-red-100 text-red-700 border border-red-200'
                                                                }`}>
                                                                    {isPending ? '⏳ Awaiting Farmer Confirmation' :
                                                                     ['confirmed', 'accepted'].includes(sLower) ? '✅ Confirmed by Farmer' :
                                                                     ['picked up', 'picked_up'].includes(sLower) ? '📦 Picked Up from Farm' :
                                                                     ['in transit', 'in_transit'].includes(sLower) ? '🚚 In Transit to Depot' :
                                                                     sLower === 'delivered' ? '🎉 Delivered & Verified' :
                                                                     sLower === 'rejected' ? '❌ Rejected by Farmer' :
                                                                     '❌ Cancelled by Buyer'}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-gray-900 text-base">{order.quantity_kg}kg {order.crop_name}</h4>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <span>Farmer: <b>{order.farmer_name}</b></span> • 
                                                                <span>Rate: <b>₹{order.price_per_kg}/kg</b></span>
                                                            </p>
                                                            {order.delivery_address && (
                                                                <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-1">
                                                                    <MapPin size={11} className="text-[#EA580C]" /> Depot: {order.delivery_address}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                                                            <div className="text-left sm:text-right">
                                                                <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono">₹{order.total_amount}</div>
                                                                <span className="text-[10px] text-gray-400 font-mono">{order.payment_method || 'NEFT/RTGS'}</span>
                                                            </div>
                                                            {isPending ? (() => {
                                                                const orderTime = new Date(order.created_at).getTime();
                                                                const cancelDeadline = orderTime + ((order.cancellation_window_hours || 24) * 60 * 60 * 1000);
                                                                const canCancel = Date.now() < cancelDeadline;
                                                                return canCancel ? (
                                                                    <button onClick={() => handleCancelOrder(order.id)} className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold text-xs transition flex items-center gap-1"><X size={14} /> Cancel</button>
                                                                ) : (
                                                                    <span className="text-[11px] text-gray-400 font-mono">Window expired</span>
                                                                );
                                                            })() : (
                                                                <span className="text-[11px] text-gray-400 font-mono">Finalized</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 5-Stage Stepper */}
                                                    {(() => {
                                                        const stage = getOrderStageIndex(order.status);
                                                        if (stage === -1) {
                                                            return (
                                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono flex items-center gap-2">
                                                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                                                    <span>Sub-order {sLower === 'rejected' ? 'was rejected by the farmer. Reserved stock has been automatically released back to the marketplace.' : 'was cancelled by buyer.'}</span>
                                                                </div>
                                                            );
                                                        }
                                                        const stages = [
                                                            { label: 'Pending', icon: Clock },
                                                            { label: 'Confirmed', icon: CheckCircle2 },
                                                            { label: 'Picked Up', icon: Package },
                                                            { label: 'In Transit', icon: Truck },
                                                            { label: 'Delivered', icon: Check }
                                                        ];
                                                        return (
                                                            <div className="pt-4 border-t border-gray-100">
                                                                <div className="flex items-center justify-between relative px-2 sm:px-6">
                                                                    <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 z-0" />
                                                                    <div 
                                                                        className="absolute top-4 left-6 h-1 bg-emerald-500 z-0 transition-all duration-500" 
                                                                        style={{ width: `${(stage / 4) * 88}%` }}
                                                                    />
                                                                    {stages.map((st, idx) => {
                                                                        const IconCmp = st.icon;
                                                                        const isPassed = idx <= stage;
                                                                        const isCurrent = idx === stage;
                                                                        return (
                                                                            <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                                                    isPassed 
                                                                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                                                                                        : 'bg-white text-gray-400 border-2 border-gray-200'
                                                                                } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                                                                                    <IconCmp size={14} />
                                                                                </div>
                                                                                <span className={`text-[10px] font-mono mt-1 font-bold ${isPassed ? 'text-emerald-800' : 'text-gray-400'}`}>
                                                                                    {st.label}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- 4. BULK CONTRACTS VIEW --- */}
                {activeView === 'bulk' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 px-3 py-1 rounded-full text-xs font-mono mb-2 border border-orange-200"><Layers size={14} /> Cooperative Demand Aggregation</div>
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
                                    <button onClick={() => showToast('Cooperative contract inquiry broadcast to 240+ FPOs!')} className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-3 rounded-xl font-bold transition">Broadcast to 240+ Farmer FPOs</button>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 text-base">Active Cooperative Contracts</h3>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs space-y-2">
                                    <div className="flex justify-between font-bold text-gray-900"><span>Nashik Onion FPO Pool</span><span className="text-emerald-700">Active (3 Tonnes/Week)</span></div>
                                    <p className="text-gray-500 text-[11px]">Direct contract across 12 farmers • Rate fixed at ₹18.50/kg</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 5. LIVE GPS TELEMETRY VIEW --- */}
                {activeView === 'tracking' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div><h2 className="text-2xl font-bold text-gray-900 font-serif">Live Fleet & Produce Telemetry</h2><p className="text-xs text-gray-500">GPS waypoint telemetry and in-transit produce freshness monitoring</p></div>
                            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 font-bold">Van Active: MH-14-AZ-2022</span>
                        </div>
                        <div className="bg-[#07241A] text-white border border-[#10B981]/30 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                            <div className="h-64 bg-[#031710] rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                                <svg className="w-full h-full" viewBox="0 0 280 120">
                                    <path d="M 30 90 Q 100 30, 180 80 T 260 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                                    <path d="M 30 90 Q 100 30, 180 80 T 260 40" fill="none" stroke="#EA580C" strokeWidth="3" className="animate-route-dash" />
                                    <circle cx="30" cy="90" r="5" fill="#10B981" /><circle cx="120" cy="48" r="5" fill="#10B981" />
                                    <circle cx="190" cy="80" r="8" fill="#F97316" className="animate-ping" /><circle cx="190" cy="80" r="6" fill="#F97316" />
                                    <circle cx="260" cy="40" r="7" fill="#34D399" />
                                </svg>
                                <div className="absolute top-3 left-4 text-xs font-mono text-gray-300 bg-[#022C22]/90 px-3 py-1 rounded-xl border border-[#10B981]/30">🚚 Van en route to Wholesale Depot (ETA: 38 Mins)</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10"><span className="text-gray-400 block">Total Trip Distance</span><span className="text-white font-bold text-sm">34.2 km (3 stops)</span></div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10"><span className="text-gray-400 block">Transit Temperature</span><span className="text-[#34D399] font-bold text-sm">22°C (Optimal Freshness)</span></div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10"><span className="text-gray-400 block">OTP for Delivery Receiving</span><span className="text-[#F59E0B] font-bold text-sm">8819</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 6. MANDI SIGNALS VIEW --- */}
                {activeView === 'trends' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"><h2 className="text-2xl font-bold text-gray-900 font-serif">Mandi Price Trends & Buy Signals</h2><p className="text-xs text-gray-500">AI procurement signals on best time to buy vs wait</p></div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white border border-emerald-300 p-6 rounded-3xl shadow-sm"><span className="text-xs font-mono text-emerald-700 font-bold">BUY SIGNAL: STRONG</span><h3 className="text-lg font-bold text-gray-900 mt-1">Potatoes (Satara Hub)</h3><p className="text-xs text-gray-500 mt-2">Prices are at a 30-day low of ₹17/kg due to peak harvest arrival. Buy today.</p></div>
                            <div className="bg-white border border-orange-300 p-6 rounded-3xl shadow-sm"><span className="text-xs font-mono text-[#EA580C] font-bold">HOLD SIGNAL</span><h3 className="text-lg font-bold text-gray-900 mt-1">Tomatoes (Pune Hub)</h3><p className="text-xs text-gray-500 mt-2">Demand rising by 24% over next 4 days. Expected price stabilization next Monday.</p></div>
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm"><span className="text-xs font-mono text-gray-500 font-bold">STABLE MARKET</span><h3 className="text-lg font-bold text-gray-900 mt-1">Onions (Nashik)</h3><p className="text-xs text-gray-500 mt-2">Steady inflow across all APMC yards. Price holding at ₹19/kg.</p></div>
                        </div>
                    </div>
                )}

                {/* --- 7. PROFILE VIEW --- */}
                {activeView === 'profile' && (
                    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white flex items-center justify-center font-bold text-2xl font-serif shadow">{buyerName[0] || 'B'}</div>
                            <div><h2 className="text-2xl font-bold text-gray-900">{buyerName}</h2><p className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Registered Wholesale Buyer (GSTIN Verified)</p></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Business Registration</span><span className="text-gray-900 font-bold">{buyerProfile.gstin ? `GSTIN: ${buyerProfile.gstin}` : 'Verified Consumer Buyer'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Delivery Depot Address</span><span className="text-gray-900 font-bold">{buyerProfile.delivery_address || 'Market Yard, Gultekdi, Pune 411037'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Monthly Procurement Volume</span><span className="text-gray-900 font-bold">{buyerProfile.monthly_volume || '15 - 25 Tonnes'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Business Category</span><span className="text-gray-900 font-bold">{buyerProfile.business_type || 'Retailer / Wholesaler'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Registered Contact</span><span className="text-gray-900 font-bold">{buyerProfile.mobile || 'Registered Phone'} • {buyerProfile.email || 'Verified'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">UPI / Payment Handle</span><span className="text-gray-900 font-bold">{buyerProfile.upi_id || 'Not linked'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Bank Name & Branch</span><span className="text-gray-900 font-bold">{buyerProfile.bank_name ? `${buyerProfile.bank_name} (${buyerProfile.branch_name || 'Main'})` : 'Not linked'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Account & IFSC Code</span><span className="text-gray-900 font-bold">{buyerProfile.account_number ? `A/C: ${buyerProfile.account_number} • IFSC: ${buyerProfile.ifsc_code || '—'}` : 'Direct Escrow Settlement Verified'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Account Holder & Type</span><span className="text-gray-900 font-bold">{buyerProfile.account_holder_name || buyerName} ({buyerProfile.account_type || 'Current'})</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Settlement Mode</span><span className="text-gray-900 font-bold">Direct Escrow Settlement (Platform Verified)</span></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}