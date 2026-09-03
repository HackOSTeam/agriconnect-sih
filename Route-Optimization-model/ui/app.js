/**
 * KisanRoute AI — Frontend Controller & Real-Road Map Visualizer
 * Intelligent Agri-Logistics & Multi-Stop Route Optimization Engine
 */

// Application State
const state = {
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
  use_osrm: true,
  solver_time_limit_seconds: 10,
  lastOptimizationResult: null,
  activeVehicleRouteIndex: 0
};

// Map & Layer references
let map = null;
let markersLayer = null;
let routesLayer = null;
let simMarker = null;
let simInterval = null;

const ROUTE_COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899"];

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  setupEventListeners();
  renderAllInputs();
  fetchPresetsAndInitialize();
});

/* --------------------------------------------------------------------------
   Map Initialization
   -------------------------------------------------------------------------- */
function initMap() {
  map = L.map("map", {
    zoomControl: false,
    attributionControl: false
  }).setView([state.depot.lat, state.depot.lon], 11);

  // 100% Free OpenStreetMap & CartoDB Dark Tiles (No API key required!)
  // If you want to use Mapbox or Google Maps, you can replace the URL below:
  // e.g., Mapbox: `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_KEY`
  const baseTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    subdomains: "abcd",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  baseTiles.addTo(map);

  // Fallback to standard OpenStreetMap if Carto CDN is unreachable
  baseTiles.on("tileerror", function() {
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);
  });

  L.control.zoom({ position: "bottomright" }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  routesLayer = L.layerGroup().addTo(map);

  refreshMapMarkers();
}

/* --------------------------------------------------------------------------
   Event Listeners
   -------------------------------------------------------------------------- */
function setupEventListeners() {
  // Sidebar Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");
    });
  });

  // Preset Selector
  const presetSelect = document.getElementById("presetSelect");
  presetSelect.addEventListener("change", async (e) => {
    const val = e.target.value;
    if (val !== "custom") {
      try {
        const res = await fetch("/api/v1/presets");
        if (res.ok) {
          const presets = await res.json();
          if (presets[val]) {
            loadPayloadIntoState(presets[val].payload);
          }
        }
      } catch (err) {
        console.error("Failed to load preset:", err);
      }
    }
  });

  // Add Item Buttons
  document.getElementById("addFarmerBtn").addEventListener("click", addFarmer);
  document.getElementById("addBuyerBtn").addEventListener("click", addBuyer);
  document.getElementById("addVehicleBtn").addEventListener("click", addVehicle);

  // Optimize Button
  document.getElementById("optimizeBtn").addEventListener("click", runOptimization);

  // Map Tools
  document.getElementById("mapFitBtn").addEventListener("click", fitAllMapBounds);
  document.getElementById("mapSimulateBtn").addEventListener("click", toggleRouteSimulation);

  // Modal Buttons
  const exportModal = document.getElementById("exportModal");
  document.getElementById("exportModalBtn").addEventListener("click", () => {
    updateCodeSnippet("fetch");
    exportModal.classList.remove("hidden");
  });
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    exportModal.classList.add("hidden");
  });
  exportModal.addEventListener("click", (e) => {
    if (e.target === exportModal) exportModal.classList.add("hidden");
  });

  // Code snippet tabs
  document.querySelectorAll(".code-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".code-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateCodeSnippet(btn.getAttribute("data-lang"));
    });
  });

  document.getElementById("copyCodeBtn").addEventListener("click", () => {
    const code = document.getElementById("codeSnippet").innerText;
    navigator.clipboard.writeText(code);
    const copyBtn = document.getElementById("copyCodeBtn");
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Snippet';
    }, 2000);
  });

  document.getElementById("downloadPayloadBtn").addEventListener("click", () => {
    const payload = buildCurrentPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "kisanroute_payload.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  document.getElementById("printItineraryBtn").addEventListener("click", () => {
    window.print();
  });
}

/* --------------------------------------------------------------------------
   Render Inputs & State Binding
   -------------------------------------------------------------------------- */
function renderAllInputs() {
  renderFarmersList();
  renderBuyersList();
  renderVehiclesList();
  renderDepotAndSettings();
  refreshMapMarkers();
}

function renderDepotAndSettings() {
  document.getElementById("depotName").value = state.depot.name;
  document.getElementById("depotId").value = state.depot.id;
  document.getElementById("depotLat").value = state.depot.lat;
  document.getElementById("depotLon").value = state.depot.lon;

  document.getElementById("costPerKm").value = state.cost_per_km;
  document.getElementById("costPerHour").value = state.cost_per_hour;
  document.getElementById("useOsrm").value = state.use_osrm.toString();
  document.getElementById("solverTimeLimit").value = state.solver_time_limit_seconds;

  // Listeners for Depot changes
  ["depotName", "depotId", "depotLat", "depotLon"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.depot.name = document.getElementById("depotName").value;
      state.depot.id = document.getElementById("depotId").value;
      state.depot.lat = parseFloat(document.getElementById("depotLat").value) || state.depot.lat;
      state.depot.lon = parseFloat(document.getElementById("depotLon").value) || state.depot.lon;
      refreshMapMarkers();
    });
  });
}

function renderFarmersList() {
  const container = document.getElementById("farmersList");
  document.getElementById("farmerCount").innerText = state.farmers.length;
  container.innerHTML = "";

  state.farmers.forEach((farmer, idx) => {
    const card = document.createElement("div");
    card.className = "card-item card-glow-emerald";
    card.innerHTML = `
      <div class="card-header-row">
        <span class="card-badge badge-farmer"><i class="fa-solid fa-wheat-awn"></i> ${farmer.farmer_id}</span>
        <div class="card-actions">
          <button class="btn-icon delete-btn" title="Delete Farmer" onclick="removeFarmer(${idx})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Farmer Name / Location</label>
          <input type="text" value="${farmer.name}" onchange="updateFarmer(${idx}, 'name', this.value)" />
        </div>
        <div class="form-group">
          <label>Crop Commodity</label>
          <input type="text" value="${farmer.product}" onchange="updateFarmer(${idx}, 'product', this.value)" />
        </div>
      </div>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Supply (kg)</label>
          <input type="number" value="${farmer.supply_kg}" onchange="updateFarmer(${idx}, 'supply_kg', parseFloat(this.value))" />
        </div>
        <div class="form-group">
          <label>Pickup From</label>
          <input type="text" value="${farmer.pickup_start}" onchange="updateFarmer(${idx}, 'pickup_start', this.value)" />
        </div>
        <div class="form-group">
          <label>Pickup Until</label>
          <input type="text" value="${farmer.pickup_end}" onchange="updateFarmer(${idx}, 'pickup_end', this.value)" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Latitude</label>
          <input type="number" step="0.0001" value="${farmer.lat}" onchange="updateFarmer(${idx}, 'lat', parseFloat(this.value))" />
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input type="number" step="0.0001" value="${farmer.lon}" onchange="updateFarmer(${idx}, 'lon', parseFloat(this.value))" />
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderBuyersList() {
  const container = document.getElementById("buyersList");
  document.getElementById("buyerCount").innerText = state.buyers.length;
  container.innerHTML = "";

  state.buyers.forEach((buyer, idx) => {
    const card = document.createElement("div");
    card.className = "card-item card-glow-purple";
    card.innerHTML = `
      <div class="card-header-row">
        <span class="card-badge badge-buyer"><i class="fa-solid fa-store"></i> ${buyer.buyer_id}</span>
        <div class="card-actions">
          <button class="btn-icon delete-btn" title="Delete Buyer" onclick="removeBuyer(${idx})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Buyer / Mandi Center</label>
          <input type="text" value="${buyer.name}" onchange="updateBuyer(${idx}, 'name', this.value)" />
        </div>
        <div class="form-group">
          <label>Demand Commodity</label>
          <input type="text" value="${buyer.product}" onchange="updateBuyer(${idx}, 'product', this.value)" />
        </div>
      </div>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Demand (kg)</label>
          <input type="number" value="${buyer.demand_kg}" onchange="updateBuyer(${idx}, 'demand_kg', parseFloat(this.value))" />
        </div>
        <div class="form-group">
          <label>Delivery From</label>
          <input type="text" value="${buyer.delivery_start}" onchange="updateBuyer(${idx}, 'delivery_start', this.value)" />
        </div>
        <div class="form-group">
          <label>Delivery By</label>
          <input type="text" value="${buyer.delivery_end}" onchange="updateBuyer(${idx}, 'delivery_end', this.value)" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Latitude</label>
          <input type="number" step="0.0001" value="${buyer.lat}" onchange="updateBuyer(${idx}, 'lat', parseFloat(this.value))" />
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input type="number" step="0.0001" value="${buyer.lon}" onchange="updateBuyer(${idx}, 'lon', parseFloat(this.value))" />
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderVehiclesList() {
  const container = document.getElementById("vehiclesList");
  container.innerHTML = "";

  state.vehicles.forEach((vehicle, idx) => {
    const row = document.createElement("div");
    row.className = "vehicle-row-item";
    row.innerHTML = `
      <div>
        <strong style="color: #60a5fa;"><i class="fa-solid fa-truck"></i> ${vehicle.vehicle_id}</strong>
        <span style="color: var(--text-muted); margin-left: 8px;">Capacity: </span>
        <input type="number" value="${vehicle.capacity_kg}" style="width: 72px; background: rgba(0,0,0,0.4); border:1px solid var(--border-medium); color:#fff; padding:3px 6px; border-radius:4px;" onchange="updateVehicle(${idx}, 'capacity_kg', parseFloat(this.value))" /> kg
      </div>
      <div>
        <button class="btn-icon" onclick="removeVehicle(${idx})" title="Remove vehicle"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
    container.appendChild(row);
  });
}

/* --------------------------------------------------------------------------
   State Modification Helpers (Exposed to Window)
   -------------------------------------------------------------------------- */
window.updateFarmer = (idx, key, val) => {
  state.farmers[idx][key] = val;
  refreshMapMarkers();
};

window.removeFarmer = (idx) => {
  if (state.farmers.length <= 1) return alert("Must keep at least 1 farmer.");
  state.farmers.splice(idx, 1);
  renderFarmersList();
  refreshMapMarkers();
};

window.updateBuyer = (idx, key, val) => {
  state.buyers[idx][key] = val;
  refreshMapMarkers();
};

window.removeBuyer = (idx) => {
  if (state.buyers.length <= 1) return alert("Must keep at least 1 buyer.");
  state.buyers.splice(idx, 1);
  renderBuyersList();
  refreshMapMarkers();
};

window.updateVehicle = (idx, key, val) => {
  state.vehicles[idx][key] = val;
};

window.removeVehicle = (idx) => {
  if (state.vehicles.length <= 1) return alert("Must keep at least 1 vehicle.");
  state.vehicles.splice(idx, 1);
  renderVehiclesList();
};

function addFarmer() {
  const nextId = `F${(state.farmers.length + 1).toString().padStart(2, '0')}`;
  state.farmers.push({
    farmer_id: nextId,
    name: `Farmer (${nextId})`,
    lat: +(state.depot.lat + (Math.random() - 0.5) * 0.14).toFixed(4),
    lon: +(state.depot.lon + (Math.random() - 0.5) * 0.14).toFixed(4),
    product: state.farmers[0]?.product || "Tomato",
    supply_kg: 150,
    pickup_start: "06:00",
    pickup_end: "11:00",
    service_min: 15
  });
  renderFarmersList();
  refreshMapMarkers();
}

function addBuyer() {
  const nextId = `B${(state.buyers.length + 1).toString().padStart(2, '0')}`;
  state.buyers.push({
    buyer_id: nextId,
    name: `Buyer Mandi (${nextId})`,
    lat: +(state.depot.lat + (Math.random() - 0.5) * 0.14).toFixed(4),
    lon: +(state.depot.lon + (Math.random() - 0.5) * 0.14).toFixed(4),
    product: state.buyers[0]?.product || "Tomato",
    demand_kg: 150,
    delivery_start: "09:00",
    delivery_end: "14:00",
    service_min: 20
  });
  renderBuyersList();
  refreshMapMarkers();
}

function addVehicle() {
  const nextId = `V${(state.vehicles.length + 1).toString().padStart(2, '0')}`;
  state.vehicles.push({
    vehicle_id: nextId,
    capacity_kg: 350,
    max_route_min: 540,
    fixed_cost: 300.0
  });
  renderVehiclesList();
}

/* --------------------------------------------------------------------------
   Map Refresh & Marker Rendering
   -------------------------------------------------------------------------- */
function refreshMapMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const bounds = [];

  // Depot Marker
  const depotIcon = L.divIcon({
    className: "custom-map-marker marker-depot",
    html: '<i class="fa-solid fa-warehouse"></i>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
  const depotMarker = L.marker([state.depot.lat, state.depot.lon], { icon: depotIcon })
    .bindPopup(`<b>${state.depot.name}</b><br/><span style="color:#60a5fa; font-weight:600;">Central Dispatch Hub (${state.depot.id})</span>`);
  markersLayer.addLayer(depotMarker);
  bounds.push([state.depot.lat, state.depot.lon]);

  // Farmer Markers
  state.farmers.forEach(f => {
    const farmerIcon = L.divIcon({
      className: "custom-map-marker marker-farmer",
      html: '<i class="fa-solid fa-wheat-awn"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    const marker = L.marker([f.lat, f.lon], { icon: farmerIcon })
      .bindPopup(`<b>${f.name}</b><br/>Commodity: <strong>${f.product}</strong><br/>Supply: <span style="color:#34d399; font-weight:700;">+${f.supply_kg} kg</span><br/>Window: ${f.pickup_start} - ${f.pickup_end}`);
    markersLayer.addLayer(marker);
    bounds.push([f.lat, f.lon]);
  });

  // Buyer Markers
  state.buyers.forEach(b => {
    const buyerIcon = L.divIcon({
      className: "custom-map-marker marker-buyer",
      html: '<i class="fa-solid fa-store"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    const marker = L.marker([b.lat, b.lon], { icon: buyerIcon })
      .bindPopup(`<b>${b.name}</b><br/>Demands: <strong>${b.product}</strong><br/>Demand: <span style="color:#fbbf24; font-weight:700;">-${b.demand_kg} kg</span><br/>Deadline: ${b.delivery_start} - ${b.delivery_end}`);
    markersLayer.addLayer(marker);
    bounds.push([b.lat, b.lon]);
  });

  if (bounds.length > 0 && !state.lastOptimizationResult) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function fitAllMapBounds() {
  const allCoords = [];
  allCoords.push([state.depot.lat, state.depot.lon]);
  state.farmers.forEach(f => allCoords.push([f.lat, f.lon]));
  state.buyers.forEach(b => allCoords.push([b.lat, b.lon]));

  if (state.lastOptimizationResult) {
    state.lastOptimizationResult.routes.forEach(r => {
      if (r.geometry_geojson) r.geometry_geojson.forEach(c => allCoords.push(c));
    });
  }

  if (allCoords.length > 0) {
    map.fitBounds(allCoords, { padding: [40, 40] });
  }
}

/* --------------------------------------------------------------------------
   Payload Builder
   -------------------------------------------------------------------------- */
function buildCurrentPayload() {
  return {
    depot: {
      id: state.depot.id,
      name: state.depot.name,
      lat: parseFloat(state.depot.lat),
      lon: parseFloat(state.depot.lon)
    },
    farmers: state.farmers.map(f => ({
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
    buyers: state.buyers.map(b => ({
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
    vehicles: state.vehicles.map(v => ({
      vehicle_id: v.vehicle_id,
      capacity_kg: parseFloat(v.capacity_kg),
      max_route_min: parseInt(v.max_route_min) || 540,
      fixed_cost: parseFloat(v.fixed_cost) || 300.0
    })),
    cost_per_km: parseFloat(document.getElementById("costPerKm").value) || 12.0,
    cost_per_hour: parseFloat(document.getElementById("costPerHour").value) || 80.0,
    use_osrm: document.getElementById("useOsrm").value === "true",
    solver_time_limit_seconds: parseInt(document.getElementById("solverTimeLimit").value) || 10
  };
}

/* --------------------------------------------------------------------------
   Run Optimization Pipeline
   -------------------------------------------------------------------------- */
async function runOptimization() {
  const loader = document.getElementById("solverLoader");
  loader.classList.remove("hidden");

  const payload = buildCurrentPayload();

  try {
    const response = await fetch("/api/v1/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || "Optimization failed");
    }

    const result = await response.json();
    state.lastOptimizationResult = result;

    renderOptimizationResults(result);

  } catch (err) {
    alert(`Optimization Error:\n${err.message}`);
  } finally {
    loader.classList.add("hidden");
  }
}

/* --------------------------------------------------------------------------
   Render Results: Animated KPIs, Glowing Real Road Polylines, Manifest
   -------------------------------------------------------------------------- */
function renderOptimizationResults(result) {
  const { kpis, routes } = result;

  // 1. Update KPIs with count-up animation
  animateValue("valVehicles", `${kpis.vehicles_used} / ${state.vehicles.length}`);
  document.getElementById("valVehiclesSub").innerText = `${routes.length} Active Route(s) Deployed`;

  animateValue("valDistance", `${kpis.total_distance_km} km`);
  document.getElementById("valDistanceSaved").innerHTML = `<i class="fa-solid fa-bolt text-emerald"></i> ${kpis.distance_saved_pct}% Saved vs Baseline`;

  animateValue("valCost", `₹ ${kpis.estimated_transport_cost_inr.toLocaleString('en-IN')}`);
  document.getElementById("valCostPerKg").innerText = `₹ ${kpis.cost_per_kg_inr} / kg cargo`;

  animateValue("valUtilization", `${kpis.capacity_utilization_pct}%`);
  document.getElementById("valGoodsKg").innerText = `${kpis.total_goods_kg} kg transported`;

  // Spark bars
  document.getElementById("sparkVehicles").style.width = `${Math.min(100, (kpis.vehicles_used / state.vehicles.length) * 100)}%`;
  document.getElementById("sparkDistance").style.width = `${Math.min(100, kpis.distance_saved_pct)}%`;
  document.getElementById("sparkCost").style.width = "75%";
  document.getElementById("sparkUtilization").style.width = `${Math.min(100, kpis.capacity_utilization_pct)}%`;

  // 2. Draw Glowing Real Road Polylines
  routesLayer.clearLayers();
  const allRouteCoords = [];

  routes.forEach((route, idx) => {
    const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
    const coords = (route.geometry_geojson && route.geometry_geojson.length > 0)
      ? route.geometry_geojson
      : route.stops.map(s => [s.latitude, s.longitude]);

    // Outer Neon Glow Polyline
    const glowLine = L.polyline(coords, {
      color: color,
      weight: 9,
      opacity: 0.38,
      lineCap: 'round'
    });

    // Inner Crisp Sharp Polyline
    const routeLine = L.polyline(coords, {
      color: color,
      weight: 4,
      opacity: 0.95,
      lineCap: 'round'
    }).bindPopup(`<b>Vehicle ${route.vehicle_id}</b><br/>Distance: ${route.distance_km} km<br/>Travel Time: ${route.travel_time_min} min<br/>Est. Cost: ₹${route.estimated_cost_inr}`);

    routesLayer.addLayer(glowLine);
    routesLayer.addLayer(routeLine);

    coords.forEach(c => allRouteCoords.push(c));
  });

  if (allRouteCoords.length > 0) {
    map.fitBounds(allRouteCoords, { padding: [50, 50] });
  }

  // 3. Render Vehicle Route Tabs and Stops Timeline
  renderVehicleTabs(routes);
  showVehicleItinerary(0);
}

function animateValue(elemId, finalVal) {
  const elem = document.getElementById(elemId);
  elem.style.transform = "scale(1.15)";
  elem.style.color = "#34d399";
  elem.innerText = finalVal;
  setTimeout(() => {
    elem.style.transform = "scale(1.0)";
    elem.style.color = "";
  }, 350);
}

function renderVehicleTabs(routes) {
  const tabsContainer = document.getElementById("vehicleRouteTabs");
  tabsContainer.innerHTML = "";

  routes.forEach((r, idx) => {
    const btn = document.createElement("button");
    btn.className = `v-tab-btn ${idx === 0 ? 'active' : ''}`;
    btn.innerHTML = `<i class="fa-solid fa-truck-moving"></i> Truck ${r.vehicle_id} (${r.distance_km} km)`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".v-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showVehicleItinerary(idx);
    });
    tabsContainer.appendChild(btn);
  });
}

function showVehicleItinerary(routeIdx) {
  const container = document.getElementById("routeStopsTimeline");
  container.innerHTML = "";

  const route = state.lastOptimizationResult?.routes[routeIdx];
  if (!route) return;

  route.stops.forEach((stop, idx) => {
    const card = document.createElement("div");
    let stopClass = "stop-depot";
    let icon = "fa-warehouse";

    if (stop.type === "PICKUP") {
      stopClass = "stop-pickup";
      icon = "fa-wheat-awn";
    } else if (stop.type === "DELIVERY") {
      stopClass = "stop-delivery";
      icon = "fa-store";
    }

    card.className = `stop-card ${stopClass}`;
    card.innerHTML = `
      <div class="stop-seq">Stop #${stop.sequence} • ${stop.type}</div>
      <div class="stop-name" title="${stop.label}"><i class="fa-solid ${icon}"></i> ${stop.label}</div>
      <div class="stop-eta"><i class="fa-regular fa-clock"></i> ETA: ${stop.arrival_hhmm}</div>
      <div class="stop-load"><i class="fa-solid fa-weight-hanging"></i> Onboard: <strong>${stop.load_after_visit_kg} kg</strong></div>
    `;

    card.addEventListener("click", () => {
      map.setView([stop.latitude, stop.longitude], 14, { animate: true });
    });

    container.appendChild(card);

    if (idx < route.stops.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "timeline-arrow";
      arrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      container.appendChild(arrow);
    }
  });
}

/* --------------------------------------------------------------------------
   Route Playback Simulation
   -------------------------------------------------------------------------- */
function toggleRouteSimulation() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    if (simMarker) {
      map.removeLayer(simMarker);
      simMarker = null;
    }
    document.getElementById("mapSimulateBtn").innerHTML = '<i class="fa-solid fa-play"></i>';
    return;
  }

  const routes = state.lastOptimizationResult?.routes;
  if (!routes || routes.length === 0) {
    alert("Please optimize routes first before running simulation.");
    return;
  }

  const coords = routes[0].geometry_geojson || routes[0].stops.map(s => [s.latitude, s.longitude]);
  if (!coords || coords.length === 0) return;

  let step = 0;
  const truckIcon = L.divIcon({
    className: "vehicle-sim-marker",
    html: '<i class="fa-solid fa-truck"></i>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  simMarker = L.marker(coords[0], { icon: truckIcon }).addTo(map);
  document.getElementById("mapSimulateBtn").innerHTML = '<i class="fa-solid fa-pause"></i>';

  simInterval = setInterval(() => {
    step++;
    if (step >= coords.length) {
      step = 0;
    }
    simMarker.setLatLng(coords[step]);
  }, 80);
}

/* --------------------------------------------------------------------------
   Presets Loading
   -------------------------------------------------------------------------- */
async function fetchPresetsAndInitialize() {
  try {
    const res = await fetch("/api/v1/presets");
    if (res.ok) {
      const presets = await res.json();
      if (presets.pune_cluster) {
        loadPayloadIntoState(presets.pune_cluster.payload);
      }
    }
  } catch (err) {
    console.warn("Presets API not reachable, using default state.");
  }
}

function loadPayloadIntoState(payload) {
  state.depot = payload.depot;
  state.farmers = payload.farmers;
  state.buyers = payload.buyers;
  state.vehicles = payload.vehicles;
  state.cost_per_km = payload.cost_per_km;
  state.cost_per_hour = payload.cost_per_hour;
  state.use_osrm = payload.use_osrm;
  state.solver_time_limit_seconds = payload.solver_time_limit_seconds;
  state.lastOptimizationResult = null;

  renderAllInputs();
}

/* --------------------------------------------------------------------------
   Integration Code Generator
   -------------------------------------------------------------------------- */
function updateCodeSnippet(lang) {
  const snippetElem = document.getElementById("codeSnippet");
  const payload = buildCurrentPayload();

  if (lang === "fetch") {
    snippetElem.innerText = `// 🚀 Call KisanRoute AI from your frontend
const response = await fetch("http://localhost:8000/api/v1/optimize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)})
});

const data = await response.json();
console.log("Optimized Routes:", data.routes);
console.log("KPIs:", data.kpis);`;
  } else if (lang === "react") {
    snippetElem.innerText = `// ⚛️ React Integration Hook
import React, { useState } from 'react';

export function RouteOptimizerComponent() {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);

  const optimizeRoutes = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:8000/api/v1/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(${JSON.stringify(payload, null, 2)})
    });
    const data = await res.json();
    setRoutes(data.routes);
    setLoading(false);
  };

  return (
    <button onClick={optimizeRoutes} disabled={loading}>
      {loading ? "Calculating Best Path..." : "⚡ Optimize Logistics Routes"}
    </button>
  );
}`;
  } else {
    snippetElem.innerText = `curl -X POST "http://localhost:8000/api/v1/optimize" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;
  }
}
