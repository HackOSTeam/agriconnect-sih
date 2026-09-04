import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck, MapPin, CheckCircle2, AlertCircle, Clock, Package,
    Navigation, ArrowLeft, Star, Bell, Home, Settings,
    Power, Snowflake, FileText, TrendingUp, Zap, X, Camera
} from 'lucide-react';
import axios from 'axios';

export default function LogisticsDashboard() {
    const [activeView, setActiveView] = useState('overview');
    const [profile, setProfile] = useState({});
    const [vehicles, setVehicles] = useState([]);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [status, setStatus] = useState('Available');
    const [toastMessage, setToastMessage] = useState('');
    const name = localStorage.getItem('userName') || 'Logistics Partner';

    const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/user/profile?identifier=${encodeURIComponent(name)}`);
            if (res.data) {
                setProfile(res.data);
                // Parse the vehicles JSON string
                if (res.data.vehicles_json) {
                    try { setVehicles(JSON.parse(res.data.vehicles_json)); } catch (e) { setVehicles([]); }
                }
            }
        } catch (err) { console.error("Profile fetch error:", err); }
    };

    useEffect(() => { fetchProfile(); }, []);

    const assignedTasks = [
        { id: 1, priority: 'Perishable - Priority', farmer: 'Ramesh Patel', address: 'Haveli, Pune', produce: '500kg Tomatoes', drop: 'Pune APMC Hub', time: '11:30 AM', distance: '14 km' },
        { id: 2, priority: 'Standard', farmer: 'Suresh Shinde', address: 'Saswad', produce: '800kg Onions', drop: 'Market Yard, Gultekdi', time: '2:00 PM', distance: '22 km' },
    ];

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'tasks', label: 'Assigned Tasks', icon: Package, badge: assignedTasks.length },
        { id: 'vehicle', label: 'Vehicle & Profile', icon: Truck },
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
    ];

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-[#0F172A] font-sans">
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#0F172A] border border-[#EA580C] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Zap size={18} className="text-[#F97316]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-[#EA580C]/25 shadow-lg">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition"><ArrowLeft size={18} /></Link>
                        <div className="w-9 h-9 bg-gradient-to-br from-[#EA580C] to-[#C2410C] rounded-xl flex items-center justify-center text-white shadow">
                            <Truck size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white font-serif">AgriConnect Fleet Command</h1>
                            <p className="text-[10px] text-[#F97316] font-mono">Dynamic Multi-Farm Aggregation Engine</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setStatus(status === 'Available' ? 'Busy' : 'Available'); showToast(`Status changed to ${status === 'Available' ? 'Busy' : 'Available'}`); }} className={`text-xs px-3 py-1.5 rounded-full font-mono font-bold border transition ${status === 'Available' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                            <Power size={12} className="inline mr-1" /> {status}
                        </button>
                        <div className="hidden md:block text-right">
                            <div className="text-xs font-bold text-white">{name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{profile.vehicle_type || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                <div className="px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/10 py-2 bg-[#0A1120]">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${isActive ? 'bg-[#EA580C] text-white shadow-md font-bold' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                <Icon size={16} /><span>{item.label}</span>
                                {item.badge !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-white text-[#EA580C] font-bold">{item.badge}</span>}
                            </button>
                        );
                    })}
                </div>
            </header>

            <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
                {/* --- 1. OVERVIEW --- */}
                {activeView === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Today's Pickups</span>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono mt-1">{assignedTasks.length}</div>
                                <div className="text-[11px] text-[#EA580C] mt-1 font-bold">2 Perishable Priority</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Load</span>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono mt-1">1.3 Tons</div>
                                <div className="text-[11px] text-gray-500 mt-1 font-medium">Combined from 2 Farms</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Est. Earnings</span>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono mt-1">₹1,450</div>
                                <div className="text-[11px] text-emerald-700 mt-1 font-bold">Paid via Escrow</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Your Rating</span>
                                <div className="text-3xl font-bold text-[#0F172A] font-mono mt-1 flex items-center gap-2">5.0 <Star size={20} className="text-amber-500 fill-amber-500" /></div>
                                <div className="text-[11px] text-gray-500 mt-1 font-medium">{profile.trips_completed || 0} Trips Completed</div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold mb-1">Fleet Status</h3>
                                <p className="text-xs text-gray-500">Manage your vehicles and profile details</p>
                            </div>
                            <button onClick={() => setShowVehicleModal(true)} className="px-5 py-3 bg-[#EA580C] text-white rounded-xl font-bold text-sm hover:bg-[#C2410C] transition flex items-center gap-2">
                                <Truck size={16} /> View Vehicle Details ({vehicles.length})
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 2. ASSIGNED TASKS --- */}
                {activeView === 'tasks' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 font-serif">Pickup & Drop Tasks</h2>
                            <p className="text-xs text-gray-500">Optimized sequence for maximum fuel efficiency</p>
                        </div>
                        {assignedTasks.map((task, idx) => (
                            <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-mono text-[#EA580C] font-bold">STOP {idx + 1}</span>
                                        <h3 className="text-lg font-bold text-gray-900">{task.address}</h3>
                                    </div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold ${task.priority.includes('Priority') ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                                    <div className="flex items-start gap-2 bg-emerald-50 p-3 rounded-xl">
                                        <MapPin size={16} className="text-emerald-600 mt-0.5" />
                                        <div><span className="block text-emerald-600 font-bold">PICKUP</span> {task.farmer} <br /> {task.produce}</div>
                                    </div>
                                    <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-xl">
                                        <Navigation size={16} className="text-orange-600 mt-0.5" />
                                        <div><span className="block text-orange-600 font-bold">DROP</span> {task.drop} <br /> Est. Time: {task.time}</div>
                                    </div>
                                </div>
                                <div className="bg-[#07241A] h-32 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4 mb-4">
                                    <svg className="w-full h-full" viewBox="0 0 280 80">
                                        <path d="M 20 60 Q 100 10, 180 50 T 260 20" fill="none" stroke="#EA580C" strokeWidth="3" className="animate-route-dash" />
                                        <circle cx="20" cy="60" r="5" fill="#10B981" /><circle cx="260" cy="20" r="7" fill="#EA580C" />
                                    </svg>
                                    <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#F97316] bg-[#0F172A] px-2 py-1 rounded">Est. Distance: {task.distance}</div>
                                </div>
                                <button onClick={() => showToast('✅ Route accepted! Navigating to stop ' + (idx + 1))} className="w-full py-3 bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                                    <Navigation size={16} /> Start Navigation
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- 3. VEHICLE & PROFILE MANAGEMENT --- */}
                {activeView === 'vehicle' && (
                    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white flex items-center justify-center font-bold text-2xl shadow">{name[0] || 'L'}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                                <p className="text-xs text-[#EA580C] font-mono font-bold flex items-center gap-1"><CheckCircle2 size={14} /> {profile.account_category ? profile.account_category.replace('_', ' ') : 'Verified Partner'}</p>
                            </div>
                        </div>

                        {/* License Photo Section */}
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><FileText size={16} className="text-[#EA580C]" /> Driving License</h3>
                            {profile.license_doc_url ? (
                                <img src={profile.license_doc_url} alt="License" className="rounded-xl w-full h-48 object-cover border border-gray-200" />
                            ) : <p className="text-xs text-gray-500">No license uploaded.</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Operating Region</span><span className="text-gray-900 font-bold">{profile.operating_region || 'N/A'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Service Radius</span><span className="text-gray-900 font-bold">{profile.service_radius || 'N/A'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Availability</span><span className="text-gray-900 font-bold">{profile.availability_schedule || 'N/A'}</span></div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><span className="text-gray-500 block mb-1">Rate per km</span><span className="text-gray-900 font-bold">₹{profile.rate_per_km || 'N/A'}</span></div>
                        </div>

                        <button onClick={() => setShowVehicleModal(true)} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                            <Truck size={16} /> View All Registered Vehicles ({vehicles.length})
                        </button>
                    </div>
                )}

                {/* --- 4. PERFORMANCE --- */}
                {activeView === 'performance' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm"><h2 className="text-2xl font-bold text-gray-900 font-serif">Performance & Ratings</h2><p className="text-xs text-gray-500">Based on feedback from farmers and buyers</p></div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm text-center">
                                <Star size={32} className="mx-auto text-amber-500 fill-amber-500 mb-2" />
                                <h3 className="text-3xl font-bold text-gray-900">5.0 / 5.0</h3>
                                <p className="text-xs text-gray-500 mt-1">Average Rating</p>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm text-center">
                                <Package size={32} className="mx-auto text-[#EA580C] mb-2" />
                                <h3 className="text-3xl font-bold text-gray-900">{profile.trips_completed || 42}</h3>
                                <p className="text-xs text-gray-500 mt-1">Total Trips Completed</p>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm text-center">
                                <AlertCircle size={32} className="mx-auto text-emerald-600 mb-2" />
                                <h3 className="text-3xl font-bold text-gray-900">0</h3>
                                <p className="text-xs text-gray-500 mt-1">Complaints / Damages</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 5. NOTIFICATIONS --- */}
                {activeView === 'notifications' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm"><h2 className="text-2xl font-bold text-gray-900 font-serif">Alerts & Notifications</h2></div>
                        <div className="space-y-4">
                            <div className="bg-white border border-red-200 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertCircle size={20} /></div>
                                <div><h4 className="font-bold text-red-700">Urgent Perishable Pickup</h4><p className="text-xs text-gray-500 mt-1">500kg Tomatoes from Ramesh Patel need immediate dispatch before 11:30 AM.</p></div>
                            </div>
                            <div className="bg-white border border-blue-200 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Bell size={20} /></div>
                                <div><h4 className="font-bold text-blue-700">New Task Assigned</h4><p className="text-xs text-gray-500 mt-1">Route #AG-1234 assigned. Please check the "Assigned Tasks" tab.</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* VEHICLE DETAILS MODAL */}
            {showVehicleModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center sticky top-0 bg-white pb-3 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Truck size={20} className="text-[#EA580C]" /> Registered Vehicles ({vehicles.length})</h3>
                            <button onClick={() => setShowVehicleModal(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                            {vehicles.map((v, index) => (
                                <div key={index} className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <h4 className="font-bold text-lg text-gray-900 mb-3">{v.vehicle_type ? v.vehicle_type.replace('-', ' ').toUpperCase() : 'VEHICLE'} - {v.vehicle_reg_number}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Camera size={12} /> Front Photo</p>
                                            {v.front_photo_url ? <img src={v.front_photo_url} alt="Front" className="rounded-xl w-full h-32 object-cover border border-gray-200" /> : <div className="w-full h-32 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">No photo</div>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Camera size={12} /> Back Photo</p>
                                            {v.back_photo_url ? <img src={v.back_photo_url} alt="Back" className="rounded-xl w-full h-32 object-cover border border-gray-200" /> : <div className="w-full h-32 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">No photo</div>}
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs font-mono">
                                        <span className="text-gray-500">Capacity: </span><span className="font-bold text-gray-900">{v.load_capacity || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}