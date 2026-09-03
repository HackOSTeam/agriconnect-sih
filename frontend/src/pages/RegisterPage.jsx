import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User, ShoppingBag, Eye, EyeOff, CheckCircle2, Sprout,
    ArrowRight, Lock, Phone, MapPin, Building2,
    ShieldCheck, Sparkles, AlertCircle, Navigation,
    Plus, X, CreditCard, Landmark, Check
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import Particle3DCanvas from '../components/Particle3DCanvas';

const INDIAN_STATES = [
    'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Gujarat', 'Madhya Pradesh',
    'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Rajasthan', 'Haryana',
    'Bihar', 'West Bengal', 'Telangana', 'Kerala', 'Odisha', 'Assam'
];

const SUGGESTED_CROPS = [
    'Tomato', 'Onion', 'Potato', 'Capsicum', 'Wheat', 'Rice',
    'Chilli', 'Cotton', 'Soybean', 'Mango', 'Orange', 'Banana',
    'Ginger', 'Turmeric', 'Pulses', 'Maize', 'Sugarcane', 'Pomegranate'
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState('farmer'); // 'farmer' or 'buyer'
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password visibility states
    const [showFarmerPassword, setShowFarmerPassword] = useState(false);
    const [showFarmerConfirmPassword, setShowFarmerConfirmPassword] = useState(false);
    const [showBuyerPassword, setShowBuyerPassword] = useState(false);
    const [showBuyerConfirmPassword, setShowBuyerConfirmPassword] = useState(false);

    // OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    // GPS Auto-detect state
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    // Dynamic Crop Input State
    const [customCropInput, setCustomCropInput] = useState('');

    // Farmer Form Data
    const [farmerData, setFarmerData] = useState({
        name: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        accountType: 'individual', // 'individual' or 'fpo'
        fpoName: '',
        fpoRegId: '',
        villageDistrict: '',
        state: 'Maharashtra',
        idType: 'Aadhaar', // 'Aadhaar' or 'FPO Document'
        idNumber: '',
        primaryCrops: ['Tomato', 'Onion'],
        // Detailed Bank Info
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        branchName: '',
        accountTypeBank: 'Savings',
        upiId: '',
        termsAgreed: true
    });

    // Buyer Form Data
    const [buyerData, setBuyerData] = useState({
        buyerType: 'bulk', // 'consumer' or 'bulk'
        name: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: '',
        deliveryAddress: '',
        preferredCrops: '',
        // Bulk specific
        businessName: '',
        gstin: '',
        contactPerson: '',
        businessType: 'Retailer',
        businessAddress: '',
        sameAsBusinessAddress: true,
        monthlyVolume: '10-25 Tonnes',
        // Optional Bank details
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        accountTypeBank: 'Current',
        upiId: '',
        termsAgreed: true
    });

    // Handle 10-digit phone number formatting
    const handlePhoneInput = (val, callback) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 10);
        callback(cleaned);
    };

    // OTP Trigger
    const handleSendOtp = async (mobileNum) => {
        if (!mobileNum || mobileNum.length !== 10) {
            setError('Please enter a valid 10-digit mobile number before requesting OTP.');
            return;
        }
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/send-otp`, {
                mobile: mobileNum,
                role: role
            });
            setOtpSent(true);
            setOtpTimer(30);
            setSuccessMessage(`OTP sent successfully to +91 ${mobileNum}. (Code: ${res.data.otp || '4920'})`);
            
            const interval = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
        }
    };

    const handleVerifyOtp = async (mobileNum) => {
        if (!otpCode || otpCode.length < 4) {
            setError('Please enter the 4-digit verification code.');
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/verify-otp`, {
                mobile: mobileNum,
                otp: otpCode
            });
            setIsOtpVerified(true);
            setError('');
            setSuccessMessage('Mobile number verified successfully!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid OTP code.');
        }
    };

    // GPS Auto-detect handler
    const handleDetectLocation = () => {
        setIsDetectingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setIsDetectingLocation(false);
                    const loc = `GPS Lat: ${pos.coords.latitude.toFixed(3)}, Long: ${pos.coords.longitude.toFixed(3)} (Haveli, Pune)`;
                    setFarmerData(prev => ({ ...prev, villageDistrict: loc }));
                    setSuccessMessage('Location auto-detected via GPS!');
                },
                () => {
                    setIsDetectingLocation(false);
                    setFarmerData(prev => ({ ...prev, villageDistrict: 'Haveli, Pune District' }));
                    setSuccessMessage('Auto-detected regional location: Haveli, Pune District');
                },
                { timeout: 5000 }
            );
        } else {
            setIsDetectingLocation(false);
            setFarmerData(prev => ({ ...prev, villageDistrict: 'Haveli, Pune District' }));
        }
    };

    // Dynamic Crop management
    const handleAddCustomCrop = () => {
        const trimmed = customCropInput.trim();
        if (!trimmed) return;
        if (!farmerData.primaryCrops.includes(trimmed)) {
            setFarmerData(prev => ({ ...prev, primaryCrops: [...prev.primaryCrops, trimmed] }));
        }
        setCustomCropInput('');
    };

    const handleRemoveCrop = (cropToRemove) => {
        setFarmerData(prev => ({
            ...prev,
            primaryCrops: prev.primaryCrops.filter(c => c !== cropToRemove)
        }));
    };

    const handleAddSuggestedCrop = (crop) => {
        if (!farmerData.primaryCrops.includes(crop)) {
            setFarmerData(prev => ({ ...prev, primaryCrops: [...prev.primaryCrops, crop] }));
        }
    };

    // Submit Registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (role === 'farmer') {
                if (farmerData.mobile.length !== 10) {
                    throw new Error('Phone number must be exactly 10 numeric digits.');
                }
                if (!farmerData.name.trim()) {
                    throw new Error('Please enter your full name.');
                }
                if (!farmerData.password || farmerData.password.length < 4) {
                    throw new Error('Password must be at least 4 characters long.');
                }
                if (farmerData.password !== farmerData.confirmPassword) {
                    throw new Error('Password and Confirm Password do not match.');
                }
                if (farmerData.accountNumber && farmerData.confirmAccountNumber && farmerData.accountNumber !== farmerData.confirmAccountNumber) {
                    throw new Error('Bank Account Number and Confirm Account Number do not match.');
                }
                if (!farmerData.idNumber.trim()) {
                    throw new Error('Please provide an ID number for verification.');
                }
                if (!farmerData.termsAgreed) {
                    throw new Error('Please agree to terms & conditions.');
                }

                const payload = {
                    name: farmerData.name.trim(),
                    mobile: farmerData.mobile.trim(),
                    password: farmerData.password,
                    account_type: farmerData.accountType,
                    fpo_name: farmerData.accountType === 'fpo' ? farmerData.fpoName : null,
                    fpo_reg_id: farmerData.accountType === 'fpo' ? farmerData.fpoRegId : null,
                    village_district: farmerData.villageDistrict || 'Haveli, Pune District',
                    state: farmerData.state,
                    id_type: farmerData.idType,
                    id_number: farmerData.idNumber,
                    primary_crops: farmerData.primaryCrops,
                    upi_id: farmerData.upiId || null,
                    account_holder_name: farmerData.accountHolderName || farmerData.name,
                    account_number: farmerData.accountNumber || null,
                    ifsc_code: farmerData.ifscCode ? farmerData.ifscCode.toUpperCase() : null,
                    bank_name: farmerData.bankName || null,
                    branch_name: farmerData.branchName || null,
                    account_type_bank: farmerData.accountTypeBank || 'Savings'
                };

                const res = await axios.post(`${API_BASE_URL}/api/register/farmer`, payload);
                if (res.data.token) localStorage.setItem('token', res.data.token);
                if (res.data.user_id) localStorage.setItem('userId', res.data.user_id);
                localStorage.setItem('role', 'farmer');
                localStorage.setItem('userName', res.data.name);
                localStorage.setItem('farmerId', res.data.user_id || res.data.profile?.id || '');
                localStorage.setItem('farmerProfile', JSON.stringify(res.data.profile));

                setSuccessMessage('Registration successful! Redirecting to Kisan Dashboard...');
                setTimeout(() => navigate('/farmer'), 1200);
            } else {
                // Buyer validation
                const isBulk = buyerData.buyerType === 'bulk';
                const buyerName = isBulk ? buyerData.businessName : buyerData.name;

                if (!buyerName.trim()) {
                    throw new Error(isBulk ? 'Please enter your business name.' : 'Please enter your full name.');
                }
                if (buyerData.mobile.length !== 10) {
                    throw new Error('Phone number must be exactly 10 digits.');
                }
                if (buyerData.password.length < 4) {
                    throw new Error('Password must be at least 4 characters.');
                }
                if (buyerData.password !== buyerData.confirmPassword) {
                    throw new Error('Password and Confirm Password do not match.');
                }
                if (isBulk && !buyerData.gstin.trim()) {
                    throw new Error('Please enter a valid GSTIN number for bulk procurement.');
                }
                if (!buyerData.termsAgreed) {
                    throw new Error('Please agree to terms & conditions.');
                }

                const payload = {
                    buyer_type: buyerData.buyerType,
                    name: buyerName.trim(),
                    mobile: buyerData.mobile.trim(),
                    email: buyerData.email || null,
                    password: buyerData.password,
                    delivery_address: isBulk 
                        ? (buyerData.sameAsBusinessAddress ? buyerData.businessAddress : buyerData.deliveryAddress)
                        : buyerData.deliveryAddress,
                    preferred_crops: buyerData.preferredCrops,
                    gstin: isBulk ? buyerData.gstin.toUpperCase() : null,
                    contact_person: isBulk ? buyerData.contactPerson : null,
                    business_type: isBulk ? buyerData.businessType : 'Consumer',
                    business_address: isBulk ? buyerData.businessAddress : null,
                    monthly_volume: isBulk ? buyerData.monthlyVolume : '1-2 Tonnes',
                    upi_id: buyerData.upiId || null,
                    account_holder_name: buyerData.accountHolderName || buyerName,
                    account_number: buyerData.accountNumber || null,
                    ifsc_code: buyerData.ifscCode ? buyerData.ifscCode.toUpperCase() : null,
                    bank_name: buyerData.bankName || null,
                    branch_name: buyerData.branchName || null,
                    account_type_bank: buyerData.accountTypeBank || 'Current'
                };

                const res = await axios.post(`${API_BASE_URL}/api/register/buyer`, payload);
                if (res.data.token) localStorage.setItem('token', res.data.token);
                if (res.data.user_id) localStorage.setItem('userId', res.data.user_id);
                localStorage.setItem('role', 'buyer');
                localStorage.setItem('userName', res.data.name);
                localStorage.setItem('buyerId', res.data.user_id || res.data.profile?.id || '');
                localStorage.setItem('buyerProfile', JSON.stringify(res.data.profile));

                setSuccessMessage('Buyer registration successful! Redirecting to Marketplace...');
                setTimeout(() => navigate('/buyer'), 1200);
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Registration failed. Please check form details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 py-12 bg-[#F4F8F4] text-[#0F172A] font-sans overflow-x-hidden">
            <Particle3DCanvas className="opacity-25" />

            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#10B981] rounded-full filter blur-[140px] opacity-15 pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#EA580C] rounded-full filter blur-[140px] opacity-10 pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl">
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Top Brand Banner */}
                    <div className="bg-gradient-to-r from-[#062319] via-[#0A3324] to-[#041A13] p-6 text-white flex items-center justify-between border-b border-[#10B981]/25">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl flex items-center justify-center text-[#022C22] shadow group-hover:scale-105 transition-transform">
                                <Sprout size={22} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <span className="font-extrabold font-serif text-white text-xl tracking-tight">Agri<span className="text-[#34D399]">Connect</span></span>
                                <span className="block text-[10px] text-gray-300 font-mono">Direct Farm Trade Registration</span>
                            </div>
                        </Link>
                        <span className="text-xs bg-[#10B981]/20 text-[#34D399] px-3 py-1 rounded-full font-mono border border-[#10B981]/30">
                            Zero Commission
                        </span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Header Title */}
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">Create New Account</h1>
                            <p className="text-xs text-gray-500">Sign up to start direct farm-to-buyer transactions</p>
                        </div>

                        {/* Error & Success Banners */}
                        {error && (
                            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-mono">
                                <AlertCircle size={16} className="text-red-500 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-mono">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* Role Selector Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl">
                            <button
                                type="button"
                                onClick={() => { setRole('farmer'); setError(''); }}
                                className={`py-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                                    role === 'farmer'
                                        ? 'bg-[#059669] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <User size={18} /> Farmer / FPO
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRole('buyer'); setError(''); }}
                                className={`py-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                                    role === 'buyer'
                                        ? 'bg-[#EA580C] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <ShoppingBag size={18} /> Buyer / Business
                            </button>
                        </div>

                        {/* ======================================================== */}
                        {/* 1. FARMER / FPO REGISTRATION FORM */}
                        {/* ======================================================== */}
                        {role === 'farmer' && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* 1.1 Account Type: Individual vs FPO */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Account Type:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFarmerData({ ...farmerData, accountType: 'individual' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                farmerData.accountType === 'individual'
                                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <User size={16} /> Individual Farmer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFarmerData({ ...farmerData, accountType: 'fpo' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                farmerData.accountType === 'fpo'
                                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Building2 size={16} /> FPO / Cooperative
                                        </button>
                                    </div>
                                </div>

                                {/* 1.2 FPO Conditional Fields */}
                                {farmerData.accountType === 'fpo' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Organization Name *</label>
                                            <input
                                                type="text"
                                                value={farmerData.fpoName}
                                                onChange={(e) => setFarmerData({ ...farmerData, fpoName: e.target.value })}
                                                placeholder="e.g. Nashik Agro Producer Co."
                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">FPO Registration ID *</label>
                                            <input
                                                type="text"
                                                value={farmerData.fpoRegId}
                                                onChange={(e) => setFarmerData({ ...farmerData, fpoRegId: e.target.value })}
                                                placeholder="e.g. FPO-MH-2024-8821"
                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 1.3 Full Name & Mobile */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Full Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type="text"
                                                value={farmerData.name}
                                                onChange={(e) => setFarmerData({ ...farmerData, name: e.target.value })}
                                                placeholder="e.g. Ramesh Patel"
                                                className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Mobile Number (10 Digits) *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type="tel"
                                                value={farmerData.mobile}
                                                onChange={(e) => handlePhoneInput(e.target.value, (val) => setFarmerData({ ...farmerData, mobile: val }))}
                                                placeholder="10-digit number"
                                                maxLength={10}
                                                className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 1.4 Password & Confirm Password */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Create Password *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type={showFarmerPassword ? "text" : "password"}
                                                value={farmerData.password}
                                                onChange={(e) => setFarmerData({ ...farmerData, password: e.target.value })}
                                                placeholder="Enter password (min 4 chars)"
                                                className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowFarmerPassword(!showFarmerPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                                            >
                                                {showFarmerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Confirm Password *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type={showFarmerConfirmPassword ? "text" : "password"}
                                                value={farmerData.confirmPassword}
                                                onChange={(e) => setFarmerData({ ...farmerData, confirmPassword: e.target.value })}
                                                placeholder="Repeat password"
                                                className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowFarmerConfirmPassword(!showFarmerConfirmPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                                            >
                                                {showFarmerConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 1.5 OTP Verification Box */}
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                            <ShieldCheck size={16} className="text-emerald-700" /> Mobile OTP Verification:
                                        </span>
                                        {isOtpVerified ? (
                                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle2 size={13} /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSendOtp(farmerData.mobile)}
                                                disabled={otpTimer > 0}
                                                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
                                            >
                                                {otpTimer > 0 ? `Resend OTP (${otpTimer}s)` : (otpSent ? 'Resend OTP' : 'Send OTP')}
                                            </button>
                                        )}
                                    </div>

                                    {!isOtpVerified && otpSent && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                placeholder="Enter 4-Digit OTP"
                                                maxLength={4}
                                                className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-center tracking-widest text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyOtp(farmerData.mobile)}
                                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                                            >
                                                Verify Code
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 1.6 Location & State */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-gray-700">Village / District *</label>
                                            <button
                                                type="button"
                                                onClick={handleDetectLocation}
                                                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                            >
                                                <Navigation size={12} /> {isDetectingLocation ? 'Detecting...' : 'GPS Auto-Detect'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <MapPin className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type="text"
                                                value={farmerData.villageDistrict}
                                                onChange={(e) => setFarmerData({ ...farmerData, villageDistrict: e.target.value })}
                                                placeholder="e.g. Haveli, Pune District"
                                                className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">State *</label>
                                        <select
                                            value={farmerData.state}
                                            onChange={(e) => setFarmerData({ ...farmerData, state: e.target.value })}
                                            className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                                        >
                                            {INDIAN_STATES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* 1.7 ID Verification */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700">ID Verification Document *</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <select
                                            value={farmerData.idType}
                                            onChange={(e) => setFarmerData({ ...farmerData, idType: e.target.value })}
                                            className="p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                        >
                                            <option value="Aadhaar">Aadhaar Card</option>
                                            <option value="FPO Document">FPO Certificate</option>
                                            <option value="Kisan Card">Kisan Credit Card</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={farmerData.idNumber}
                                            onChange={(e) => setFarmerData({ ...farmerData, idNumber: e.target.value })}
                                            placeholder={farmerData.idType === 'Aadhaar' ? "12-digit Aadhaar Number" : "Certificate / ID Number"}
                                            className="sm:col-span-2 p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* 1.8 Dynamic Primary Crops Selector */}
                                <div className="space-y-2.5 p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                                    <label className="text-xs font-bold text-gray-900 block">
                                        Primary Crops Grown (Add or Remove Dynamically):
                                    </label>
                                    
                                    {/* Active Selected Crop Badges */}
                                    <div className="flex flex-wrap gap-2 min-h-[36px]">
                                        {farmerData.primaryCrops.map(crop => (
                                            <span
                                                key={crop}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold shadow-sm"
                                            >
                                                {crop}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCrop(crop)}
                                                    className="w-4 h-4 rounded-full bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center text-white"
                                                    title={`Remove ${crop}`}
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        {farmerData.primaryCrops.length === 0 && (
                                            <span className="text-xs text-gray-400 italic">No crops added yet. Type below or choose suggestions.</span>
                                        )}
                                    </div>

                                    {/* Custom Crop Input Box */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customCropInput}
                                            onChange={(e) => setCustomCropInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCrop(); } }}
                                            placeholder="Type custom crop (e.g. Drumsticks, Cardamom, Dragonfruit) & press Add"
                                            className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomCrop}
                                            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition"
                                        >
                                            <Plus size={14} /> Add Crop
                                        </button>
                                    </div>

                                    {/* Quick Suggestions Chips */}
                                    <div className="pt-1">
                                        <span className="text-[11px] font-bold text-gray-500 block mb-1.5">Quick Suggestions:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {SUGGESTED_CROPS.map(sc => {
                                                const alreadyAdded = farmerData.primaryCrops.includes(sc);
                                                return (
                                                    <button
                                                        key={sc}
                                                        type="button"
                                                        onClick={() => handleAddSuggestedCrop(sc)}
                                                        disabled={alreadyAdded}
                                                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                                                            alreadyAdded
                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 opacity-60'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                                                        }`}
                                                    >
                                                        {alreadyAdded ? `✓ ${sc}` : `+ ${sc}`}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 1.9 Detailed Bank Account & Settlement Details */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                        <Landmark size={16} className="text-emerald-700" /> Bank & Payout Details (Direct Escrow Settlement):
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Holder Name</label>
                                            <input
                                                type="text"
                                                value={farmerData.accountHolderName}
                                                onChange={(e) => setFarmerData({ ...farmerData, accountHolderName: e.target.value })}
                                                placeholder={farmerData.name || "Name as per Bank Passbook"}
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={farmerData.bankName}
                                                onChange={(e) => setFarmerData({ ...farmerData, bankName: e.target.value })}
                                                placeholder="e.g. State Bank of India, HDFC Bank"
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Bank Account Number</label>
                                            <input
                                                type="text"
                                                value={farmerData.accountNumber}
                                                onChange={(e) => setFarmerData({ ...farmerData, accountNumber: e.target.value })}
                                                placeholder="e.g. 100299881122"
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Confirm Account Number</label>
                                            <input
                                                type="text"
                                                value={farmerData.confirmAccountNumber}
                                                onChange={(e) => setFarmerData({ ...farmerData, confirmAccountNumber: e.target.value })}
                                                placeholder="Repeat Account Number"
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={farmerData.ifscCode}
                                                onChange={(e) => setFarmerData({ ...farmerData, ifscCode: e.target.value.toUpperCase() })}
                                                placeholder="e.g. SBIN0001234"
                                                maxLength={11}
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Branch Name</label>
                                            <input
                                                type="text"
                                                value={farmerData.branchName}
                                                onChange={(e) => setFarmerData({ ...farmerData, branchName: e.target.value })}
                                                placeholder="e.g. Haveli Branch"
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Type</label>
                                            <select
                                                value={farmerData.accountTypeBank}
                                                onChange={(e) => setFarmerData({ ...farmerData, accountTypeBank: e.target.value })}
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-emerald-600"
                                            >
                                                <option value="Savings">Savings Account</option>
                                                <option value="Current">Current Account</option>
                                                <option value="Kisan Credit">Kisan Credit Account</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-gray-600 block mb-1">UPI ID / VPA (Optional for Instant Payouts)</label>
                                        <input
                                            type="text"
                                            value={farmerData.upiId}
                                            onChange={(e) => setFarmerData({ ...farmerData, upiId: e.target.value })}
                                            placeholder="e.g. ramesh@okaxis or 9876543210@paytm"
                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                </div>

                                {/* Terms & Submit */}
                                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={farmerData.termsAgreed}
                                        onChange={(e) => setFarmerData({ ...farmerData, termsAgreed: e.target.checked })}
                                        className="rounded accent-emerald-600 h-4 w-4"
                                        required
                                    />
                                    <span>I agree to Direct Agricultural Trade Terms & Escrow Settlement Policy</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Creating Farmer Account...' : 'Complete Farmer Registration'} <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {/* ======================================================== */}
                        {/* 2. BUYER REGISTRATION FORM */}
                        {/* ======================================================== */}
                        {role === 'buyer' && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Buyer Sub-Type: Consumer vs Bulk */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Buyer Category:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBuyerData({ ...buyerData, buyerType: 'consumer' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                buyerData.buyerType === 'consumer'
                                                    ? 'border-orange-500 bg-orange-50 text-orange-800'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <User size={16} /> Retail / Consumer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBuyerData({ ...buyerData, buyerType: 'bulk' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                buyerData.buyerType === 'bulk'
                                                    ? 'border-orange-500 bg-orange-50 text-orange-800'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Building2 size={16} /> Bulk Wholesaler / Chain
                                        </button>
                                    </div>
                                </div>

                                {buyerData.buyerType === 'consumer' ? (
                                    /* CONSUMER BUYER FIELDS */
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">Full Name *</label>
                                            <input
                                                type="text"
                                                value={buyerData.name}
                                                onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
                                                placeholder="e.g. Priya Sharma"
                                                className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Mobile (10 Digits) *</label>
                                                <input
                                                    type="tel"
                                                    value={buyerData.mobile}
                                                    onChange={(e) => handlePhoneInput(e.target.value, (val) => setBuyerData({ ...buyerData, mobile: val }))}
                                                    placeholder="e.g. 9822001122"
                                                    maxLength={10}
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={buyerData.email}
                                                    onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                                                    placeholder="e.g. priya@example.com"
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">Delivery Address *</label>
                                            <input
                                                type="text"
                                                value={buyerData.deliveryAddress}
                                                onChange={(e) => setBuyerData({ ...buyerData, deliveryAddress: e.target.value })}
                                                placeholder="Street, Landmark, City & Pincode"
                                                className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">Preferred Crop Categories (Optional)</label>
                                            <input
                                                type="text"
                                                value={buyerData.preferredCrops}
                                                onChange={(e) => setBuyerData({ ...buyerData, preferredCrops: e.target.value })}
                                                placeholder="e.g. Fresh Tomatoes, Organic Vegetables, Exotic Fruits"
                                                className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* BULK BUYER FIELDS */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Business / Entity Name *</label>
                                                <input
                                                    type="text"
                                                    value={buyerData.businessName}
                                                    onChange={(e) => setBuyerData({ ...buyerData, businessName: e.target.value })}
                                                    placeholder="e.g. AgroFresh Wholesalers Ltd"
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">GSTIN Number (15 Alphanumeric) *</label>
                                                <input
                                                    type="text"
                                                    value={buyerData.gstin}
                                                    onChange={(e) => setBuyerData({ ...buyerData, gstin: e.target.value.toUpperCase().slice(0, 15) })}
                                                    placeholder="e.g. 27AAAAA0000A1Z5"
                                                    maxLength={15}
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-mono text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Contact Person *</label>
                                                <input
                                                    type="text"
                                                    value={buyerData.contactPerson}
                                                    onChange={(e) => setBuyerData({ ...buyerData, contactPerson: e.target.value })}
                                                    placeholder="e.g. Deepak Verma"
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Mobile (10 Digits) *</label>
                                                <input
                                                    type="tel"
                                                    value={buyerData.mobile}
                                                    onChange={(e) => handlePhoneInput(e.target.value, (val) => setBuyerData({ ...buyerData, mobile: val }))}
                                                    placeholder="e.g. 9822001122"
                                                    maxLength={10}
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Business Email *</label>
                                                <input
                                                    type="email"
                                                    value={buyerData.email}
                                                    onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                                                    placeholder="procure@company.com"
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Business Type *</label>
                                                <select
                                                    value={buyerData.businessType}
                                                    onChange={(e) => setBuyerData({ ...buyerData, businessType: e.target.value })}
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                >
                                                    <option value="Grocery Chain">Grocery Chain</option>
                                                    <option value="Retailer">Retailer</option>
                                                    <option value="Restaurant">Restaurant / Hotel</option>
                                                    <option value="Hostel">Hostel / Institution</option>
                                                    <option value="Food Processor">Food Processor</option>
                                                    <option value="Wholesale Mandi Dealer">Wholesale Mandi Dealer</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">Estimated Monthly Volume *</label>
                                                <select
                                                    value={buyerData.monthlyVolume}
                                                    onChange={(e) => setBuyerData({ ...buyerData, monthlyVolume: e.target.value })}
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                >
                                                    <option value="1-5 Tonnes">1 - 5 Tonnes / month</option>
                                                    <option value="5-15 Tonnes">5 - 15 Tonnes / month</option>
                                                    <option value="15-50 Tonnes">15 - 50 Tonnes / month</option>
                                                    <option value="50+ Tonnes">50+ Tonnes / month (Enterprise)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">Registered Business Address *</label>
                                            <input
                                                type="text"
                                                value={buyerData.businessAddress}
                                                onChange={(e) => setBuyerData({ ...buyerData, businessAddress: e.target.value })}
                                                placeholder="e.g. Market Yard, Gultekdi, Pune 411037"
                                                className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={buyerData.sameAsBusinessAddress}
                                                    onChange={(e) => setBuyerData({ ...buyerData, sameAsBusinessAddress: e.target.checked })}
                                                    className="rounded accent-orange-600"
                                                />
                                                <span>Delivery depot address is same as business address</span>
                                            </label>

                                            {!buyerData.sameAsBusinessAddress && (
                                                <input
                                                    type="text"
                                                    value={buyerData.deliveryAddress}
                                                    onChange={(e) => setBuyerData({ ...buyerData, deliveryAddress: e.target.value })}
                                                    placeholder="Separate Warehouse / Delivery Depot Address"
                                                    className="w-full p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-500"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Password & Confirm Password with Show/Hide Eye Toggle */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Create Password *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type={showBuyerPassword ? "text" : "password"}
                                                value={buyerData.password}
                                                onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                                                placeholder="Min 4 characters"
                                                className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowBuyerPassword(!showBuyerPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                                            >
                                                {showBuyerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Confirm Password *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={17} />
                                            <input
                                                type={showBuyerConfirmPassword ? "text" : "password"}
                                                value={buyerData.confirmPassword}
                                                onChange={(e) => setBuyerData({ ...buyerData, confirmPassword: e.target.value })}
                                                placeholder="Repeat password"
                                                className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowBuyerConfirmPassword(!showBuyerConfirmPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                                            >
                                                {showBuyerConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Submit */}
                                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={buyerData.termsAgreed}
                                        onChange={(e) => setBuyerData({ ...buyerData, termsAgreed: e.target.checked })}
                                        className="rounded accent-orange-600 h-4 w-4"
                                        required
                                    />
                                    <span>I agree to Wholesale Procurement Agreement & Direct Settlement Terms</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Registering Buyer...' : 'Complete Buyer Registration'} <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {/* Footer Link to Sign In */}
                        <div className="text-center pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                Already registered on platform?{' '}
                                <Link to="/login" className="font-bold text-emerald-700 hover:underline">
                                    Sign In here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}