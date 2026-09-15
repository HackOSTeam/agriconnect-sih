import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { API_BASE_URL } from '../config';
import {
    Truck, MapPin, Navigation, TrendingUp, CheckCircle2,
    AlertCircle, Clock, ShieldCheck, DollarSign, Activity,
    Sparkles, Zap, Plus, Trash2, Play, Pause, RefreshCw,
    Download, Copy, Check, FileText, Layers, ExternalLink,
    ChevronRight, ArrowRight, ArrowDownRight, Warehouse,
    ShoppingBag, Store, Package, Info, Sliders, Settings
} from 'lucide-react';

const ROUTE_COLORS = [
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4'  // Cyan
];

const DEFAULT_PUNE_PAYLOAD = {
    depot: { id: "D0", name: "Pune Central Hub", lat: 18.5204, lon: 73.8567 },
    farmers: [
        { farmer_id: "F01", name: "Farmer A (Kothrud)", lat: 18.5074, lon: 73.8077, product: "Tomato", supply_kg: 180, pickup_start: "06:00", pickup_end: "10:00", service_min: 15 },
        { farmer_id: "F02", name: "Farmer B (Hinjewadi)", lat: 18.5913, lon: 73.7389, product: "Tomato", supply_kg: 220, pickup_start: "06:00", pickup_end: "10:30", service_min: 15 },
        { farmer_id: "F03", name: "Farmer C (Chinchwad)", lat: 18.6298, lon: 73.7997, product: "Tomato", supply_kg: 160, pickup_start: "06:30", pickup_end: "11:00", service_min: 15 },
        { farmer_id: "F04", name: "Farmer D (Katraj)", lat: 18.4529, lon: 73.8553, product: "Tomato", supply_kg: 140, pickup_start: "06:00", pickup_end: "09:30", service_min: 15 }
    ],
    buyers: [
        { buyer_id: "B01", name: "Wholesale Mandi 1 (Hadapsar)", lat: 18.5679, lon: 73.9143, product: "Tomato", demand_kg: 250, delivery_start: "09:00", delivery_end: "13:00", service_min: 20 },
        { buyer_id: "B02", name: "Supermarket DC (Pimple Saudagar)", lat: 18.6420, lon: 73.7610, product: "Tomato", demand_kg: 220, delivery_start: "09:00", delivery_end: "14:00", service_min: 20 },
        { buyer_id: "B03", name: "Retail Aggregator (Bibwewadi)", lat: 18.4770, lon: 73.8900, product: "Tomato", demand_kg: 120, delivery_start: "08:30", delivery_end: "12:00", service_min: 20 }
    ],
    vehicles: [
        { vehicle_id: "V01", capacity_kg: 350, max_route_min: 540, fixed_cost: 300.0 },
        { vehicle_id: "V02", capacity_kg: 350, max_route_min: 540, fixed_cost: 300.0 },
        { vehicle_id: "V03", capacity_kg: 300, max_route_min: 540, fixed_cost: 300.0 }
    ],
    cost_per_km: 12.0,
    cost_per_hour: 80.0,
    solver_time_limit_seconds: 10,
    use_osrm: true
};

export default function RouteOptimizerWidget({
    standalone = false,
    compact = false,
    title = "KisanRoute AI — Smart Multi-Stop Route Optimization",
    subtitle = "Google OR-Tools PDP-VRPTW • Real-Road Navigation • Multi-Farm Aggregation"
}) {
    // Scenario & Editor State
    const [selectedPreset, setSelectedPreset] = useState('pune_cluster');
    const [depot, setDepot] = useState(DEFAULT_PUNE_PAYLOAD.depot);
    const [farmers, setFarmers] = useState(DEFAULT_PUNE_PAYLOAD.farmers);
    const [buyers, setBuyers] = useState(DEFAULT_PUNE_PAYLOAD.buyers);
    const [vehicles, setVehicles] = useState(DEFAULT_PUNE_PAYLOAD.vehicles);
    const [costPerKm, setCostPerKm] = useState(DEFAULT_PUNE_PAYLOAD.cost_per_km);
    const [costPerHour, setCostPerHour] = useState(DEFAULT_PUNE_PAYLOAD.cost_per_hour);
    const [useOsrm, setUseOsrm] = useState(DEFAULT_PUNE_PAYLOAD.use_osrm);
    const [solverTimeLimit, setSolverTimeLimit] = useState(DEFAULT_PUNE_PAYLOAD.solver_time_limit_seconds);

    // Active UI Tabs
    const [activeSidebarTab, setActiveSidebarTab] = useState('farmers'); // 'farmers' | 'buyers' | 'fleet'
    const [activeVehicleTab, setActiveVehicleTab] = useState(0);

    // Results & Status State
    const [optimizing, setOptimizing] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [presetsData, setPresetsData] = useState(null);

    // Modal & Code Snippet
    const [showExportModal, setShowExportModal] = useState(false);
    const [snippetLang, setSnippetLang] = useState('fetch');
    const [copiedCode, setCopiedCode] = useState(false);

    // Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const simRef = useRef({ interval: null, marker: null, step: 0 });

    // Map DOM Ref
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const routesLayerRef = useRef(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    // Load available presets on mount
    useEffect(() => {
        const fetchPresets = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/v1/presets`);
                if (res.data) setPresetsData(res.data);
            } catch (err) {
                console.warn("Could not fetch remote presets, using defaults:", err);
            }
        };
        fetchPresets();
    }, []);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([depot.lat, depot.lon], 11);

            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                maxZoom: 19,
                subdomains: "abcd",
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            L.control.zoom({ position: "bottomright" }).addTo(map);

            markersLayerRef.current = L.layerGroup().addTo(map);
            routesLayerRef.current = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;
        }

        renderMapMarkers();

        // Cleanup on unmount
        return () => {
            if (simRef.current.interval) clearInterval(simRef.current.interval);
        };
    }, []);

    // Re-render markers whenever topology changes
    useEffect(() => {
        renderMapMarkers();
    }, [depot, farmers, buyers]);

    // Switch Presets
    const handlePresetChange = async (key) => {
        setSelectedPreset(key);
        if (key === 'custom') return;

        if (key === 'live_orders') {
            await syncLiveOrders();
            return;
        }

        if (presetsData && presetsData[key]) {
            loadPayload(presetsData[key].payload);
            showToast(`Loaded ${presetsData[key].title}`);
        } else if (key === 'pune_cluster') {
            loadPayload(DEFAULT_PUNE_PAYLOAD);
            showToast('Loaded Pune Agro-Cluster');
        }
    };

    const loadPayload = (p) => {
        if (p.depot) setDepot(p.depot);
        if (p.farmers) setFarmers(p.farmers);
        if (p.buyers) setBuyers(p.buyers);
        if (p.vehicles) setVehicles(p.vehicles);
        if (p.cost_per_km !== undefined) setCostPerKm(p.cost_per_km);
        if (p.cost_per_hour !== undefined) setCostPerHour(p.cost_per_hour);
        if (p.use_osrm !== undefined) setUseOsrm(p.use_osrm);
        if (p.solver_time_limit_seconds !== undefined) setSolverTimeLimit(p.solver_time_limit_seconds);

        // Clear previous routes & stop simulation
        if (routesLayerRef.current) routesLayerRef.current.clearLayers();
        setOptimizationResult(null);
        stopSimulation();
    };

    // Live Order Sync from SQLite
    const syncLiveOrders = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/route/live-orders`);
            if (res.data && res.data.payload) {
                loadPayload(res.data.payload);
                showToast(res.data.message || "Synced live orders from AgriConnect DB!");
            }
        } catch (err) {
            console.error("Live order sync failed:", err);
            showToast("⚠️ Could not load live orders; loaded Pune sample instead.");
        }
    };

    // Render Markers on Map
    const renderMapMarkers = () => {
        if (!markersLayerRef.current || !mapInstanceRef.current) return;
        markersLayerRef.current.clearLayers();

        const allCoords = [];

        // 1. Depot Marker
        if (depot && depot.lat && depot.lon) {
            const depotIcon = L.divIcon({
                className: "custom-depot-marker",
                html: `
                    <div style="background: #0F172A; color: #F59E0B; border: 2px solid #F59E0B; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); font-size: 16px;">
                        🏢
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            });

            const depotMarker = L.marker([depot.lat, depot.lon], { icon: depotIcon })
                .bindPopup(`
                    <div style="font-family: sans-serif; font-size: 12px; color: #0F172A;">
                        <b style="font-size: 13px; color: #0F172A;">🏢 ${depot.name}</b><br/>
                        <span style="color: #64748B;">Central Dispatch Hub (ID: ${depot.id})</span><br/>
                        <span style="color: #059669; font-weight: bold;">Fleet Base & Return Node</span>
                    </div>
                `);
            markersLayerRef.current.addLayer(depotMarker);
            allCoords.push([depot.lat, depot.lon]);
        }

        // 2. Farmer Pickups Markers
        farmers.forEach((f, idx) => {
            if (!f.lat || !f.lon) return;
            const farmerIcon = L.divIcon({
                className: "custom-farmer-marker",
                html: `
                    <div style="background: #065F46; color: #34D399; border: 2px solid #10B981; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(16, 185, 129, 0.4); font-size: 13px; font-weight: bold;">
                        🌾
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([f.lat, f.lon], { icon: farmerIcon })
                .bindPopup(`
                    <div style="font-family: sans-serif; font-size: 12px; color: #0F172A;">
                        <b style="font-size: 13px; color: #065F46;">🌾 ${f.name}</b><br/>
                        <span style="color: #64748B;">Farmer ID: ${f.farmer_id}</span><br/>
                        <b>Harvest:</b> ${f.supply_kg} kg ${f.product}<br/>
                        <b>Pickup Window:</b> ${f.pickup_start} - ${f.pickup_end}<br/>
                        <b>Loading Time:</b> ${f.service_min} mins
                    </div>
                `);
            markersLayerRef.current.addLayer(marker);
            allCoords.push([f.lat, f.lon]);
        });

        // 3. Buyer Mandi Markers
        buyers.forEach((b, idx) => {
            if (!b.lat || !b.lon) return;
            const buyerIcon = L.divIcon({
                className: "custom-buyer-marker",
                html: `
                    <div style="background: #7C2D12; color: #FB923C; border: 2px solid #EA580C; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(234, 88, 12, 0.4); font-size: 13px; font-weight: bold;">
                        🏬
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([b.lat, b.lon], { icon: buyerIcon })
                .bindPopup(`
                    <div style="font-family: sans-serif; font-size: 12px; color: #0F172A;">
                        <b style="font-size: 13px; color: #9A3412;">🏬 ${b.name}</b><br/>
                        <span style="color: #64748B;">Buyer ID: ${b.buyer_id}</span><br/>
                        <b>Demand:</b> ${b.demand_kg} kg ${b.product}<br/>
                        <b>Delivery Window:</b> ${b.delivery_start} - ${b.delivery_end}<br/>
                        <b>Unload Time:</b> ${b.service_min} mins
                    </div>
                `);
            markersLayerRef.current.addLayer(marker);
            allCoords.push([b.lat, b.lon]);
        });

        // Auto-fit map if not yet solved
        if (!optimizationResult && allCoords.length > 0 && mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(allCoords, { padding: [40, 40] });
        }
    };

    // Run Optimization
    const handleRunOptimization = async () => {
        setOptimizing(true);
        setErrorMessage('');
        stopSimulation();

        const payload = {
            depot: {
                id: depot.id,
                name: depot.name,
                lat: parseFloat(depot.lat),
                lon: parseFloat(depot.lon)
            },
            farmers: farmers.map(f => ({
                farmer_id: f.farmer_id,
                name: f.name,
                lat: parseFloat(f.lat),
                lon: parseFloat(f.lon),
                product: f.product,
                supply_kg: parseFloat(f.supply_kg),
                pickup_start: f.pickup_start,
                pickup_end: f.pickup_end,
                service_min: parseInt(f.service_min) || 15
            })),
            buyers: buyers.map(b => ({
                buyer_id: b.buyer_id,
                name: b.name,
                lat: parseFloat(b.lat),
                lon: parseFloat(b.lon),
                product: b.product,
                demand_kg: parseFloat(b.demand_kg),
                delivery_start: b.delivery_start,
                delivery_end: b.delivery_end,
                service_min: parseInt(b.service_min) || 20
            })),
            vehicles: vehicles.map(v => ({
                vehicle_id: v.vehicle_id,
                capacity_kg: parseFloat(v.capacity_kg),
                max_route_min: parseInt(v.max_route_min) || 540,
                fixed_cost: parseFloat(v.fixed_cost) || 300.0
            })),
            cost_per_km: parseFloat(costPerKm) || 12.0,
            cost_per_hour: parseFloat(costPerHour) || 80.0,
            solver_time_limit_seconds: parseInt(solverTimeLimit) || 10,
            use_osrm: useOsrm
        };

        try {
            const res = await axios.post(`${API_BASE_URL}/api/v1/optimize`, payload);
            if (res.data && res.data.status === 'success') {
                setOptimizationResult(res.data);
                drawOptimizedRoutes(res.data.routes);
                setActiveVehicleTab(0);
                showToast(`✅ Route optimization completed! ${res.data.routes.length} vehicle(s) deployed.`);
            } else {
                throw new Error("Optimization returned unsuccessful status.");
            }
        } catch (err) {
            const detail = err.response?.data?.detail || err.message || "Optimization failed. Check capacity and time constraints.";
            setErrorMessage(detail);
            showToast(`❌ ${detail}`);
        } finally {
            setOptimizing(false);
        }
    };

    // Draw Routes on Map
    const drawOptimizedRoutes = (routes) => {
        if (!routesLayerRef.current || !mapInstanceRef.current) return;
        routesLayerRef.current.clearLayers();

        const allRouteCoords = [];

        routes.forEach((route, idx) => {
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            const coords = (route.geometry_geojson && route.geometry_geojson.length > 0)
                ? route.geometry_geojson
                : route.stops.map(s => [s.latitude, s.longitude]);

            // Outer Neon Glow Polyline
            const glowLine = L.polyline(coords, {
                color: color,
                weight: 8,
                opacity: 0.35,
                lineCap: 'round'
            });

            // Inner Crisp Polyline
            const routeLine = L.polyline(coords, {
                color: color,
                weight: 4,
                opacity: 0.95,
                lineCap: 'round'
            }).bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; color: #0F172A;">
                    <b style="color: ${color}; font-size: 13px;">🚚 Vehicle ${route.vehicle_id}</b><br/>
                    <b>Distance:</b> ${route.distance_km} km<br/>
                    <b>Travel Time:</b> ${route.travel_time_min} mins<br/>
                    <b>Max Load:</b> ${route.max_load_kg} / ${route.capacity_kg} kg (${route.utilization_pct}%)<br/>
                    <b>Trip Cost:</b> ₹${route.estimated_cost_inr}
                </div>
            `);

            routesLayerRef.current.addLayer(glowLine);
            routesLayerRef.current.addLayer(routeLine);

            coords.forEach(c => allRouteCoords.push(c));
        });

        if (allRouteCoords.length > 0 && mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(allRouteCoords, { padding: [50, 50] });
        }
    };

    // Simulation Toggle
    const toggleSimulation = () => {
        if (isSimulating) {
            stopSimulation();
        } else {
            startSimulation();
        }
    };

    const startSimulation = () => {
        if (!optimizationResult || !optimizationResult.routes || optimizationResult.routes.length === 0) {
            showToast("Please optimize routes first before running simulation.");
            return;
        }

        const activeRoute = optimizationResult.routes[activeVehicleTab] || optimizationResult.routes[0];
        const coords = activeRoute.geometry_geojson || activeRoute.stops.map(s => [s.latitude, s.longitude]);

        if (!coords || coords.length < 2) return;

        if (simRef.current.marker && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(simRef.current.marker);
        }

        const truckSimIcon = L.divIcon({
            className: "truck-sim-marker",
            html: `
                <div style="background: #10B981; color: #022C22; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #10B981; border: 2px solid white; font-size: 15px;">
                    🚚
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        simRef.current.marker = L.marker(coords[0], { icon: truckSimIcon }).addTo(mapInstanceRef.current);
        simRef.current.step = 0;
        setIsSimulating(true);

        simRef.current.interval = setInterval(() => {
            simRef.current.step = (simRef.current.step + 1) % coords.length;
            const nextCoord = coords[simRef.current.step];
            if (simRef.current.marker) {
                simRef.current.marker.setLatLng(nextCoord);
            }
        }, 80);
    };

    const stopSimulation = () => {
        if (simRef.current.interval) {
            clearInterval(simRef.current.interval);
            simRef.current.interval = null;
        }
        if (simRef.current.marker && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(simRef.current.marker);
            simRef.current.marker = null;
        }
        setIsSimulating(false);
    };

    const fitAllBounds = () => {
        if (!mapInstanceRef.current) return;
        const allCoords = [
            [depot.lat, depot.lon],
            ...farmers.map(f => [f.lat, f.lon]),
            ...buyers.map(b => [b.lat, b.lon])
        ];
        if (allCoords.length > 0) {
            mapInstanceRef.current.fitBounds(allCoords, { padding: [40, 40] });
        }
    };

    const zoomToStop = (lat, lon) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 14, { animate: true });
        }
    };

    // Farmer Add/Remove
    const addFarmer = () => {
        const nextId = `F${farmers.length + 1 < 10 ? '0' : ''}${farmers.length + 1}`;
        setFarmers([...farmers, {
            farmer_id: nextId,
            name: `Farmer ${nextId} (Cluster Point)`,
            lat: 18.5204 + (Math.random() - 0.5) * 0.15,
            lon: 73.8567 + (Math.random() - 0.5) * 0.15,
            product: "Tomato",
            supply_kg: 150,
            pickup_start: "06:00",
            pickup_end: "10:30",
            service_min: 15
        }]);
    };

    const removeFarmer = (idx) => {
        setFarmers(farmers.filter((_, i) => i !== idx));
    };

    // Buyer Add/Remove
    const addBuyer = () => {
        const nextId = `B${buyers.length + 1 < 10 ? '0' : ''}${buyers.length + 1}`;
        setBuyers([...buyers, {
            buyer_id: nextId,
            name: `Mandi / Supermarket ${nextId}`,
            lat: 18.5204 + (Math.random() - 0.5) * 0.15,
            lon: 73.8567 + (Math.random() - 0.5) * 0.15,
            product: "Tomato",
            demand_kg: 150,
            delivery_start: "09:00",
            delivery_end: "14:00",
            service_min: 20
        }]);
    };

    const removeBuyer = (idx) => {
        setBuyers(buyers.filter((_, i) => i !== idx));
    };

    // Vehicle Add/Remove
    const addVehicle = () => {
        const nextId = `V${vehicles.length + 1 < 10 ? '0' : ''}${vehicles.length + 1}`;
        setVehicles([...vehicles, {
            vehicle_id: nextId,
            capacity_kg: 400,
            max_route_min: 540,
            fixed_cost: 350.0
        }]);
    };

    const removeVehicle = (idx) => {
        if (vehicles.length <= 1) {
            showToast("At least 1 vehicle is required.");
            return;
        }
        setVehicles(vehicles.filter((_, i) => i !== idx));
    };

    // Code Snippet Generator
    const getCodeSnippet = (lang) => {
        if (lang === 'react') {
            return `import { useState } from 'react';\nimport axios from 'axios';\n\nexport function useRouteOptimizer() {\n  const [loading, setLoading] = useState(false);\n  const [routes, setRoutes] = useState([]);\n\n  const optimize = async (payload) => {\n    setLoading(true);\n    try {\n      const res = await axios.post('${API_BASE_URL}/api/v1/optimize', payload);\n      setRoutes(res.data.routes);\n      return res.data;\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return { optimize, routes, loading };\n}`;
        }
        if (lang === 'curl') {
            return `curl -X POST "${API_BASE_URL}/api/v1/optimize" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "depot": {"id": "D0", "name": "Pune Hub", "lat": 18.5204, "lon": 73.8567},\n    "farmers": [{"farmer_id": "F01", "name": "Farmer A", "lat": 18.5074, "lon": 73.8077, "product": "Tomato", "supply_kg": 180, "pickup_start": "06:00", "pickup_end": "10:00"}],\n    "buyers": [{"buyer_id": "B01", "name": "Hadapsar Mandi", "lat": 18.5679, "lon": 73.9143, "product": "Tomato", "demand_kg": 180, "delivery_start": "09:00", "delivery_end": "13:00"}],\n    "vehicles": [{"vehicle_id": "V01", "capacity_kg": 350, "max_route_min": 540, "fixed_cost": 300.0}]\n  }'`;
        }
        return `const response = await fetch('${API_BASE_URL}/api/v1/optimize', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    depot: { id: "D0", name: "Pune Central Hub", lat: 18.5204, lon: 73.8567 },\n    farmers: [\n      { farmer_id: "F01", name: "Farmer A", lat: 18.5074, lon: 73.8077, product: "Tomato", supply_kg: 180, pickup_start: "06:00", pickup_end: "10:00" }\n    ],\n    buyers: [\n      { buyer_id: "B01", name: "Hadapsar Mandi", lat: 18.5679, lon: 73.9143, product: "Tomato", demand_kg: 180, delivery_start: "09:00", delivery_end: "13:00" }\n    ],\n    vehicles: [\n      { vehicle_id: "V01", capacity_kg: 350, max_route_min: 540, fixed_cost: 300.0 }\n    ]\n  })\n});\nconst data = await response.json();\nconsole.log(data.kpis, data.routes);`;
    };

    const copySnippet = () => {
        navigator.clipboard.writeText(getCodeSnippet(snippetLang));
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const downloadPayloadJSON = () => {
        const payload = {
            depot, farmers, buyers, vehicles, cost_per_km: costPerKm, cost_per_hour: costPerHour, use_osrm: useOsrm, solver_time_limit_seconds: solverTimeLimit
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kisanroute_payload_${selectedPreset}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activeRoute = optimizationResult?.routes?.[activeVehicleTab];

    return (
        <div className={`space-y-6 ${standalone ? 'max-w-7xl mx-auto' : ''}`}>
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#0F172A] border border-[#10B981] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles size={18} className="text-[#34D399]" />
                    <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Top Control Strip */}
            <div className="bg-[#07241A] text-white border border-[#10B981]/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#047857] rounded-2xl flex items-center justify-center text-[#022C22] shadow-lg shadow-[#10B981]/30">
                        <Truck size={24} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-white font-serif">{title}</h2>
                            <span className="bg-[#10B981]/20 text-[#34D399] text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-[#10B981]/30 font-bold">
                                OR-Tools v9.15
                            </span>
                        </div>
                        <p className="text-xs text-gray-300 font-sans mt-0.5">{subtitle}</p>
                    </div>
                </div>

                {/* Preset & Optimization Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-[#031710] px-3 py-1.5 rounded-2xl border border-white/10 text-xs font-mono">
                        <Sparkles size={14} className="text-[#F59E0B]" />
                        <span className="text-gray-400">Scenario:</span>
                        <select
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                            className="bg-transparent text-[#34D399] font-bold outline-none cursor-pointer"
                        >
                            <option value="pune_cluster" className="bg-[#0F172A] text-white">Pune Agro-Cluster (Tomato Belt)</option>
                            <option value="nashik_cluster" className="bg-[#0F172A] text-white">Nashik Agro Hub (Grapes & Onions)</option>
                            <option value="live_orders" className="bg-[#0F172A] text-[#34D399]">⚡ Sync AgriConnect Live Orders</option>
                            <option value="custom" className="bg-[#0F172A] text-white">-- Custom Dataset --</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowExportModal(true)}
                        className="bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white px-3.5 py-2 rounded-2xl text-xs font-semibold border border-white/15 transition flex items-center gap-1.5"
                    >
                        <ExternalLink size={14} /> Embed API
                    </button>

                    <button
                        onClick={handleRunOptimization}
                        disabled={optimizing}
                        className={`bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-[#10B981]/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 text-xs sm:text-sm ${optimizing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {optimizing ? (
                            <>
                                <RefreshCw size={16} className="animate-spin text-white" />
                                <span>Solving VRPTW...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={16} className="text-[#A7F3D0]" />
                                <span>Optimize Routes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message if Any */}
            {errorMessage && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-200 p-4 rounded-2xl text-xs flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Executive Real-Time KPI Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-3xl shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wider font-mono">
                        <span>Fleet Deployment</span>
                        <Truck size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
                        {optimizationResult ? `${optimizationResult.kpis.vehicles_used} / ${vehicles.length}` : `${vehicles.length} Ready`}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {optimizationResult ? `${optimizationResult.routes.length} Active Route(s) Deployed` : 'Standing By for Dispatch'}
                    </div>
                </div>

                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-3xl shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wider font-mono">
                        <span>Optimized Road Distance</span>
                        <Navigation size={16} className="text-[#059669]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
                        {optimizationResult ? `${optimizationResult.kpis.total_distance_km} km` : '-- km'}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <Zap size={12} className="text-[#F59E0B]" />
                        {optimizationResult ? `${optimizationResult.kpis.distance_saved_pct}% Saved vs Solo Baseline` : 'Calculated vs Direct Farmer Trips'}
                    </div>
                </div>

                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-3xl shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wider font-mono">
                        <span>Trip Logistics Cost</span>
                        <DollarSign size={16} className="text-[#EA580C]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#EA580C] font-mono">
                        {optimizationResult ? `₹${optimizationResult.kpis.estimated_transport_cost_inr.toLocaleString('en-IN')}` : '₹ --'}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                        {optimizationResult ? `₹${optimizationResult.kpis.cost_per_kg_inr} / kg cargo transported` : 'Fuel + Driver Hours + Fixed Cost'}
                    </div>
                </div>

                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-3xl shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wider font-mono">
                        <span>Truck Load Utilization</span>
                        <Activity size={16} className="text-purple-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
                        {optimizationResult ? `${optimizationResult.kpis.capacity_utilization_pct}%` : '-- %'}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                        {optimizationResult ? `${optimizationResult.kpis.total_goods_kg} kg aggregated total` : 'Zero Spoilage Cold Consolidation'}
                    </div>
                </div>
            </div>

            {/* Main Interactive Grid: Left Editor & Right Map + Manifest */}
            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Column: Topology & Node Configuration */}
                <div className="lg:col-span-5 bg-white border border-gray-200/90 p-5 sm:p-6 rounded-3xl shadow-sm space-y-5">
                    {/* Navigation Sub-tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-2xl text-xs font-bold">
                        <button
                            onClick={() => setActiveSidebarTab('farmers')}
                            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSidebarTab === 'farmers' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            🌾 Farmers ({farmers.length})
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('buyers')}
                            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSidebarTab === 'buyers' ? 'bg-white text-[#EA580C] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            🏬 Buyers ({buyers.length})
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('fleet')}
                            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSidebarTab === 'fleet' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            🚚 Fleet & Cost
                        </button>
                    </div>

                    {/* 1. Farmers Tab Content */}
                    {activeSidebarTab === 'farmers' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Farm Collection Points</h3>
                                    <p className="text-[11px] text-gray-500">Pickup windows and harvest quantities</p>
                                </div>
                                <button
                                    onClick={addFarmer}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Farmer
                                </button>
                            </div>

                            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                {farmers.map((f, idx) => (
                                    <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs space-y-2">
                                        <div className="flex justify-between items-start">
                                            <input
                                                type="text"
                                                value={f.name}
                                                onChange={(e) => {
                                                    const updated = [...farmers];
                                                    updated[idx].name = e.target.value;
                                                    setFarmers(updated);
                                                }}
                                                className="font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 outline-none w-3/4"
                                            />
                                            <button onClick={() => removeFarmer(idx)} className="text-gray-400 hover:text-red-600 transition">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                            <div>
                                                <span className="text-gray-500 block">Crop / Supply:</span>
                                                <div className="flex gap-1">
                                                    <input
                                                        type="text"
                                                        value={f.product}
                                                        onChange={(e) => {
                                                            const updated = [...farmers];
                                                            updated[idx].product = e.target.value;
                                                            setFarmers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={f.supply_kg}
                                                        onChange={(e) => {
                                                            const updated = [...farmers];
                                                            updated[idx].supply_kg = e.target.value;
                                                            setFarmers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded font-bold text-emerald-700"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 block">Pickup Window:</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={f.pickup_start}
                                                        onChange={(e) => {
                                                            const updated = [...farmers];
                                                            updated[idx].pickup_start = e.target.value;
                                                            setFarmers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded text-center"
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="text"
                                                        value={f.pickup_end}
                                                        onChange={(e) => {
                                                            const updated = [...farmers];
                                                            updated[idx].pickup_end = e.target.value;
                                                            setFarmers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded text-center"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Buyers Tab Content */}
                    {activeSidebarTab === 'buyers' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Demand Destinations</h3>
                                    <p className="text-[11px] text-gray-500">Mandi deliveries and retail deadlines</p>
                                </div>
                                <button
                                    onClick={addBuyer}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200 transition flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Buyer
                                </button>
                            </div>

                            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                {buyers.map((b, idx) => (
                                    <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs space-y-2">
                                        <div className="flex justify-between items-start">
                                            <input
                                                type="text"
                                                value={b.name}
                                                onChange={(e) => {
                                                    const updated = [...buyers];
                                                    updated[idx].name = e.target.value;
                                                    setBuyers(updated);
                                                }}
                                                className="font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-amber-500 outline-none w-3/4"
                                            />
                                            <button onClick={() => removeBuyer(idx)} className="text-gray-400 hover:text-red-600 transition">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                            <div>
                                                <span className="text-gray-500 block">Produce / Demand:</span>
                                                <div className="flex gap-1">
                                                    <input
                                                        type="text"
                                                        value={b.product}
                                                        onChange={(e) => {
                                                            const updated = [...buyers];
                                                            updated[idx].product = e.target.value;
                                                            setBuyers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={b.demand_kg}
                                                        onChange={(e) => {
                                                            const updated = [...buyers];
                                                            updated[idx].demand_kg = e.target.value;
                                                            setBuyers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded font-bold text-[#EA580C]"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 block">Delivery Window:</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={b.delivery_start}
                                                        onChange={(e) => {
                                                            const updated = [...buyers];
                                                            updated[idx].delivery_start = e.target.value;
                                                            setBuyers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded text-center"
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="text"
                                                        value={b.delivery_end}
                                                        onChange={(e) => {
                                                            const updated = [...buyers];
                                                            updated[idx].delivery_end = e.target.value;
                                                            setBuyers(updated);
                                                        }}
                                                        className="w-1/2 p-1 bg-white border border-gray-200 rounded text-center"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Fleet & Parameters Tab Content */}
                    {activeSidebarTab === 'fleet' && (
                        <div className="space-y-4 text-xs">
                            {/* Depot Box */}
                            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2 font-bold text-blue-900">
                                    <Warehouse size={16} /> Central Dispatch Hub (Depot)
                                </div>
                                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                                    <div>
                                        <label className="text-gray-500">Hub Name</label>
                                        <input
                                            type="text"
                                            value={depot.name}
                                            onChange={(e) => setDepot({ ...depot, name: e.target.value })}
                                            className="w-full p-1.5 bg-white border border-gray-200 rounded mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-500">Coordinates (Lat, Lon)</label>
                                        <div className="flex gap-1 mt-0.5">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={depot.lat}
                                                onChange={(e) => setDepot({ ...depot, lat: parseFloat(e.target.value) })}
                                                className="w-1/2 p-1 bg-white border border-gray-200 rounded text-center"
                                            />
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={depot.lon}
                                                onChange={(e) => setDepot({ ...depot, lon: parseFloat(e.target.value) })}
                                                className="w-1/2 p-1 bg-white border border-gray-200 rounded text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicles List */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Vehicle Fleet ({vehicles.length} Trucks)</span>
                                    <button
                                        onClick={addVehicle}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-xl font-bold transition"
                                    >
                                        + Add Truck
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                    {vehicles.map((v, idx) => (
                                        <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between font-mono text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} className="text-emerald-600" />
                                                <input
                                                    type="text"
                                                    value={v.vehicle_id}
                                                    onChange={(e) => {
                                                        const updated = [...vehicles];
                                                        updated[idx].vehicle_id = e.target.value;
                                                        setVehicles(updated);
                                                    }}
                                                    className="w-16 p-1 bg-white border border-gray-200 rounded font-bold"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">Cap:</span>
                                                <input
                                                    type="number"
                                                    value={v.capacity_kg}
                                                    onChange={(e) => {
                                                        const updated = [...vehicles];
                                                        updated[idx].capacity_kg = parseFloat(e.target.value);
                                                        setVehicles(updated);
                                                    }}
                                                    className="w-16 p-1 bg-white border border-gray-200 rounded text-center font-bold text-emerald-700"
                                                />
                                                <span>kg</span>
                                            </div>
                                            <button onClick={() => removeVehicle(idx)} className="text-gray-400 hover:text-red-600 ml-2">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logistics Cost Unit Parameters */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 font-mono text-[11px]">
                                <div>
                                    <label className="text-gray-500">Fuel Cost / Km (₹)</label>
                                    <input
                                        type="number"
                                        value={costPerKm}
                                        onChange={(e) => setCostPerKm(parseFloat(e.target.value))}
                                        className="w-full p-1.5 bg-white border border-gray-200 rounded mt-0.5"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-500">Driver Cost / Hr (₹)</label>
                                    <input
                                        type="number"
                                        value={costPerHour}
                                        onChange={(e) => setCostPerHour(parseFloat(e.target.value))}
                                        className="w-full p-1.5 bg-white border border-gray-200 rounded mt-0.5"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px]">
                                <div>
                                    <span className="font-bold text-gray-800">OSRM Road Network</span>
                                    <p className="text-[10px] text-gray-500">Exact road coordinates vs Haversine straight lines</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={useOsrm}
                                    onChange={(e) => setUseOsrm(e.target.checked)}
                                    className="w-4 h-4 accent-[#10B981] cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Leaflet Map & Driver Turn-by-Turn Manifest */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Interactive Leaflet Map Box */}
                    <div className="bg-[#031710] border border-white/10 rounded-3xl overflow-hidden shadow-xl relative">
                        {/* Map Container */}
                        <div ref={mapContainerRef} className="h-[360px] sm:h-[400px] w-full z-0" />

                        {/* Floating Action Buttons */}
                        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                            <button
                                onClick={fitAllBounds}
                                title="Fit Map Bounds"
                                className="bg-[#0F172A]/90 hover:bg-[#0F172A] text-white p-2.5 rounded-xl border border-white/15 shadow-lg transition"
                            >
                                <Navigation size={16} />
                            </button>
                            <button
                                onClick={toggleSimulation}
                                title="Simulate Route Playback"
                                className={`p-2.5 rounded-xl border shadow-lg transition flex items-center justify-center ${isSimulating ? 'bg-[#10B981] text-[#022C22] border-[#10B981]' : 'bg-[#0F172A]/90 hover:bg-[#0F172A] text-white border-white/15'}`}
                            >
                                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                        </div>

                        {/* Floating Legend */}
                        <div className="absolute bottom-4 left-4 z-[400] bg-[#0F172A]/90 backdrop-blur-md border border-white/15 text-white px-3 py-2 rounded-2xl text-[11px] font-mono space-y-1 shadow-2xl">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded bg-[#F59E0B] inline-block" /> Depot (Hub)
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block ml-2" /> Farmer Pickup (+kg)
                                <span className="w-2.5 h-2.5 rounded bg-[#EA580C] inline-block ml-2" /> Buyer Mandi (-kg)
                            </div>
                        </div>

                        {/* Optimizing Overlay */}
                        {optimizing && (
                            <div className="absolute inset-0 bg-[#031710]/85 backdrop-blur-md z-[500] flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                                <div className="w-12 h-12 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
                                <h4 className="font-bold text-base text-white">Running Constraint Programming Solver...</h4>
                                <p className="text-xs text-gray-400 font-sans max-w-sm">
                                    Resolving Pickup-Delivery precedence, truck weight capacities, and time windows across road network.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Driver Turn-by-Turn Manifest & Timeline */}
                    <div className="bg-white border border-gray-200/90 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                                    <FileText size={18} className="text-emerald-700" /> Driver Turn-by-Turn Dispatch Manifest
                                </h3>
                                <p className="text-[11px] text-gray-500 font-sans">
                                    Ordered stop sequence with calculated arrival ETAs & onboard payload tracking
                                </p>
                            </div>

                            {/* Active Vehicle Switcher Tabs */}
                            {optimizationResult?.routes && optimizationResult.routes.length > 0 && (
                                <div className="flex gap-1.5 overflow-x-auto p-1 bg-gray-100 rounded-2xl">
                                    {optimizationResult.routes.map((r, idx) => (
                                        <button
                                            key={r.vehicle_id}
                                            onClick={() => setActiveVehicleTab(idx)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeVehicleTab === idx ? 'bg-[#065F46] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                        >
                                            <Truck size={13} /> {r.vehicle_id} ({r.distance_km} km)
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stops Timeline */}
                        {activeRoute ? (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono text-gray-500 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                                    <span>Route Distance: <b>{activeRoute.distance_km} km</b></span>
                                    <span>Duration: <b>{activeRoute.travel_time_min} mins</b></span>
                                    <span>Peak Load: <b>{activeRoute.max_load_kg} / {activeRoute.capacity_kg} kg ({activeRoute.utilization_pct}%)</b></span>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                                    {activeRoute.stops.map((stop, idx) => {
                                        const isDepot = stop.type === 'DEPOT';
                                        const isPickup = stop.type === 'PICKUP';
                                        const isDelivery = stop.type === 'DELIVERY';

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => zoomToStop(stop.latitude, stop.longitude)}
                                                className={`min-w-[190px] max-w-[210px] p-3.5 rounded-2xl border cursor-pointer hover:scale-[1.02] transition space-y-1.5 text-xs font-sans shrink-0 ${
                                                    isDepot
                                                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                                                        : isPickup
                                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                                        : 'bg-amber-50/60 border-amber-200 text-amber-900'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center font-mono text-[10px] uppercase font-bold">
                                                    <span>Stop #{stop.sequence}</span>
                                                    <span className={`px-2 py-0.5 rounded-full ${
                                                        isDepot ? 'bg-blue-100 text-blue-800' : isPickup ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {stop.type}
                                                    </span>
                                                </div>

                                                <div className="font-bold text-gray-900 text-xs truncate" title={stop.label}>
                                                    {stop.label}
                                                </div>

                                                <div className="text-[11px] text-gray-600 font-mono flex items-center gap-1">
                                                    <Clock size={12} className="text-gray-400" /> ETA: <b>{stop.arrival_hhmm}</b>
                                                </div>

                                                <div className="text-[11px] text-gray-600 font-mono flex items-center gap-1">
                                                    <Package size={12} className="text-gray-400" /> Onboard: <b>{stop.load_after_visit_kg} kg</b>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-400 space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                                    <MapPin size={22} />
                                </div>
                                <p className="text-xs font-sans font-medium text-gray-500">
                                    Click <strong>"Optimize Routes"</strong> to calculate turn-by-turn driver dispatches and arrival ETAs.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Integration Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F172A] text-white border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#34D399] flex items-center justify-center font-bold">
                                    <ExternalLink size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">AgriConnect Route Optimizer REST API</h3>
                                    <p className="text-xs text-gray-400 font-mono">POST {API_BASE_URL}/api/v1/optimize</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="text-gray-400 hover:text-white text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Code Language Tabs */}
                        <div className="flex gap-2 border-b border-white/10 pb-2">
                            {['fetch', 'react', 'curl'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setSnippetLang(lang)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${snippetLang === lang ? 'bg-[#10B981] text-[#022C22]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Code Snippet */}
                        <div className="bg-[#031710] border border-white/10 rounded-2xl p-4 relative font-mono text-xs text-[#A7F3D0] max-h-56 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{getCodeSnippet(snippetLang)}</pre>
                            <button
                                onClick={copySnippet}
                                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg text-[11px] font-sans flex items-center gap-1"
                            >
                                {copiedCode ? <Check size={12} className="text-[#34D399]" /> : <Copy size={12} />}
                                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={downloadPayloadJSON}
                                className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <Download size={14} /> Download Payload JSON
                            </button>
                            <button
                                onClick={() => {
                                    window.print();
                                }}
                                className="bg-[#10B981] hover:bg-[#059669] text-[#022C22] font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                            >
                                <FileText size={14} /> Print Driver Dispatch Sheet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
