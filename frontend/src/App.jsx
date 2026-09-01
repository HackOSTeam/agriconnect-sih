import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import LogisticsDashboard from './pages/LogisticsDashboard';

function DashboardRedirect() {
    const role = localStorage.getItem('role');
    if (role === 'buyer') return <Navigate to="/buyer" replace />;
    if (role === 'logistics') return <Navigate to="/logistics" replace />;
    return <Navigate to="/farmer" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/farmer" element={<FarmerDashboard />} />
                <Route path="/buyer" element={<BuyerDashboard />} />
                <Route path="/logistics" element={<LogisticsDashboard />} />
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
                <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
                <Route path="/logistics-dashboard" element={<LogisticsDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;