import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Eye, EyeOff, CheckCircle2, Sprout, ArrowRight, Lock, Phone, Building2, User, MapPin, FileText, ClipboardList, Plus, X } from 'lucide-react';
import axios from 'axios';
import Particle3DCanvas from '../components/Particle3DCanvas';

export default function LogisticsRegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', mobile: '', password: '', account_category: 'individual_driver',
        company_name: '', id_type: 'Aadhaar', id_number: '', driving_license: '',
        operating_region: '', availability_schedule: '', service_radius: '', rate_per_km: ''
    });

    const [licensePhoto, setLicensePhoto] = useState(null);
    const [vehicles, setVehicles] = useState([
        { vehicle_type: 'mini-truck', load_capacity: '', vehicle_reg_number: '', front_photo: null, back_photo: null }
    ]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleVehicleChange = (index, field, value) => {
        const updatedVehicles = [...vehicles];
        updatedVehicles[index][field] = value;
        setVehicles(updatedVehicles);
    };

    const addVehicle = () => {
        setVehicles([...vehicles, { vehicle_type: 'mini-truck', load_capacity: '', vehicle_reg_number: '', front_photo: null, back_photo: null }]);
    };

    const removeVehicle = (index) => {
        if (vehicles.length > 1) setVehicles(vehicles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMessage(''); setIsLoading(true);
        try {
            const formDataObj = new FormData();
            Object.keys(formData).forEach(key => formDataObj.append(key, formData[key]));

            if (licensePhoto) formDataObj.append('license_photo', licensePhoto);

            const vehiclesTextData = vehicles.map(v => ({
                vehicle_type: v.vehicle_type,
                load_capacity: v.load_capacity,
                vehicle_reg_number: v.vehicle_reg_number
            }));
            formDataObj.append('vehicles_data', JSON.stringify(vehiclesTextData));

            vehicles.forEach(v => {
                if (v.front_photo) formDataObj.append('front_photos', v.front_photo);
                if (v.back_photo) formDataObj.append('back_photos', v.back_photo);
            });

            const res = await axios.post('http://127.0.0.1:8000/api/register/logistics', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.token) localStorage.setItem('token', res.data.token);
            if (res.data.user_id) localStorage.setItem('userId', res.data.user_id);
            localStorage.setItem('role', 'logistics');
            localStorage.setItem('userName', res.data.name);

            setSuccessMessage('Registration successful! Redirecting to Fleet Dashboard...');
            setTimeout(() => navigate('/logistics'), 1500);
        } catch (err) {
            // --- BULLETPROOF ERROR EXTRACTION ---
            const errDetail = err.response?.data?.detail;
            let errMsg = 'Registration failed. Please check all fields.';

            if (Array.isArray(errDetail)) {
                // FastAPI 422 errors return an array of objects. We map them to strings.
                errMsg = errDetail.map(e => `Field '${e.loc.slice(-1)[0]}': ${e.msg}`).join(', ');
            } else if (typeof errDetail === 'string') {
                errMsg = errDetail;
            } else if (err.message) {
                errMsg = err.message;
            }
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 py-12 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-x-hidden">
            <Particle3DCanvas className="opacity-25" />
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[140px] opacity-15 pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl">
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 text-white flex items-center justify-between border-b border-orange-500/30">
                        <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <Sprout size={22} className="text-[#F97316]" />
                            <span className="font-extrabold font-serif text-xl">Agri<span className="text-[#F97316]">Connect</span></span>
                        </Link>
                        <span className="text-xs font-mono text-[#F97316] bg-orange-500/20 px-2.5 py-0.5 rounded border border-orange-500/30">Fleet Partner Registration</span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <h1 className="text-2xl font-bold font-serif text-center">Join the Logistics Network</h1>

                        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">{error}</div>}
                        {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">{successMessage}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Account Type</label>
                                    <select name="account_category" value={formData.account_category} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                                        <option value="individual_driver">Individual Driver</option>
                                        <option value="transport_company">Transport Company</option>
                                        <option value="vehicle_owner">Vehicle Owner</option>
                                    </select>
                                </div>
                                {formData.account_category !== 'individual_driver' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Company Name</label>
                                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="e.g. AgroTrans Pvt Ltd" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Suresh Kumar" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Mobile (10 Digits) *</label>
                                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} maxLength="10" placeholder="9876543210" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">ID Number</label>
                                    <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} placeholder="1234-5678-9012" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Password *</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Min 4 chars" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs pr-10" required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <label className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-2"><FileText size={16} className="text-[#EA580C]" /> Upload Driving License Photo</label>
                                <input type="file" accept="image/*" onChange={(e) => setLicensePhoto(e.target.files[0])} className="text-xs text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#059669] file:text-white hover:file:bg-[#047857] cursor-pointer w-full" />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Truck size={16} className="text-[#EA580C]" /> Vehicle Details</h3>
                                    <button type="button" onClick={addVehicle} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-100"><Plus size={14} /> Add Vehicle</button>
                                </div>

                                <div className="space-y-4">
                                    {vehicles.map((v, index) => (
                                        <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 relative">
                                            {vehicles.length > 1 && (
                                                <button type="button" onClick={() => removeVehicle(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X size={16} /></button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Vehicle Type</label>
                                                    <select value={v.vehicle_type} onChange={(e) => handleVehicleChange(index, 'vehicle_type', e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs">
                                                        <option value="mini-truck">Mini-Truck</option>
                                                        <option value="tempo">Tempo</option>
                                                        <option value="refrigerated-van">Refrigerated Van</option>
                                                        <option value="bike">Bike</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Capacity</label>
                                                    <input type="text" value={v.load_capacity} onChange={(e) => handleVehicleChange(index, 'load_capacity', e.target.value)} placeholder="e.g. 500 kg" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" required />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Reg. Number</label>
                                                    <input type="text" value={v.vehicle_reg_number} onChange={(e) => handleVehicleChange(index, 'vehicle_reg_number', e.target.value)} placeholder="MH12 AB 1234" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" required />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Front Photo</label>
                                                    <input type="file" accept="image/*" onChange={(e) => handleVehicleChange(index, 'front_photo', e.target.files[0])} className="text-xs w-full" />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Back Photo</label>
                                                    <input type="file" accept="image/*" onChange={(e) => handleVehicleChange(index, 'back_photo', e.target.files[0])} className="text-xs w-full" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={16} className="text-[#EA580C]" /> Operational Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Operating Region</label>
                                        <input type="text" name="operating_region" value={formData.operating_region} onChange={handleChange} placeholder="e.g. Pune" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Service Radius</label>
                                        <input type="text" name="service_radius" value={formData.service_radius} onChange={handleChange} placeholder="e.g. 50 km" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Schedule</label>
                                        <input type="text" name="availability_schedule" value={formData.availability_schedule} onChange={handleChange} placeholder="e.g. Mon-Sat, 8 AM-8 PM" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Rate per km (₹)</label>
                                        <input type="number" name="rate_per_km" value={formData.rate_per_km} onChange={handleChange} placeholder="e.g. 15" step="0.1" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" required />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2">
                                {isLoading ? 'Registering Fleet Partner...' : 'Complete Registration'} <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}