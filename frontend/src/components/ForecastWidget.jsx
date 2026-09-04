import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    TrendingUp, TrendingDown, Minus, Zap, RefreshCw,
    AlertCircle, Loader2, ChevronDown, BarChart2,
    Lightbulb, ShoppingCart, Truck, CheckCircle
} from 'lucide-react';

// ─── Sparkline (inline SVG, no charting library needed) ─────────────────────
function Sparkline({ data = [], color = '#10B981', height = 48 }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 200;
    const h = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 6) - 3;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pts}
            />
        </svg>
    );
}

// ─── Direction Badge ─────────────────────────────────────────────────────────
function DirectionBadge({ direction, pct }) {
    const cfg = {
        rising:  { bg: 'bg-emerald-500/15 border-emerald-400/40', text: 'text-emerald-400', Icon: TrendingUp,  label: 'Rising' },
        falling: { bg: 'bg-red-500/15    border-red-400/40',    text: 'text-red-400',     Icon: TrendingDown, label: 'Falling' },
        stable:  { bg: 'bg-yellow-500/15 border-yellow-400/40', text: 'text-yellow-400',  Icon: Minus,        label: 'Stable' },
    };
    const { bg, text, Icon, label } = cfg[direction] || cfg.stable;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${bg} ${text}`}>
            <Icon size={13} />
            {label} {pct !== undefined && `${Math.abs(pct).toFixed(1)}%`}
        </span>
    );
}

// ─── Supply Pill ─────────────────────────────────────────────────────────────
function SupplyPill({ pressure }) {
    const cfg = {
        high:     { label: 'High Supply',     cls: 'bg-blue-500/15 text-blue-400 border-blue-400/30' },
        moderate: { label: 'Moderate Supply', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
        low:      { label: 'Low Supply',      cls: 'bg-orange-500/15 text-orange-400 border-orange-400/30' },
    };
    const { label, cls } = cfg[pressure] || cfg.moderate;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${cls}`}>
            <Truck size={11} />
            {label}
        </span>
    );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────
export default function ForecastWidget({ role = 'farmer', defaultCommodity = '', defaultMarket = '' }) {
    const [commodities, setCommodities] = useState([]);
    const [markets, setMarkets] = useState([]);
    const [selCommodity, setSelCommodity] = useState('');
    const [selMarket, setSelMarket] = useState('');
    const [horizon, setHorizon] = useState(14);
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');

    // Load commodity list on mount
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/forecast/commodities`)
            .then(r => {
                const list = r.data.commodities || [];
                setCommodities(list);
                const init = defaultCommodity && list.includes(defaultCommodity)
                    ? defaultCommodity
                    : (list[0] || '');
                setSelCommodity(init);
            })
            .catch(() => setError('Could not load commodity list. Is the forecast API running?'));
    }, [defaultCommodity]);

    // Load markets when commodity changes
    useEffect(() => {
        if (!selCommodity) return;
        axios.get(`${API_BASE_URL}/api/forecast/markets?commodity=${encodeURIComponent(selCommodity)}`)
            .then(r => {
                const list = r.data.markets || [];
                setMarkets(list);
                const init = defaultMarket && list.includes(defaultMarket)
                    ? defaultMarket
                    : (list[0] || '');
                setSelMarket(init);
            })
            .catch(() => setMarkets([]));
    }, [selCommodity, defaultMarket]);

    const runForecast = useCallback(async () => {
        if (!selCommodity || !selMarket) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/forecast/predict`, {
                commodity: selCommodity,
                market: selMarket,
                horizon_days: horizon,
                target: 'modal_price',
                model_type: 'prophet',
            });
            setInsight(res.data);
            setLastUpdated(new Date().toLocaleTimeString('en-IN'));
        } catch (e) {
            setError(e.response?.data?.detail || 'Forecast unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [selCommodity, selMarket, horizon]);

    // Auto-run when market changes
    useEffect(() => {
        if (selMarket) runForecast();
    }, [selMarket, horizon]);

    const sparkColor = insight
        ? insight.direction === 'rising' ? '#10B981'
        : insight.direction === 'falling' ? '#EF4444'
        : '#F59E0B'
        : '#10B981';

    const advice = insight ? (role === 'farmer' ? insight.advice_farmer : insight.advice_buyer) : '';

    return (
        <div className="space-y-4 p-1">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <BarChart2 size={16} className="text-[#10B981]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">AI Mandi Forecast</h3>
                        {lastUpdated && (
                            <p className="text-[10px] text-gray-400 font-mono">Updated {lastUpdated}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={runForecast}
                    disabled={loading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition disabled:opacity-50"
                    title="Refresh forecast"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── Controls ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Commodity */}
                <div className="col-span-2 sm:col-span-1 relative">
                    <label className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Commodity</label>
                    <div className="relative">
                        <select
                            value={selCommodity}
                            onChange={e => setSelCommodity(e.target.value)}
                            className="w-full appearance-none bg-[#041B13] border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-[#10B981]/50 cursor-pointer"
                        >
                            {commodities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Market */}
                <div className="col-span-2 sm:col-span-1 relative">
                    <label className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Market / Mandi</label>
                    <div className="relative">
                        <select
                            value={selMarket}
                            onChange={e => setSelMarket(e.target.value)}
                            className="w-full appearance-none bg-[#041B13] border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-[#10B981]/50 cursor-pointer"
                        >
                            {markets.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Horizon buttons */}
                <div className="col-span-2 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Forecast Horizon</label>
                    <div className="flex gap-2">
                        {[7, 14, 30].map(d => (
                            <button
                                key={d}
                                onClick={() => setHorizon(d)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition
                                    ${horizon === d
                                        ? 'bg-[#10B981] text-[#022C22] border-[#10B981]'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Loading state ── */}
            {loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                    <Loader2 size={18} className="animate-spin text-[#10B981]" />
                    <span className="text-sm">Running AI forecast…</span>
                </div>
            )}

            {/* ── Error state ── */}
            {!loading && error && (
                <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-300 text-xs">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Insight cards ── */}
            {!loading && !error && insight && (
                <div className="space-y-3">
                    {/* Price Overview Card */}
                    <div className="rounded-2xl bg-gradient-to-br from-[#041B13] to-[#062319] border border-[#10B981]/20 p-5 relative overflow-hidden">
                        {/* Glow */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#10B981]/10 blur-2xl pointer-events-none" />

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] text-gray-400 font-mono uppercase mb-1">
                                    {insight.commodity} · {insight.market}
                                </p>
                                <p className="text-3xl font-extrabold text-white font-serif">
                                    ₹{insight.current_value?.toLocaleString('en-IN')}
                                    <span className="text-sm text-gray-400 font-normal ml-1">/Qtl</span>
                                </p>
                            </div>
                            <div className="text-right space-y-1.5">
                                <DirectionBadge direction={insight.direction} pct={insight.change_pct} />
                                <br />
                                <SupplyPill pressure={insight.supply_pressure} />
                            </div>
                        </div>

                        {/* Sparkline */}
                        <div className="mb-3">
                            <Sparkline data={insight.sparkline} color={sparkColor} height={52} />
                        </div>

                        {/* Bottom stats row */}
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-gray-400 mb-0.5">Now</p>
                                <p className="text-sm font-bold text-white">₹{insight.current_value?.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-gray-400 mb-0.5">{horizon}d Target</p>
                                <p className={`text-sm font-bold ${insight.direction === 'rising' ? 'text-emerald-400' : insight.direction === 'falling' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    ₹{insight.predicted_value?.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-gray-400 mb-0.5">Price Band</p>
                                <p className="text-[11px] font-bold text-gray-300">
                                    ₹{insight.price_band?.low?.toLocaleString('en-IN')}–{insight.price_band?.high?.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actionable Advice Card */}
                    <div className="rounded-2xl border border-[#10B981]/25 bg-[#041B13]/60 p-4 flex gap-3">
                        <div className="shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                            {role === 'farmer'
                                ? <Lightbulb size={15} className="text-[#34D399]" />
                                : <ShoppingCart size={15} className="text-[#34D399]" />}
                        </div>
                        <div>
                            <p className="text-[11px] text-[#34D399] font-bold uppercase mb-1">
                                {role === 'farmer' ? 'Recommendation for You' : 'Buying Advice'}
                            </p>
                            <p className="text-sm text-gray-200 leading-relaxed">{advice}</p>
                        </div>
                    </div>

                    {/* Data source footnote */}
                    <p className="text-[10px] text-gray-500 font-mono text-right">
                        📡 Source: {insight.data_source}
                    </p>
                </div>
            )}
        </div>
    );
}
