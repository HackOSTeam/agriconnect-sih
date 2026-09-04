import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Loader2, AlertCircle, Zap } from 'lucide-react';

/**
 * BuyerPriceCard  — compact price outlook card for BuyerDashboard.
 * Shows direction badge + buy-timing advice for a single commodity.
 */
export default function BuyerPriceCard({ commodity, market, horizon = 7 }) {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!commodity || !market) return;
        setLoading(true);
        setError(false);
        axios.post(`${API_BASE_URL}/api/forecast/predict`, {
            commodity,
            market,
            horizon_days: horizon,
            target: 'modal_price',
            model_type: 'prophet',
        })
            .then(r => { setInsight(r.data); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, [commodity, market, horizon]);

    const directionCfg = {
        rising:  { Icon: TrendingUp,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/25', label: '▲ Rising' },
        falling: { Icon: TrendingDown, color: 'text-red-400',     bg: 'bg-red-500/10    border-red-400/25',     label: '▼ Falling' },
        stable:  { Icon: Minus,       color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-400/25',  label: '━ Stable'  },
    };

    const cfg = insight ? (directionCfg[insight.direction] || directionCfg.stable) : directionCfg.stable;
    const { Icon } = cfg;

    if (loading) return (
        <div className="rounded-2xl bg-[#041B13] border border-white/10 p-4 flex items-center gap-2 text-gray-400 text-xs min-h-[96px]">
            <Loader2 size={14} className="animate-spin text-[#10B981]" />
            <span>Loading {commodity}…</span>
        </div>
    );

    if (error || !insight) return (
        <div className="rounded-2xl bg-red-500/5 border border-red-400/20 p-4 flex items-center gap-2 text-red-300 text-xs min-h-[96px]">
            <AlertCircle size={14} />
            <span>{commodity} — forecast unavailable</span>
        </div>
    );

    return (
        <div className={`rounded-2xl border p-4 transition hover:scale-[1.01] ${cfg.bg}`}>
            {/* Top row */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[10px] text-gray-400 font-mono uppercase mb-0.5">{market}</p>
                    <p className="text-base font-extrabold text-white font-serif">
                        {commodity}
                    </p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-black/20 ${cfg.color}`}>
                    <Icon size={12} />
                    {cfg.label}
                </div>
            </div>

            {/* Price row */}
            <div className="flex items-end gap-3 mb-2">
                <div>
                    <p className="text-[10px] text-gray-400">Current</p>
                    <p className="text-lg font-bold text-white">₹{insight.current_value?.toLocaleString('en-IN')}<span className="text-[10px] text-gray-400">/Qtl</span></p>
                </div>
                <div className="pb-0.5">
                    <span className={`text-xs font-bold ${cfg.color}`}>
                        {insight.change_pct > 0 ? '+' : ''}{insight.change_pct?.toFixed(1)}% in {horizon}d
                    </span>
                </div>
            </div>

            {/* Advice */}
            <div className="flex items-start gap-1.5 bg-black/20 rounded-xl p-2.5">
                <ShoppingCart size={12} className="text-[#34D399] mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-200 leading-snug">{insight.advice_buyer}</p>
            </div>
        </div>
    );
}
