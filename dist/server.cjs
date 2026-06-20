var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_vite = require("vite");

// backend/routes.ts
var import_express = require("express");

// backend/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DB_FILE = import_path.default.join(process.cwd(), "zipride_db.json");
var INITIAL_DB = {
  drivers: [],
  rides: [],
  disputes: [],
  config: {
    weather: "Clear",
    traffic: "Light"
  },
  alerts: [],
  sosAlerts: []
};
var FileDatabase = class {
  constructor() {
    this.data = { ...INITIAL_DB };
    this.load();
  }
  load() {
    try {
      if (import_fs.default.existsSync(DB_FILE)) {
        const fileContent = import_fs.default.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        if (!this.data.drivers || this.data.drivers.length === 0) {
          this.data.drivers = [...INITIAL_DB.drivers];
        } else {
          this.data.drivers = this.data.drivers.filter((d) => !["DRV001", "DRV002", "DRV003"].includes(d.id));
          this.data.drivers.forEach((d) => {
            if (!d.phone) d.phone = "+91 9876543210";
            if (!d.vehicleType) d.vehicleType = "Bike";
            if (!d.location) d.location = { lat: 13.0827, lng: 80.2707 };
          });
        }
        if (this.data.rides) {
          this.data.rides.forEach((r) => {
            if (!r.riderName) {
              r.riderName = "Saran";
            }
            if (!r.driverName && r.driverId) {
              const driver = this.data.drivers.find((d) => d.id === r.driverId);
              if (driver) {
                r.driverName = driver.name;
              }
            }
          });
        }
        if (!this.data.config) {
          this.data.config = { ...INITIAL_DB.config };
        }
        if (!this.data.disputes) {
          this.data.disputes = [];
        }
        if (!this.data.alerts) {
          this.data.alerts = [];
        }
        if (!this.data.sosAlerts) {
          this.data.sosAlerts = [];
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load JSON database, using in-memory state:", e);
    }
  }
  save() {
    try {
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save JSON database:", e);
    }
  }
  reload() {
    this.load();
  }
  patchMissingRiderNames(defaultName = "Saran") {
    let patched = 0;
    this.data.rides.forEach((r) => {
      if (!r.riderName) {
        r.riderName = defaultName;
        patched++;
      }
    });
    if (patched > 0) {
      this.save();
      console.log(`[DB] Auto-patched ${patched} rides with riderName: '${defaultName}'`);
    }
    return patched;
  }
  getDrivers() {
    return this.data.drivers;
  }
  getRides() {
    return this.data.rides;
  }
  getDisputes() {
    return this.data.disputes;
  }
  getConfig() {
    return this.data.config;
  }
  getAlerts() {
    return this.data.alerts;
  }
  setConfig(weather, traffic) {
    this.data.config = { weather, traffic };
    this.save();
  }
  addRide(ride) {
    this.data.rides.push(ride);
    this.save();
  }
  updateRide(updatedRide) {
    this.data.rides = this.data.rides.map((r) => r.id === updatedRide.id ? updatedRide : r);
    this.save();
  }
  addDispute(dispute) {
    this.data.disputes.push(dispute);
    this.save();
  }
  updateDispute(updatedDispute) {
    this.data.disputes = this.data.disputes.map((d) => d.id === updatedDispute.id ? updatedDispute : d);
    this.save();
  }
  getSosAlerts() {
    if (!this.data.sosAlerts) this.data.sosAlerts = [];
    return this.data.sosAlerts;
  }
  addSosAlert(sos) {
    if (!this.data.sosAlerts) this.data.sosAlerts = [];
    this.data.sosAlerts.push(sos);
    this.save();
  }
  updateSosAlert(updatedSosAlert) {
    if (!this.data.sosAlerts) this.data.sosAlerts = [];
    this.data.sosAlerts = this.data.sosAlerts.map((s) => s.id === updatedSosAlert.id ? updatedSosAlert : s);
    this.save();
  }
  addAlert(alert) {
    this.data.alerts.unshift(alert);
    if (this.data.alerts.length > 200) {
      this.data.alerts = this.data.alerts.slice(0, 200);
    }
    this.save();
  }
  clearRides() {
    this.data.rides = [];
    this.data.disputes = [];
    this.data.alerts = [];
    this.data.sosAlerts = [];
    this.save();
  }
  clearAll() {
    this.data = {
      drivers: [...INITIAL_DB.drivers],
      rides: [],
      disputes: [],
      config: { weather: "Clear", traffic: "Light" },
      alerts: [],
      sosAlerts: []
    };
    this.save();
  }
};
var db = new FileDatabase();

// backend/gemini.ts
var import_genai = require("@google/genai");
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Mock fallback will be used.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function summarizeDispute(rideSummary) {
  const prompt = `You are ZipRide's Lead Dispute Analyst. Review this ride's details, telemetries, and the user's filed dispute complaint.
Provide a clear, brief, structured analysis of the dispute as bullet points:
- Analysis of the incident (highlight weather, traffic, and dynamic price factors)
- Assessment of driver behavior (specifically overspeeding [${rideSummary.overspeedEvents} times] and harsh braking [${rideSummary.harshBrakeEvents} times] relative to safety rules)
- Pricing/cost adjustment log (explain why the price dropped from \u20B9${rideSummary.initialFare.toFixed(2)} to \u20B9${rideSummary.finalFare.toFixed(2)} based on behavioral discounts)
- Final Ops Recommendation (Confirm refund/resolution status)

Ride Details:
Pickup: ${rideSummary.pickup}
Drop: ${rideSummary.drop}
Driver: ${rideSummary.driverName}
Weather Condition during ride: ${rideSummary.weather}
Traffic congestion level: ${rideSummary.traffic}
Initial Fare: \u20B9${rideSummary.initialFare.toFixed(2)}
Final Charged Fare: \u20B9${rideSummary.finalFare.toFixed(2)}
Overspeeding Events: ${rideSummary.overspeedEvents}
Harsh Braking EventsCount: ${rideSummary.harshBrakeEvents}
Final Safety Score: ${rideSummary.safetyScore}%
Rider's Filed Dispute Complaint: "${rideSummary.userStateReason}"`;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getMockDisputeSummary(rideSummary);
    }
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });
    return response.text || getMockDisputeSummary(rideSummary);
  } catch (error) {
    console.error("Gemini API dispute summary failed, falling back to mock:", error);
    return getMockDisputeSummary(rideSummary);
  }
}
async function askGeminiAssist(question, history, context) {
  const systemInstruction = `You are the ZipRide RideMate Companion\u2014an intelligent, friendly, and travel-focused AI assistant that acts as a real-time ride companion for passengers, drivers, and operations.

ZipRide Safety & Surcharge Policy Rules:
1. Base Fare: \u20B920.00, Per-KM: \u20B912.00, Per-Minute: \u20B91.50
2. Weather base surcharges: Overcast (+\u20B910, limit 75km/h), High Winds (+\u20B920, limit 65km/h), Heavy Rain (+\u20B930, limit 60km/h), Monsoon Storm (+\u20B950, limit 50km/h).
3. Traffic multipliers: Light (1.0x), Moderate (1.1x multiplier, ETA 1.3x), Heavy Congestion (1.3x multiplier, ETA 1.8x), Gridlock (1.5x multiplier, ETA 2.5x).
4. Behavior deductions: Overspeeding past ceiling triggers -\u20B915 dynamic discount. Harsh braking triggers -\u20B910 dynamic discount. Deductions are subtracted directly from fare.

Active Safety Modes & Protocols:
- Child Safety Mode: Requires a 4-digit pickup verification code to start the ride, and guardian arrival confirmation at the drop destination. Always display the pickup verification PIN if this mode is ACTIVE and the user asks about it.
- Women Safety Mode: Performs GPS deviation tracking (>350m threshold). Guardians receive automatic route alerts on warning triggers.
- Family Safety Mode: Shares live tracking links and broadcasts vehicle coordinates to synced emergency contacts.

Formatting Instructions:
- Keep answers friendly, travel-focused, and highly contextual.
- If the user uses Tamil or Tanglish (Tamil-English mix), respond in a friendly mixed Tanglish/English style.
- If you notice dynamic issues (weather storm, high traffic, low safety score, or route deviations), proactively recommend actions.
- For safety status queries, always display a scorecard in this exact format:
  Safety Score: [score]%
  Traffic Risk: [Low/Medium/High]
  Weather Risk: [Low/Medium/High]
  Driver Rating: [rating]
  Recommendation: [recommendation]
- Include Smart Action Alert Cards using these exact tags on their own line:
  [ALERT: WEATHER] Description
  [ALERT: TRAFFIC] Description
  [ALERT: SAFETY] Description
- Suggest actions using these exact tags on their own line:
  [SUGGESTION: SHOW_SAFER_ROUTE] Label
  [SUGGESTION: REDUCE_FARE] Label
  [SUGGESTION: TRACK_DRIVER] Label
  [SUGGESTION: EMERGENCY_HELP] Label

Rely heavily on the Active State Grounding Context provided. Prioritize giving specific recommendations (like switching routes, warning limits, safety PINs, or emergency alerts) over general explanations.`;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getMockAssistAnswer(question, context);
    }
    const client = getGeminiClient();
    const pastChats = history.map((h) => ({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: h.parts[0].text }]
    }));
    const contents = [
      { role: "user", parts: [{ text: systemInstruction + (context ? `

Active State Grounding Context:
${context}` : "") }] },
      ...pastChats,
      { role: "user", parts: [{ text: question }] }
    ];
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        temperature: 0.5
      }
    });
    return response.text || getMockAssistAnswer(question, context);
  } catch (error) {
    console.error("Gemini API assist assistant failed:", error);
    return getMockAssistAnswer(question, context);
  }
}
function getMockDisputeSummary(ride) {
  return `### **ZipRide Automated Operations Dispute Analysis (AI Fallback)**

- **Weather & Traffic Surcharges**: Reviewed. Ride operated during **${ride.weather}** with **${ride.traffic}** traffic. The initial base fare of \u20B9${ride.initialFare.toFixed(2)} correctly factored environment surcharges.
- **Safety Telemetry Review**: 
  - **Overspeeding Events**: ${ride.overspeedEvents} warnings issued. Driver exceeded safe guidelines.
  - **Harsh Braking Events**: ${ride.harshBrakeEvents} sudden safety stops registered.
- **Cost Adjustments Log**: Real-time telemetry flagged ${ride.overspeedEvents + ride.harshBrakeEvents} behavioral violations. Combined safety discounts successfully dropped the final client fare to **\u20B9${ride.finalFare.toFixed(2)}** (a total safety discount of \u20B9${(ride.initialFare - ride.finalFare).toFixed(2)} was credited).
- **Executive Recommendation**: Complaint is **VALID**. The safety score of **${ride.safetyScore}%** warrants processing a final full fare lock, and warning the driver (ID: Rajesh Kumar) for reckless transit behavior. No further refund is required as the safety discount was already subtracted in real-time.`;
}
function parseGroundedContext(context) {
  const result = {
    weather: "Clear",
    traffic: "Light",
    currentUser: "Saran",
    role: "passenger",
    activeRide: null,
    routes: [],
    driverRating: 4.8
  };
  if (!context) return result;
  const weatherMatch = context.match(/System Weather configuration:\s*([^,]+)/i);
  if (weatherMatch) result.weather = weatherMatch[1].trim();
  const trafficMatch = context.match(/Traffic:\s*([^\.]+)/i);
  if (trafficMatch) result.traffic = trafficMatch[1].trim();
  const userMatch = context.match(/Current user:\s*([^,]+)/i);
  if (userMatch) result.currentUser = userMatch[1].trim();
  if (context.includes("Active Ride:")) {
    const getVal = (regex, def = "") => {
      const m = context.match(regex);
      return m ? m[1].trim() : def;
    };
    result.activeRide = {
      id: getVal(/Ride ID:\s*([^\n]+)/i),
      pickup: getVal(/Pickup:\s*([^\n]+)/i),
      drop: getVal(/Drop:\s*([^\n]+)/i),
      status: getVal(/Status:\s*([^\n]+)/i),
      driverName: getVal(/Driver Name:\s*([^\n]+)/i, "Rajesh Kumar"),
      riderName: getVal(/Rider Name:\s*([^\n]+)/i, "Saran"),
      vehicleType: getVal(/Vehicle Type:\s*([^\n]+)/i, "Bike"),
      initialFare: parseFloat(getVal(/Dynamic Fare:\s*Initial\s*₹([\d\.]+)/i, "0")),
      finalFare: parseFloat(getVal(/Dynamic Fare:.*Final\s*charged\s*₹([\d\.]+)/i, "0")),
      speed: parseFloat(getVal(/Speed:\s*([\d\.]+)/i, "0")),
      safetyScore: parseFloat(getVal(/Safety Score:\s*([\d\.]+)/i, "100")),
      overspeedEvents: parseInt(getVal(/Overspeed Events:\s*(\d+)/i, "0")),
      harshBrakeEvents: parseInt(getVal(/Harsh Braking:\s*(\d+)/i, "0")),
      paymentStatus: getVal(/Payment Status:\s*([^\n]+)/i, "Pending"),
      hasActiveSOS: getVal(/Active SOS Flag:\s*([^\n]+)/i).toLowerCase() === "yes",
      isChildSafety: getVal(/Child Safety Mode:\s*([^\n]+)/i).toLowerCase() === "active",
      isWomenSafety: getVal(/Women Safety Mode:\s*([^\n]+)/i).toLowerCase() === "active",
      isFamilySafety: getVal(/Family Safety Mode:\s*([^\n]+)/i).toLowerCase() === "active",
      pickupCode: getVal(/Pickup Verification PIN:\s*([^\n]+)/i, "N/A"),
      childArrivalConfirmed: getVal(/Child Arrival Confirmed by Guardian:\s*([^\n]+)/i).toLowerCase() === "yes"
    };
  }
  const routeLines = context.split("\n");
  routeLines.forEach((line) => {
    const routeMatch = line.match(/-\s*Route\s*(\d+):\s*([^\.\(]+)(?:\s*\((Selected)\))?\.\s*ETA:\s*([\d\.]+)\s*mins,\s*Distance:\s*([\d\.]+)\s*km,\s*Traffic\s*Score:\s*(\d+)\/100,\s*Fuel:\s*([\d\.]+)L,\s*Road\s*Health:\s*(\d+)\/100/i);
    if (routeMatch) {
      const reliabilityMatch = line.match(/Reliability\s*Score:\s*(\d+)%/i);
      result.routes.push({
        name: routeMatch[2].trim(),
        durationMin: parseFloat(routeMatch[4]),
        distanceKm: parseFloat(routeMatch[5]),
        trafficScore: parseInt(routeMatch[6]),
        fuelUsageLiters: parseFloat(routeMatch[7]),
        roadHealthScore: parseInt(routeMatch[8]),
        reliabilityScore: reliabilityMatch ? parseInt(reliabilityMatch[1]) : 90,
        isSelected: !!routeMatch[3]
      });
    }
  });
  const ratingMatch = context.match(/Driver Reputation \/ Rating:\s*([\d\.]+)/i);
  if (ratingMatch) result.driverRating = parseFloat(ratingMatch[1]);
  return result;
}
function getMockAssistAnswer(question, context) {
  const q = question.toLowerCase();
  const state = parseGroundedContext(context);
  if (q.includes("safe") || q.includes("safety") || q.includes("risk") || q.includes("accident") || q.includes("danger") || q.includes("child") || q.includes("women") || q.includes("family") || q.includes("pin") || q.includes("code")) {
    const score = state.activeRide ? state.activeRide.safetyScore : 100;
    const weather2 = state.weather;
    const traffic2 = state.traffic;
    const rating2 = state.driverRating;
    let weatherRisk = "Low";
    if (weather2 === "Heavy Rain" || weather2 === "High Winds") weatherRisk = "Medium";
    else if (weather2 === "Monsoon Storm") weatherRisk = "High";
    let trafficRisk = "Low";
    if (traffic2 === "Heavy Congestion") trafficRisk = "Medium";
    else if (traffic2 === "Gridlock") trafficRisk = "High";
    let recommendation = "Your ride appears safe. The driver status checks out fine.";
    if (state.activeRide?.hasActiveSOS) {
      recommendation = "An active emergency SOS has been triggered! PCR emergency dispatch is routing to your position.";
    } else if (score < 75) {
      recommendation = "Reckless driver behavior detected. Speed limit cap has been activated. Switch to Route 2 for safety.";
    } else if (weatherRisk === "High" || weatherRisk === "Medium") {
      recommendation = "Inclement weather hazards reported near destination. Driver speed has been capped for traction.";
    }
    let safetyDetails = "";
    if (state.activeRide) {
      if (state.activeRide.isChildSafety) {
        safetyDetails += `
\u{1F512} **Child Safety Mode is ACTIVE** for this trip. Guardian pre-approval is verified. The pickup verification code is **${state.activeRide.pickupCode}** (share this with the driver only at pickup).`;
      }
      if (state.activeRide.isWomenSafety) {
        safetyDetails += `
\u{1F6E1}\uFE0F **Women Safety Mode is ACTIVE**. GPS Geofence deviation monitoring (>350m) is active. Guardian SMS tracking link is shared.`;
      }
      if (state.activeRide.isFamilySafety) {
        safetyDetails += `
\u{1F46A} **Family Safety Mode is ACTIVE**. Live location sharing broadcasts are running.`;
      }
      if (!state.activeRide.isChildSafety && !state.activeRide.isWomenSafety && !state.activeRide.isFamilySafety) {
        safetyDetails += `
\u2139\uFE0F Travel safety modes are currently inactive. You can toggle Child/Women/Family safe modes in settings or during booking.`;
      }
    }
    const safetyCard = `Safety Score: ${score}%

Traffic Risk: ${trafficRisk}
Weather Risk: ${weatherRisk}
Driver Rating: ${rating2}

Recommendation:
${recommendation}${safetyDetails}

[ALERT: SAFETY] Safety Insight - GPS Geofencing active.
[ALERT: WEATHER] Weather Risk - ${weatherRisk === "Low" ? "Normal weather conditions." : "Inclement weather guidelines active."}`;
    const emergencySug = "[SUGGESTION: EMERGENCY_HELP] Emergency Help";
    const trackSug = "[SUGGESTION: TRACK_DRIVER] Track Driver";
    const routeSug = "[SUGGESTION: SHOW_SAFER_ROUTE] Show Safer Route";
    return `${safetyCard}

${routeSug}
${trackSug}
${emergencySug}`;
  }
  if (q.includes("fare") || q.includes("surcharge") || q.includes("price") || q.includes("cost") || q.includes("increase") || q.includes("fee") || q.includes("charge")) {
    const active = state.activeRide;
    const initial = active ? active.initialFare : 50;
    const final = active ? active.finalFare : 50;
    let weatherFee = 0;
    if (state.weather === "Overcast") weatherFee = 10;
    else if (state.weather === "High Winds") weatherFee = 20;
    else if (state.weather === "Heavy Rain") weatherFee = 30;
    else if (state.weather === "Monsoon Storm") weatherFee = 50;
    let trafficMult = "1.0x";
    if (state.traffic === "Moderate") trafficMult = "1.1x";
    else if (state.traffic === "Heavy Congestion") trafficMult = "1.3x";
    else if (state.traffic === "Gridlock") trafficMult = "1.5x";
    const overspeedDiscount = active ? active.overspeedEvents * 15 : 0;
    const harshDiscount = active ? active.harshBrakeEvents * 10 : 0;
    let recommendation = "Your fare increased due to weather and traffic conditions. To minimize costs, maintain safe speeds to qualify for compliance discounts.";
    if (overspeedDiscount > 0 || harshDiscount > 0) {
      recommendation = `Behavioral discounts applied: -\u20B9${overspeedDiscount + harshDiscount} due to driving exceptions.`;
    }
    const fareBreakdown = `Base Fare: \u20B920.00
Weather Surcharge: +\u20B9${weatherFee.toFixed(2)} (${state.weather})
Traffic Multiplier: ${trafficMult} (${state.traffic})
Driver Safety Penalties: -\u20B9${(overspeedDiscount + harshDiscount).toFixed(2)}

Recommendation:
${recommendation}

[ALERT: TRAFFIC] Surcharge Active - Traffic multiplier is ${trafficMult}.
[ALERT: WEATHER] Weather Fee - Weather fee is +\u20B9${weatherFee}.`;
    const routeSug = "[SUGGESTION: SHOW_SAFER_ROUTE] Show Safer Route";
    const reduceSug = "[SUGGESTION: REDUCE_FARE] Learn Surcharges";
    return `${fareBreakdown}

${routeSug}
${reduceSug}`;
  }
  if (q.includes("traffic") || q.includes("route") || q.includes("eta") || q.includes("delay") || q.includes("congestion") || q.includes("best route") || q.includes("road")) {
    let routeDetails = "Route Options Analysed:\n";
    if (state.routes.length > 0) {
      state.routes.forEach((r, idx) => {
        routeDetails += `- Route ${idx + 1}: ${r.name} (${r.durationMin} mins, ${r.distanceKm} km, Road Health: ${r.roadHealthScore}/100)
`;
      });
    } else {
      routeDetails += "- Route 1: NH Highway Freeway (12 mins, Heavy traffic)\n- Route 2: Link Road Green Corridor (8 mins, Free flowing)\n";
    }
    const rec = state.routes.length > 0 ? "Route 2 currently has the lowest traffic congestion index. Switching routes will optimize transit time." : "Switching to Route 2 can save 4 minutes.";
    return `${routeDetails}
Recommendation:
${rec}

[ALERT: TRAFFIC] Traffic Alert - Route 1 has additional delays.

[SUGGESTION: SHOW_SAFER_ROUTE] Switch to Route 2`;
  }
  if (q.includes("weather") || q.includes("rain") || q.includes("storm") || q.includes("wind")) {
    let surchargeInfo = "No active weather surcharges.";
    if (state.weather !== "Clear") {
      surchargeInfo = `Weather Base Surcharge: Active (+\u20B9${state.weather === "Overcast" ? "10" : state.weather === "High Winds" ? "20" : state.weather === "Heavy Rain" ? "30" : "50"})`;
    }
    return `Weather Condition: ${state.weather}
Surcharge Status: ${surchargeInfo}
Safety Capping: Speed cap is active at ${state.weather === "Monsoon Storm" ? "50 km/h" : state.weather === "Heavy Rain" ? "60 km/h" : state.weather === "High Winds" ? "65 km/h" : "75 km/h"}.

Recommendation:
Maintain a safe braking distance. Wet/overcast roads limit tire traction.

[ALERT: WEATHER] Weather Alert - ${state.weather} conditions reported.

[SUGGESTION: SHOW_SAFER_ROUTE] View Safer Route`;
  }
  if (q.includes("driver") || q.includes("reputation") || q.includes("rating") || q.includes("who is") || q.includes("rajesh") || q.includes("saran") || q.includes("arul")) {
    const active = state.activeRide;
    const rating2 = state.driverRating || 4.8;
    const driverName = active ? active.driverName : "Rajesh Kumar";
    return `Driver Name: ${driverName}
Rating: ${rating2} / 5.0
Compliance Status: Verified RideMate Driver
Telemetry Alerts: ${active ? active.overspeedEvents : 0} Speeding Warning(s)

Recommendation:
Driver has high rating of ${rating2}. Telemetry checks are active.

[ALERT: SAFETY] Compliance Monitor - Safety logs are normal.

[SUGGESTION: TRACK_DRIVER] Track Driver`;
  }
  if (q.includes("hospital") || q.includes("medical") || q.includes("emergency") || q.includes("doctor") || q.includes("accident") || q.includes("help") || q.includes("danger") || q.includes("sos") || q.includes("unsafe") || q.includes("threat")) {
    return `Emergency Guidance Mode:
- Nearest Hospital: Apollo Emergency Care (1.8 km away, ~4 mins)
- Backup Clinic: Apollo Clinic (2.5 km away)
- Ambulance Dispatch: Mapped on SOS trigger

Recommendation:
If you feel unsafe or have an emergency, please press the [Emergency Help] button immediately. This triggers PCR ambulance dispatch, shares live coordinates, and texts your guardians.

[ALERT: SAFETY] Emergency Mode - Emergency guidance active.

[SUGGESTION: EMERGENCY_HELP] Emergency Help`;
  }
  const rating = state.driverRating || 4.8;
  const weather = state.weather;
  const traffic = state.traffic;
  return `Hello! I am your RideMate Companion. I have live telemetry access to weather (${weather}), traffic (${traffic}), active routes, and driver details (Rating: ${rating}). How can I help you on your commute today?

[ALERT: SAFETY] Compliance Monitor - Operations logs are nominal.

[SUGGESTION: SHOW_SAFER_ROUTE] Show Safer Route
[SUGGESTION: EMERGENCY_HELP] Emergency Help`;
}
async function queryGeographicCities(userQuery) {
  const LOCAL_CITIES_FILE = import_path2.default.join(process.cwd(), "indian_cities.json");
  let citiesData = "";
  let rawCities = [];
  try {
    if (import_fs2.default.existsSync(LOCAL_CITIES_FILE)) {
      citiesData = import_fs2.default.readFileSync(LOCAL_CITIES_FILE, "utf-8");
      rawCities = JSON.parse(citiesData);
    } else {
      console.log("Fetching cities.json from raw source on demand...");
      const res = await fetch("https://raw.githubusercontent.com/thatisuday/indian-cities-database/master/cities.json");
      if (res.ok) {
        citiesData = await res.text();
        import_fs2.default.writeFileSync(LOCAL_CITIES_FILE, citiesData, "utf-8");
        rawCities = JSON.parse(citiesData);
      }
    }
  } catch (err) {
    console.error("Error reading cities JSON for Gemini context:", err);
  }
  const systemInstruction = `
You are a precise geographic data retrieval engine. Your absolute source of truth is the attached document. 

When a user asks for places in a location, you must scan the document and return a structured list.

Strict Rules:
1. Do not use outside knowledge. If a place is not explicitly listed in the document, do not include it.
2. Group the results logically by state or district.
3. Format your response cleanly using bullet points.
4. If a user queries a place that does not exist in the file, politely inform them that it is missing from the database.
`;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      answer: getProgrammaticQueryFallback(userQuery, rawCities),
      source: "programmatic"
    };
  }
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [
          { text: systemInstruction },
          { text: `ATTACHED DOCUMENT (cities.json):
${citiesData.slice(0, 8e5)}` },
          { text: `USER QUERY: ${userQuery}` }
        ] }
      ],
      config: {
        temperature: 0.1
      }
    });
    return {
      answer: response.text || getProgrammaticQueryFallback(userQuery, rawCities),
      source: "gemini"
    };
  } catch (err) {
    console.error("Gemini city query failed, running programmatic fallback:", err);
    return {
      answer: getProgrammaticQueryFallback(userQuery, rawCities),
      source: "programmatic"
    };
  }
}
function getProgrammaticQueryFallback(query, cities) {
  const qClean = query.toLowerCase();
  if (!cities || cities.length === 0) {
    return "The geographic database file is currently loading or was empty. Please check back in a few seconds.";
  }
  const states = Array.from(new Set(cities.map((c) => String(c.state || "").trim())));
  const districts = Array.from(new Set(cities.map((c) => String(c.district || "").trim())));
  let foundState = states.find((s) => qClean.includes(s.toLowerCase()));
  let foundDistrict = districts.find((d) => qClean.includes(d.toLowerCase()));
  if (foundState) {
    const filtered = cities.filter((c) => String(c.state).toLowerCase() === foundState.toLowerCase());
    if (filtered.length === 0) {
      return `Politely informing you that places in "${foundState}" are missing from the database.`;
    }
    const grouped = {};
    filtered.forEach((c) => {
      const dist = c.district || "General";
      if (!grouped[dist]) grouped[dist] = [];
      if (!grouped[dist].includes(c.name)) {
        grouped[dist].push(c.name);
      }
    });
    let res = `### Available Cities in **${foundState}** (Programmatic Search Online)

`;
    Object.entries(grouped).sort().forEach(([dist, names]) => {
      res += `* **District: ${dist}**
`;
      names.sort().forEach((name) => {
        res += `  - ${name}
`;
      });
    });
    return res;
  }
  if (foundDistrict) {
    const filtered = cities.filter((c) => String(c.district).toLowerCase() === foundDistrict.toLowerCase());
    if (filtered.length === 0) {
      return `Politely informing you that places in "${foundDistrict}" are missing from the database.`;
    }
    let res = `### Available Cities in District: **${foundDistrict}** (Programmatic Search Online)

`;
    filtered.sort((a, b) => String(a.name).localeCompare(String(b.name))).forEach((c) => {
      res += `- ${c.name} (State: ${c.state})
`;
    });
    return res;
  }
  const searchTerms = qClean.split(/\s+/).filter((w) => w.length > 2 && !["list", "all", "the", "available", "cities", "in", "of", "and", "place", "places", "located", "find", "from"].includes(w));
  if (searchTerms.length > 0) {
    const filtered = cities.filter(
      (c) => searchTerms.some(
        (term) => String(c.name).toLowerCase().includes(term) || String(c.state).toLowerCase().includes(term) || String(c.district).toLowerCase().includes(term)
      )
    );
    if (filtered.length > 0) {
      const grouped = {};
      filtered.forEach((c) => {
        const state = c.state || "Unknown";
        if (!grouped[state]) grouped[state] = [];
        const label = `${c.name} (District: ${c.district || "N/A"})`;
        if (!grouped[state].includes(label)) {
          grouped[state].push(label);
        }
      });
      let res = `### Search Results for "${searchTerms.join(" ")}" (Programmatic Search Online)

`;
      Object.entries(grouped).forEach(([state, names]) => {
        res += `* **State: ${state}**
`;
        names.slice(0, 50).forEach((name) => {
          res += `  - ${name}
`;
        });
        if (names.length > 50) {
          res += `  - ...and ${names.length - 50} more results match.`;
        }
      });
      return res;
    }
  }
  return `I have scanned the geographic database, and the location you requested ("${query}") does not exist or matches no entries in the file. Politely informing you that the places are missing from the database.`;
}

// backend/weather.ts
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config({ path: ".env" });
console.log(
  "[WeatherService] WEATHER_API_KEY Loaded:",
  !!process.env.WEATHER_API_KEY
);
var WEATHER_API_KEY = process.env.WEATHER_API_KEY;
var weatherCache = {};
var getCacheKey = (lat, lng) => {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
};
var getWeatherData = async (lat, lng) => {
  const cacheKey = getCacheKey(lat, lng);
  const cached = weatherCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1e3) {
    return cached.data;
  }
  const fallback = {
    temp: 28,
    weatherText: "Clear",
    windSpeed: 10,
    humidity: 55,
    weatherMultiplier: 1,
    weatherFactor: 0,
    rainChance: 0,
    temperature: 28,
    condition: "Clear",
    windKph: 10,
    isDay: true
  };
  if (!WEATHER_API_KEY || WEATHER_API_KEY === "YOUR_WEATHER_API_KEY" || WEATHER_API_KEY.includes("YOUR_")) {
    console.log("[WeatherService] Fetching real live weather using free Open-Meteo API...");
    try {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=precipitation_probability_max&forecast_days=1&timezone=auto`;
      const response = await fetch(openMeteoUrl);
      if (!response.ok) {
        throw new Error(`Open-Meteo responded with status ${response.status}`);
      }
      const data = await response.json();
      const current = data.current;
      const daily = data.daily;
      const temp = current?.temperature_2m ?? fallback.temp;
      const humidity = current?.relative_humidity_2m ?? fallback.humidity;
      const windSpeed = current?.wind_speed_10m ?? fallback.windSpeed;
      const isDay = current?.is_day === 1;
      const code = current?.weather_code ?? 0;
      const rainChance = daily?.precipitation_probability_max?.[0] ?? fallback.rainChance;
      let weatherText = "Clear";
      let weatherMultiplier = 1;
      let weatherFactor = 0;
      if (code === 0) {
        weatherText = "Clear";
        weatherMultiplier = 1;
        weatherFactor = 0;
      } else if (code >= 1 && code <= 3) {
        weatherText = "Cloudy";
        weatherMultiplier = 1.1;
        weatherFactor = 10;
      } else if (code >= 45 && code <= 48) {
        weatherText = "Foggy";
        weatherMultiplier = 1.1;
        weatherFactor = 10;
      } else if (code >= 51 && code <= 55) {
        weatherText = "Drizzle";
        weatherMultiplier = 1.15;
        weatherFactor = 15;
      } else if (code >= 61 && code <= 65) {
        weatherText = "Rainy";
        weatherMultiplier = 1.25;
        weatherFactor = 30;
      } else if (code >= 80 && code <= 82) {
        weatherText = "Heavy Rain";
        weatherMultiplier = 1.4;
        weatherFactor = 40;
      } else if (code >= 95 && code <= 99) {
        weatherText = "Monsoon Storm";
        weatherMultiplier = 1.5;
        weatherFactor = 60;
      }
      const result = {
        temp,
        weatherText,
        windSpeed,
        humidity,
        weatherMultiplier,
        weatherFactor,
        rainChance,
        temperature: temp,
        condition: weatherText,
        windKph: windSpeed,
        isDay
      };
      weatherCache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
      return result;
    } catch (openMeteoErr) {
      console.error("[WeatherService] Open-Meteo fallback fetch error:", openMeteoErr);
      return fallback;
    }
  }
  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&days=1&aqi=no`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WeatherAPI responded with status ${response.status}`);
    }
    const data = await response.json();
    const temp = data.current?.temp_c ?? fallback.temp;
    const weatherText = data.current?.condition?.text ?? fallback.weatherText;
    const windSpeed = data.current?.wind_kph ?? fallback.windSpeed;
    const humidity = data.current?.humidity ?? fallback.humidity;
    const rainChance = data.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain ?? fallback.rainChance;
    const isDay = data.current?.is_day === 1;
    let weatherMultiplier = 1;
    let weatherFactor = 0;
    const wt = weatherText.toLowerCase();
    if (wt.includes("overcast") || wt.includes("cloud") || wt.includes("mist") || wt.includes("haze") || wt.includes("fog")) {
      weatherMultiplier = 1.1;
      weatherFactor = 10;
    } else if (wt.includes("heavy rain") || wt.includes("monsoon") || wt.includes("torrential")) {
      weatherMultiplier = 1.4;
      weatherFactor = 40;
    } else if (wt.includes("rain") || wt.includes("drizzle") || wt.includes("shower")) {
      weatherMultiplier = 1.25;
      weatherFactor = 30;
    } else if (wt.includes("storm") || wt.includes("thunder") || wt.includes("snow") || wt.includes("blizzard")) {
      weatherMultiplier = 1.5;
      weatherFactor = 60;
    }
    const result = {
      temp,
      weatherText,
      windSpeed,
      humidity,
      weatherMultiplier,
      weatherFactor,
      rainChance,
      temperature: temp,
      condition: weatherText,
      windKph: windSpeed,
      isDay
    };
    weatherCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
    return result;
  } catch (err) {
    console.error("[WeatherService] Error retrieving weather details:", err);
    return fallback;
  }
};

// backend/AdminResetService.ts
var DEFAULT_SEED_DRIVERS = [
  {
    id: "DRV-4581",
    name: "Saran",
    vehicle: "BIKE-TN37AB3286",
    rating: 4.7,
    status: "online",
    vehicleType: "Bike",
    vehicleNumber: "TN37AB3286",
    baseCompletedRides: 24,
    baseTodayEarnings: 1250,
    phone: "+91 9876543210",
    location: { lat: 11.0168, lng: 76.9558 }
    // Coimbatore Gandhipuram Center
  },
  {
    id: "DRV-2038",
    name: "Arul",
    vehicle: "BIKE-TN37AB6609",
    rating: 4.9,
    status: "online",
    vehicleType: "Bike",
    vehicleNumber: "TN37AB6609",
    baseCompletedRides: 24,
    baseTodayEarnings: 1250,
    phone: "+91 9876543210",
    location: { lat: 11.0168, lng: 76.9558 }
    // Coimbatore Gandhipuram Center
  }
];
var AdminResetService = class {
  static resetDemoDatabase() {
    db.clearAll();
    const drivers = db.getDrivers();
    drivers.length = 0;
    DEFAULT_SEED_DRIVERS.forEach((drv) => {
      drivers.push({ ...drv });
    });
    db.save();
    console.log("[DB Reset] Demo database successfully seeded with initial profiles");
  }
};

// backend/routes.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var apiRouter = (0, import_express.Router)();
var asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
var NOMINATIM_USER_AGENT = process.env.APP_URL || "ZipRideLocalBooking/1.0";
var haversineDistanceKm = (pLat, pLng, dLat, dLng) => {
  const R = 6371;
  const dLatRad = (dLat - pLat) * Math.PI / 180;
  const dLonRad = (dLng - pLng) * Math.PI / 180;
  const a = Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) + Math.cos(pLat * Math.PI / 180) * Math.cos(dLat * Math.PI / 180) * Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};
apiRouter.get("/weather", asyncWrapper(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "Valid lat and lng coordinates are required." });
    return;
  }
  const weather = await getWeatherData(lat, lng);
  res.json(weather);
}));
apiRouter.get("/system-state", (req, res) => {
  const config = db.getConfig();
  const rides = db.getRides();
  const alerts = db.getAlerts();
  const activeRides = rides.filter((r) => ["booked", "assigned", "pickup", "en_route", "anomaly"].includes(r.status));
  const completedToday = rides.filter((r) => r.status === "completed");
  const revenue = completedToday.reduce((total, r) => total + r.finalFare, 0);
  const overspeedCount = alerts.filter((a) => a.type === "speed").length;
  const harshBrakeCount = alerts.filter((a) => a.type === "braking").length;
  res.json({
    config,
    activeCount: activeRides.length,
    completedCount: completedToday.length,
    revenue,
    overspeedCount,
    harshBrakeCount,
    recentAlerts: alerts.slice(0, 5)
  });
});
apiRouter.post("/system-state", (req, res) => {
  const { weather, traffic } = req.body;
  if (!weather || !traffic) {
    res.status(400).json({ error: "Weather and Traffic are required fields." });
    return;
  }
  db.setConfig(weather, traffic);
  db.addAlert({
    id: `SYS-${Date.now()}`,
    rideId: "SYSTEM",
    type: "info",
    message: `System environment adjusted: Weather is now "${weather}", Traffic level is now "${traffic}".`,
    severity: "info",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ success: true, config: db.getConfig() });
});
apiRouter.post("/admin/patch-rider-names", (req, res) => {
  const defaultName = req.body.name || "Saran";
  const patched = db.patchMissingRiderNames(defaultName);
  res.json({ success: true, patched, message: `Patched ${patched} rides with riderName: '${defaultName}'` });
});
apiRouter.post("/admin/reset-demo", (req, res) => {
  AdminResetService.resetDemoDatabase();
  res.json({
    success: true,
    message: "Demo database reset successfully"
  });
});
apiRouter.get("/drivers", (req, res) => {
  res.json(db.getDrivers());
});
apiRouter.patch("/drivers/:id", (req, res) => {
  const { id } = req.params;
  const { name, phone, vehicle, vehicleType, status, location } = req.body;
  let driver = db.getDrivers().find((d) => d.id === id);
  if (driver) {
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (vehicle) driver.vehicle = vehicle;
    if (vehicleType) driver.vehicleType = vehicleType;
    if (status) driver.status = status;
    if (location) driver.location = location;
  } else {
    driver = {
      id,
      name: name || "Anonymous Driver",
      phone: phone || "+91 9876543210",
      vehicle: vehicle || "BIKE-TN-09-XX-9999",
      vehicleType: vehicleType || "Bike",
      rating: 5,
      status: status || "online",
      location: location || { lat: 13.0827, lng: 80.2707 }
    };
    db.getDrivers().push(driver);
  }
  db.save();
  res.json(driver);
});
apiRouter.post("/drivers/register", (req, res) => {
  try {
    const { name, phone, location, vehicleType, vehicleNumber } = req.body;
    if (!name || !phone || !location || !vehicleType || !vehicleNumber) {
      res.status(400).json({ error: "Name, phone, location, vehicleType, and vehicleNumber are required." });
      return;
    }
    const driverId = `DRV-${Date.now().toString().slice(-6)}`;
    const finalVehicle = `${vehicleType.toUpperCase()}-${vehicleNumber}`;
    const latVal = typeof location.lat === "string" ? parseFloat(location.lat) : Number(location.lat);
    const lngVal = typeof location.lng === "string" ? parseFloat(location.lng) : Number(location.lng);
    if (isNaN(latVal) || isNaN(lngVal)) {
      res.status(400).json({ error: "Location coordinates must be valid numbers." });
      return;
    }
    const driver = {
      id: driverId,
      name,
      phone,
      vehicle: finalVehicle,
      vehicleType,
      vehicleNumber,
      rating: 5,
      status: "online",
      location: { lat: latVal, lng: lngVal },
      baseCompletedRides: 0,
      baseTodayEarnings: 0
    };
    db.getDrivers().push(driver);
    db.save();
    res.json({
      success: true,
      driver
    });
  } catch (err) {
    console.error("Driver Registration Error Stack Trace:", err);
    res.status(500).json({ error: "Internal server error during driver registration." });
  }
});
apiRouter.get("/driver/orders", (req, res) => {
  const rides = db.getRides().filter((r) => r.status === "booked");
  res.json(rides);
});
apiRouter.get("/driver/profile", (req, res) => {
  const name = req.query.name;
  if (!name) {
    res.status(400).json({ error: "Driver name is required." });
    return;
  }
  let driver = db.getDrivers().find((d) => d.name.toLowerCase() === name.toLowerCase());
  if (!driver) {
    const id = `DRV-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const vehicleNumber2 = `TN37AB${Math.floor(1e3 + Math.random() * 9e3)}`;
    const rating = Number((4.5 + Math.random() * 0.5).toFixed(1));
    driver = {
      id,
      name,
      phone: "+91 9876543210",
      vehicle: `BIKE-${vehicleNumber2}`,
      rating,
      status: "online",
      location: { lat: 13.0827, lng: 80.2707 },
      vehicleType: "Bike",
      vehicleNumber: vehicleNumber2,
      baseCompletedRides: 24,
      baseTodayEarnings: 1250
    };
    db.getDrivers().push(driver);
    db.save();
  }
  const vehicleType = driver.vehicleType || "Bike";
  const vehicleNumber = driver.vehicleNumber || (driver.vehicle.includes("-") ? driver.vehicle.substring(driver.vehicle.indexOf("-") + 1) : driver.vehicle);
  const driverRides = db.getRides().filter((r) => r.driverName === driver.name || r.driverId === driver.id);
  const completedRidesList = driverRides.filter((r) => r.status === "completed");
  const baseCompletedRides = driver.baseCompletedRides !== void 0 ? driver.baseCompletedRides : 24;
  const baseTodayEarnings = driver.baseTodayEarnings !== void 0 ? driver.baseTodayEarnings : 1250;
  const completedRides = baseCompletedRides + completedRidesList.length;
  const todayEarnings = baseTodayEarnings + completedRidesList.reduce((sum, r) => sum + r.finalFare, 0);
  res.json({
    id: driver.id,
    name: driver.name,
    vehicleType,
    vehicleNumber,
    rating: driver.rating,
    status: driver.status,
    todayEarnings,
    completedRides
  });
});
apiRouter.post("/driver/status", (req, res) => {
  const { name, status } = req.body;
  if (!name || !status) {
    res.status(400).json({ error: "Name and status are required." });
    return;
  }
  const driver = db.getDrivers().find((d) => d.name.toLowerCase() === name.toLowerCase());
  if (driver) {
    driver.status = status;
    db.save();
    res.json({ success: true, status: driver.status });
  } else {
    res.status(404).json({ error: "Driver not found." });
  }
});
apiRouter.post("/rides/clear", (req, res) => {
  db.reload();
  db.clearRides();
  res.json({ success: true });
});
apiRouter.get("/rides", (req, res) => {
  db.reload();
  res.json(db.getRides());
});
apiRouter.get("/rides/:id", (req, res) => {
  db.reload();
  const ride = db.getRides().find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  res.json(ride);
});
apiRouter.post("/rides", asyncWrapper(async (req, res) => {
  const {
    pickup,
    drop,
    paymentMethod,
    riderName,
    distanceKm: clientDistance,
    durationMin: clientDuration,
    weatherType: clientWeather,
    trafficType: clientTraffic,
    initialFare: clientFare,
    gpsLat: clientLat,
    gpsLng: clientLng,
    vehicleType,
    isChildSafety,
    isWomenSafety,
    isFamilySafety,
    selectedRouteIndex,
    routePath
  } = req.body;
  if (!pickup || !drop || !paymentMethod) {
    res.status(400).json({ error: "Pickup, drop, and paymentMethod are required." });
    return;
  }
  const rideId = `ZR-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const gpsLat = clientLat !== void 0 ? clientLat : 19.076;
  const gpsLng = clientLng !== void 0 ? clientLng : 72.8777;
  const sysConfig = db.getConfig();
  const weather = clientWeather || sysConfig.weather;
  const traffic = clientTraffic || sysConfig.traffic;
  let liveWeather = {
    temp: 28,
    weatherText: weather,
    windSpeed: 10,
    humidity: 55,
    weatherMultiplier: 1,
    weatherFactor: 0,
    rainChance: 0
  };
  try {
    const fetched = await getWeatherData(gpsLat, gpsLng);
    liveWeather = {
      temp: fetched.temp,
      weatherText: fetched.weatherText,
      windSpeed: fetched.windSpeed,
      humidity: fetched.humidity,
      weatherMultiplier: fetched.weatherMultiplier,
      weatherFactor: fetched.weatherFactor,
      rainChance: fetched.rainChance
    };
  } catch (err) {
    console.warn("[POST /rides] Weather fetch failed, falling back to simulated logic:", err);
  }
  let distanceKm = clientDistance;
  if (distanceKm === void 0) {
    const rawDist = 2 + Math.abs(pickup.length - drop.length) % 12 * 1.1 + pickup.charCodeAt(0) % 5 * 0.5;
    distanceKm = Number(rawDist.toFixed(2));
  }
  let durationMin = clientDuration;
  let baseDuration = distanceKm * 3;
  const weatherSurcharge = liveWeather.weatherFactor;
  const weatherMultiplier = liveWeather.weatherMultiplier;
  let speedLimit = 80;
  let etaMultiplier = 1;
  const wt = liveWeather.weatherText.toLowerCase();
  if (wt.includes("overcast") || wt.includes("clouds") || wt.includes("mist") || wt.includes("haze") || wt.includes("fog")) {
    speedLimit = 75;
    etaMultiplier = 1.1;
  } else if (wt.includes("rain") || wt.includes("drizzle")) {
    speedLimit = 60;
    etaMultiplier = 1.3;
  } else if (wt.includes("storm") || wt.includes("thunderstorm") || wt.includes("snow") || wt.includes("extreme")) {
    speedLimit = 50;
    etaMultiplier = 1.5;
  }
  let trafficMultiplier = 1;
  if (traffic === "Moderate") {
    trafficMultiplier = 1.1;
    etaMultiplier *= 1.3;
  } else if (traffic === "Heavy Congestion") {
    trafficMultiplier = 1.3;
    etaMultiplier *= 1.8;
  } else if (traffic === "Gridlock") {
    trafficMultiplier = 1.5;
    etaMultiplier *= 2.5;
  }
  if (durationMin === void 0) {
    durationMin = Number((baseDuration * etaMultiplier).toFixed(1));
  }
  const vType = vehicleType || "Bike";
  let baseFare = 25;
  let perKmRate = 8;
  let perMinRate = 1;
  let fuelPerKm = 0.02;
  let idleConsumption = 5e-3;
  if (vType === "Auto") {
    baseFare = 40;
    perKmRate = 12;
    perMinRate = 1.5;
    fuelPerKm = 0.04;
    idleConsumption = 0.01;
  } else if (vType === "Cab" || vType === "Mini Cab" || vType === "Mini") {
    baseFare = 70;
    perKmRate = 15;
    perMinRate = 2;
    fuelPerKm = 0.06;
    idleConsumption = 0.015;
  } else if (vType === "Sedan") {
    baseFare = 90;
    perKmRate = 18;
    perMinRate = 2.5;
    fuelPerKm = 0.08;
    idleConsumption = 0.02;
  } else if (vType === "SUV") {
    baseFare = 120;
    perKmRate = 24;
    perMinRate = 3.5;
    fuelPerKm = 0.1;
    idleConsumption = 0.03;
  }
  const distanceFare = Number((distanceKm * perKmRate).toFixed(2));
  const durationFare = Number((durationMin * perMinRate).toFixed(2));
  const currentHour = (/* @__PURE__ */ new Date()).getHours();
  const isNight = currentHour >= 22 || currentHour < 6;
  const nightSurcharge = isNight ? 30 : 0;
  const trafficSurgeAmt = (distanceFare + durationFare) * (trafficMultiplier - 1);
  const fuelUsage = fuelPerKm * distanceKm + idleConsumption * Math.max(0, durationMin - distanceKm / 40 * 60);
  const fuelCost = fuelUsage * 102.5;
  const fuelAdjustment = Number((fuelCost * 0.4).toFixed(2));
  const tollCharges = distanceKm > 15 ? 50 : 0;
  const platformFee = 7;
  const subtotal = baseFare + distanceFare + durationFare + weatherSurcharge + trafficSurgeAmt + nightSurcharge + fuelAdjustment + tollCharges + platformFee;
  const tax = Number((subtotal * 0.18).toFixed(2));
  let initialFare = clientFare;
  if (initialFare === void 0) {
    initialFare = Number((subtotal + tax).toFixed(2));
  }
  const newRide = {
    id: rideId,
    pickup,
    drop,
    distanceKm,
    durationMin,
    baseFare,
    distanceFare,
    durationFare,
    weatherType: liveWeather.weatherText,
    weatherFactor: weatherSurcharge,
    trafficType: traffic,
    trafficFactor: trafficMultiplier,
    initialFare,
    safetyScore: 100,
    overspeedEvents: 0,
    harshBrakeEvents: 0,
    behaviorDiscount: 0,
    finalFare: initialFare,
    paymentMethod,
    paymentStatus: "pending",
    status: "booked",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    // Detailed Breakdown Surcharges
    nightSurcharge,
    fuelUsage: Number(fuelUsage.toFixed(3)),
    fuelCost: Number(fuelCost.toFixed(2)),
    fuelAdjustment,
    tollCharges,
    platformFee,
    tax,
    // Coordinates
    gpsLat,
    gpsLng,
    speed: 0,
    ignition: "off",
    seat: "empty",
    motion: "stationary",
    nfc: "inactive",
    progress: 0,
    selectedRouteIndex: selectedRouteIndex !== void 0 ? Number(selectedRouteIndex) : void 0,
    routePath: Array.isArray(routePath) ? routePath : void 0,
    // Rider Details
    riderName: riderName || "Saran",
    riderPhone: "9876543210",
    riderLat: gpsLat,
    riderLng: gpsLng,
    // Extended Vehicle & Weather details
    vehicleType: vType,
    weatherCondition: liveWeather.weatherText,
    temperature: liveWeather.temp,
    humidity: liveWeather.humidity,
    windSpeed: liveWeather.windSpeed,
    weatherMultiplier,
    rainChance: liveWeather.rainChance,
    // Safety Toggles
    isChildSafety: !!isChildSafety,
    isWomenSafety: !!isWomenSafety,
    isFamilySafety: !!isFamilySafety,
    pickupCode: isChildSafety ? Math.floor(1e3 + Math.random() * 9e3).toString() : void 0,
    childArrivalConfirmed: false
  };
  db.addRide(newRide);
  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId,
    type: "info",
    message: `Ride ${rideId} booked (${vType}). Pickup: "${pickup}" -> Drop: "${drop}". Dynamic Fare calculated at \u20B9${initialFare} (Weather fee: +\u20B9${weatherSurcharge}, Traffic Multiplier: ${trafficMultiplier}x, Dist: ${distanceKm} km).`,
    severity: "info",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(newRide);
}));
apiRouter.post("/rides/:id/accept", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { driverName } = req.body;
  let driver;
  if (driverName) {
    driver = db.getDrivers().find((d) => d.name.toLowerCase() === driverName.toLowerCase());
  }
  if (!driver) {
    driver = db.getDrivers().find((d) => d.status === "online") || db.getDrivers()[0];
  }
  ride.status = "assigned";
  ride.driverId = driver.id;
  ride.driverName = driver.name;
  ride.driverVehicle = driver.vehicle;
  ride.driverRating = driver.rating;
  ride.driverPhone = driver.phone || "9876543210";
  ride.driverVehicleType = driver.vehicleType || "Bike";
  ride.progress = 0;
  ride.ignition = "on";
  ride.seat = "empty";
  ride.motion = "stationary";
  db.updateRide(ride);
  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId: ride.id,
    type: "info",
    message: `Driver "${driver.name}" (${driver.vehicle}) accepted ride ${ride.id} and is heading to the pickup location.`,
    severity: "low",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(ride);
});
apiRouter.post("/rides/:id/telemetry", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { gpsLat, gpsLng, speed, ignition, seat, motion, nfc, progress, triggerHarshBrake, status } = req.body;
  if (gpsLat !== void 0) ride.gpsLat = Number(gpsLat);
  if (gpsLng !== void 0) ride.gpsLng = Number(gpsLng);
  if (speed !== void 0) ride.speed = Number(speed);
  if (ignition !== void 0) ride.ignition = ignition;
  if (seat !== void 0) ride.seat = seat;
  if (motion !== void 0) ride.motion = motion;
  if (nfc !== void 0) ride.nfc = nfc;
  if (status !== void 0) ride.status = status;
  if (progress !== void 0) {
    ride.progress = Number(progress);
    if (ride.progress > 0 && ride.progress < 25 && ride.status === "assigned") {
      ride.status = "pickup";
    } else if (ride.progress >= 25 && ride.progress < 100 && (ride.status === "pickup" || ride.status === "assigned")) {
      ride.status = "en_route";
      ride.seat = "occupied";
      ride.nfc = "active";
    } else if (ride.progress >= 100 && ride.status === "en_route") {
      ride.status = "arrived";
      ride.speed = 0;
      ride.motion = "stationary";
      ride.seat = "empty";
      ride.nfc = "inactive";
    }
  }
  let safeSpeedLimit = 80;
  if (ride.weatherType === "Overcast") safeSpeedLimit = 75;
  else if (ride.weatherType === "High Winds") safeSpeedLimit = 65;
  else if (ride.weatherType === "Heavy Rain") safeSpeedLimit = 60;
  else if (ride.weatherType === "Monsoon Storm") safeSpeedLimit = 50;
  if (ride.speed > safeSpeedLimit) {
    ride.overspeedEvents += 1;
    ride.safetyScore = Math.max(10, ride.safetyScore - 10);
    const overspeedPenaltyDiscount = 15;
    ride.behaviorDiscount += overspeedPenaltyDiscount;
    db.addAlert({
      id: `SPD-${Date.now()}-${Math.random()}`,
      rideId: ride.id,
      type: "speed",
      message: `Speed Violation on Ride ${ride.id}! Driver recorded speed of ${ride.speed} km/h (Limit set at ${safeSpeedLimit} km/h due to "${ride.weatherType}"). Dynamic billing applied a \u20B9${overspeedPenaltyDiscount.toFixed(2)} refund discount.`,
      severity: "high",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (triggerHarshBrake === true) {
    ride.harshBrakeEvents += 1;
    ride.safetyScore = Math.max(10, ride.safetyScore - 10);
    const harshBrakingPenaltyDiscount = 10;
    ride.behaviorDiscount += harshBrakingPenaltyDiscount;
    ride.motion = "braking";
    db.addAlert({
      id: `BRK-${Date.now()}-${Math.random()}`,
      rideId: ride.id,
      type: "braking",
      message: `Harsh Deceleration detected on Ride ${ride.id}! Telemetry recorded rapid safety brake shift. Dynamic billing applied a \u20B9${harshBrakingPenaltyDiscount.toFixed(2)} safety refund discount.`,
      severity: "medium",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  const floorFare = ride.baseFare !== void 0 ? ride.baseFare : 20;
  ride.finalFare = Number(Math.max(floorFare, ride.initialFare - ride.behaviorDiscount).toFixed(2));
  db.updateRide(ride);
  res.json(ride);
});
apiRouter.post("/rides/:id/cancel", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const cancellableStatuses = ["booked", "assigned"];
  if (!cancellableStatuses.includes(ride.status)) {
    res.status(400).json({ error: `Ride cannot be cancelled when status is '${ride.status}'.` });
    return;
  }
  ride.status = "cancelled";
  ride.paymentStatus = "Pending";
  ride.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  ride.speed = 0;
  ride.motion = "stationary";
  ride.ignition = "off";
  db.updateRide(ride);
  db.addAlert({
    id: `EVT-CAN-${Date.now()}`,
    rideId: ride.id,
    type: "info",
    message: `Ride ${ride.id} was cancelled by the passenger before pickup.`,
    severity: "medium",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(ride);
});
apiRouter.post("/rides/:id/complete", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  ride.status = "completed";
  ride.progress = 100;
  ride.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  ride.speed = 0;
  ride.motion = "stationary";
  ride.seat = "empty";
  ride.nfc = "inactive";
  db.updateRide(ride);
  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId: ride.id,
    type: "info",
    message: `Ride ${ride.id} successfully completed. Total Charged: \u20B9${ride.finalFare} (Deductions for behavior: -\u20B9${ride.behaviorDiscount}). Final safety score: ${ride.safetyScore}%.`,
    severity: "info",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(ride);
});
apiRouter.post("/rides/:id/pay", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { paymentReference, paymentMethod, paymentStatus } = req.body;
  ride.paymentStatus = paymentStatus || "paid";
  ride.paymentMethod = paymentMethod || "UPI";
  ride.paymentReference = paymentReference || `REF-${Math.floor(1e5 + Math.random() * 9e5)}`;
  if (ride.paymentStatus === "paid") {
    ride.paidAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  db.updateRide(ride);
  db.addAlert({
    id: `EVT-PAY-${Date.now()}`,
    rideId: ride.id,
    type: "info",
    message: `Payment successful for ride ${ride.id}. Reference: ${ride.paymentReference}. Amount: \u20B9${ride.finalFare}.`,
    severity: "info",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(ride);
});
apiRouter.post("/rides/:id/rate", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { rating } = req.body;
  if (rating === void 0 || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5 stars." });
    return;
  }
  ride.rating = Number(rating);
  db.updateRide(ride);
  db.addAlert({
    id: `EVT-RT-${Date.now()}`,
    rideId: ride.id,
    type: "info",
    message: `Rider rated ride ${ride.id} as ${rating} stars.`,
    severity: "info",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(ride);
});
apiRouter.get("/disputes", (req, res) => {
  res.json(db.getDisputes());
});
apiRouter.post("/rides/:id/dispute", asyncWrapper(async (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { reason } = req.body;
  if (!reason) {
    res.status(400).json({ error: "A physical reason description is required for disputes" });
    return;
  }
  const disputeId = `DSP-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const newDispute = {
    id: disputeId,
    rideId: ride.id,
    pickup: ride.pickup,
    drop: ride.drop,
    driverName: ride.driverName || "Rajesh Kumar",
    safetyScore: ride.safetyScore,
    initialFare: ride.initialFare,
    finalFare: ride.finalFare,
    reason,
    status: "open",
    resolutionRefundAmount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.addDispute(newDispute);
  try {
    const aiExplanation = await summarizeDispute({
      pickup: ride.pickup,
      drop: ride.drop,
      driverName: ride.driverName || "Rajesh Kumar",
      safetyScore: ride.safetyScore,
      initialFare: ride.initialFare,
      finalFare: ride.finalFare,
      overspeedEvents: ride.overspeedEvents,
      harshBrakeEvents: ride.harshBrakeEvents,
      weather: ride.weatherType,
      traffic: ride.trafficType,
      userStateReason: reason
    });
    newDispute.aiExplanation = aiExplanation;
    db.updateDispute(newDispute);
  } catch (err) {
    console.error("Async dispute summarizer failed:", err);
  }
  db.addAlert({
    id: `SYS-${Date.now()}`,
    rideId: ride.id,
    type: "safety",
    message: `Dispute ${disputeId} filed for Ride ${ride.id} by rider. Reason: "${reason}". AI analyst prompted.`,
    severity: "medium",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(newDispute);
}));
apiRouter.post("/disputes/:id/resolve", (req, res) => {
  const disputes = db.getDisputes();
  const dispute = disputes.find((d) => d.id === req.params.id);
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }
  const { status, refundAmount } = req.body;
  if (!status || !["resolved", "rejected"].includes(status)) {
    res.status(400).json({ error: 'Valid status ("resolved" or "rejected") is required.' });
    return;
  }
  dispute.status = status;
  if (status === "resolved" && refundAmount !== void 0) {
    dispute.resolutionRefundAmount = Number(refundAmount);
  } else {
    dispute.resolutionRefundAmount = 0;
  }
  db.updateDispute(dispute);
  db.addAlert({
    id: `SYS-${Date.now()}`,
    rideId: dispute.rideId,
    type: "safety",
    message: `Dispute ${dispute.id} was ${status.toUpperCase()} by Operations. Refund processed: \u20B9${dispute.resolutionRefundAmount}.`,
    severity: "low",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(dispute);
});
apiRouter.get("/alerts", (req, res) => {
  res.json(db.getAlerts());
});
apiRouter.post("/gemini/assist", asyncWrapper(async (req, res) => {
  const { question, history, currentUser, role, routes, selectedRouteIndex, driverRating } = req.body;
  if (!question) {
    res.status(400).json({ error: "A user question query is required." });
    return;
  }
  let context = "";
  if (currentUser) {
    const rides = db.getRides();
    const activeStatuses = ["booked", "accepted", "assigned", "pickup", "en_route", "arrived", "anomaly", "in_progress"];
    const activeRide = rides.find((r) => {
      const isCompletedAndUnpaid = r.status === "completed" && r.paymentStatus !== "paid";
      if (role === "driver") {
        return r.driverName === currentUser && activeStatuses.includes(r.status);
      }
      return r.riderName === currentUser && (activeStatuses.includes(r.status) || isCompletedAndUnpaid);
    });
    const sysConfig = db.getConfig();
    context = `System Weather configuration: ${sysConfig.weather}, Traffic: ${sysConfig.traffic}. Current user: ${currentUser}, Role: ${role || "passenger"}.`;
    if (activeRide) {
      context += `
Active Ride:
- Ride ID: ${activeRide.id}
- Pickup: ${activeRide.pickup}
- Drop: ${activeRide.drop}
- Status: ${activeRide.status}
- Driver Name: ${activeRide.driverName || "None assigned"}
- Rider Name: ${activeRide.riderName || "Saran"}
- Vehicle Type: ${activeRide.vehicleType || "Bike"}
- Dynamic Fare: Initial \u20B9${activeRide.initialFare}, Final charged \u20B9${activeRide.finalFare}
- Speed: ${activeRide.speed} km/h
- Safety Score: ${activeRide.safetyScore}%
- Overspeed Events: ${activeRide.overspeedEvents}, Harsh Braking: ${activeRide.harshBrakeEvents}
- Payment Status: ${activeRide.paymentStatus || "Pending"}
- Active SOS Flag: ${activeRide.hasActiveSOS ? "YES" : "NO"}
- Child Safety Mode: ${activeRide.isChildSafety ? "ACTIVE" : "INACTIVE"}
- Women Safety Mode: ${activeRide.isWomenSafety ? "ACTIVE" : "INACTIVE"}
- Family Safety Mode: ${activeRide.isFamilySafety ? "ACTIVE" : "INACTIVE"}
- Pickup Verification PIN: ${activeRide.pickupCode || "N/A"}
- Child Arrival Confirmed by Guardian: ${activeRide.childArrivalConfirmed ? "YES" : "NO"}`;
    }
    if (routes && Array.isArray(routes) && routes.length > 0) {
      context += `
Available Routes:
`;
      routes.forEach((route, idx) => {
        const isSelected = idx === selectedRouteIndex;
        context += `- Route ${idx + 1}: ${route.name}${isSelected ? " (Selected)" : ""}. ETA: ${route.durationMin} mins, Distance: ${route.distanceKm} km, Traffic Score: ${route.trafficScore}/100, Fuel: ${route.fuelUsageLiters}L, Road Health: ${route.roadHealthScore}/100, Reliability Score: ${route.reliabilityScore || 90}%
`;
      });
    }
    if (driverRating !== void 0) {
      context += `
Driver Reputation / Rating: ${driverRating} stars out of 5.0
`;
    }
  }
  const answer = await askGeminiAssist(question, history || [], context);
  res.json({ answer });
}));
apiRouter.get("/geographic/status", asyncWrapper(async (req, res) => {
  const LOCAL_CITIES_FILE = import_path3.default.join(process.cwd(), "indian_cities.json");
  let exists = import_fs3.default.existsSync(LOCAL_CITIES_FILE);
  let metadata = { sizeBytes: 0, citiesCount: 0, statesCount: 0, districtsCount: 0, lastModified: "" };
  if (exists) {
    try {
      const stats = import_fs3.default.statSync(LOCAL_CITIES_FILE);
      const data = JSON.parse(import_fs3.default.readFileSync(LOCAL_CITIES_FILE, "utf-8"));
      if (Array.isArray(data)) {
        const uniqueStates = new Set(data.map((c) => String(c.state || "").trim()));
        const uniqueDistricts = new Set(data.map((c) => String(c.district || "").trim()));
        metadata = {
          sizeBytes: stats.size,
          citiesCount: data.length,
          statesCount: uniqueStates.size,
          districtsCount: uniqueDistricts.size,
          lastModified: stats.mtime.toISOString()
        };
      }
    } catch (e) {
      console.error("Error reading cached cities list metadata:", e);
    }
  } else {
    try {
      const url = "https://raw.githubusercontent.com/thatisuday/indian-cities-database/master/cities.json";
      const downloadResponse = await fetch(url);
      if (downloadResponse.ok) {
        const text = await downloadResponse.text();
        import_fs3.default.writeFileSync(LOCAL_CITIES_FILE, text, "utf-8");
        exists = true;
        const data = JSON.parse(text);
        const stats = import_fs3.default.statSync(LOCAL_CITIES_FILE);
        const uniqueStates = new Set(data.map((c) => String(c.state || "").trim()));
        const uniqueDistricts = new Set(data.map((c) => String(c.district || "").trim()));
        metadata = {
          sizeBytes: stats.size,
          citiesCount: data.length,
          statesCount: uniqueStates.size,
          districtsCount: uniqueDistricts.size,
          lastModified: stats.mtime.toISOString()
        };
      }
    } catch (downloadErr) {
      console.error("Delayed background cities download failed:", downloadErr);
    }
  }
  res.json({
    exists,
    metadata,
    sourceUrl: "https://raw.githubusercontent.com/thatisuday/indian-cities-database/master/cities.json",
    localFilename: "indian_cities.json"
  });
}));
apiRouter.post("/geographic/query", asyncWrapper(async (req, res) => {
  const { query } = req.body;
  if (!query) {
    res.status(400).json({ error: "A geographic search query is required." });
    return;
  }
  const result = await queryGeographicCities(query);
  res.json(result);
}));
apiRouter.get("/geographic/suggest", asyncWrapper(async (req, res) => {
  const queryStr = String(req.query.q || "").trim().toLowerCase();
  const coimbatoreLandmarks = [
    { name: "Ukkadam Bus Stand", district: "Coimbatore", state: "Tamil Nadu", lat: 10.995, lng: 76.9609 },
    { name: "Ukkadam Lake Promenade", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9925, lng: 76.9585 },
    { name: "Gandhipuram Town Central Bus Stand", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
    { name: "RS Puram East Club Road", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0093, lng: 76.9453 },
    { name: "Othakalmandapam Central", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8715, lng: 77.021 },
    { name: "Peelamedu Coimbatore Airport (CJB)", district: "Coimbatore", state: "Tamil Nadu", lat: 11.02, lng: 77.0434 },
    { name: "Coimbatore Junction Railway Station", district: "Coimbatore", state: "Tamil Nadu", lat: 11, lng: 76.9667 },
    { name: "Saravanampatti Tech Park", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0792, lng: 76.9996 },
    { name: "Singanallur Lake & Bus Terminal", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0031, lng: 77.0224 },
    { name: "Town Hall Bazaar Coimbatore", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9961, lng: 76.9622 },
    { name: "Kovai Pudur Residency", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9494, lng: 76.9298 },
    { name: "Eachanari Vinayagar Temple", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9392, lng: 77.0019 },
    { name: "Karpagam College of Engineering", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8784, lng: 77.0227 },
    { name: "Karpagam Institute of Technology", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8815, lng: 77.0253 },
    { name: "Karpagam Academy of Higher Education", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8798, lng: 77.0235 },
    { name: "Karpaga Vinayaga College of Engineering and Technology", district: "Chengalpattu", state: "Tamil Nadu", lat: 12.4487, lng: 79.8874 },
    { name: "Karpaga Vinayagar Temple", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9392, lng: 77.0019 },
    { name: "Gandhi Park", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0054, lng: 76.9471 },
    { name: "Gandhi Nagar", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9784, lng: 77.58 },
    { name: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", lat: 23.2156, lng: 72.6369 },
    { name: "Mahatma Gandhi Road", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9756, lng: 77.6068 },
    { name: "Gandhi Maidan", district: "Patna", state: "Bihar", lat: 25.617, lng: 85.1456 },
    { name: "Gandhi Museum", district: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1388 }
  ];
  if (!queryStr) {
    res.json([]);
    return;
  }
  let nominatimMatches = [];
  if (queryStr.length >= 3) {
    try {
      const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
      nominatimUrl.searchParams.set("q", queryStr);
      nominatimUrl.searchParams.set("format", "jsonv2");
      nominatimUrl.searchParams.set("addressdetails", "1");
      nominatimUrl.searchParams.set("limit", "10");
      nominatimUrl.searchParams.set("countrycodes", "in");
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": NOMINATIM_USER_AGENT,
          "Accept-Language": "en-IN,en;q=0.9"
        }
      });
      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();
        if (Array.isArray(data)) {
          nominatimMatches = data.map((place) => {
            const address = place.address || {};
            return {
              name: place.name || address.amenity || address.road || place.display_name?.split(",")[0] || "Unknown place",
              district: address.city || address.town || address.village || address.county || address.state_district || "India",
              state: address.state || "India",
              lat: Number(place.lat),
              lng: Number(place.lon),
              source: "Nominatim OpenStreetMap"
            };
          }).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
        }
      }
    } catch (e) {
      console.warn("Nominatim location search failed, using local Indian fallback data:", e);
    }
  }
  let fileMatches = [];
  try {
    const LOCAL_CITIES_FILE = import_path3.default.join(process.cwd(), "indian_cities.json");
    if (import_fs3.default.existsSync(LOCAL_CITIES_FILE)) {
      const cities = JSON.parse(import_fs3.default.readFileSync(LOCAL_CITIES_FILE, "utf-8"));
      if (Array.isArray(cities)) {
        fileMatches = cities.filter(
          (c) => c && (String(c.name || "").toLowerCase().includes(queryStr) || String(c.district || "").toLowerCase().includes(queryStr) || String(c.state || "").toLowerCase().includes(queryStr))
        ).map((c) => ({
          name: c.name || "Unknown City",
          district: c.district || "General",
          state: c.state || "India",
          lat: Number(c.lat) || 11.0168 + (Math.random() - 0.5) * 0.03,
          lng: Number(c.lng) || 76.9558 + (Math.random() - 0.5) * 0.03
        }));
      }
    }
  } catch (e) {
    console.error("Suggest file read failure:", e);
  }
  const landmarkMatches = coimbatoreLandmarks.filter(
    (l) => l && (String(l.name || "").toLowerCase().includes(queryStr) || String(l.district || "").toLowerCase().includes(queryStr) || String(l.state || "").toLowerCase().includes(queryStr))
  );
  const combined = [...landmarkMatches, ...nominatimMatches, ...fileMatches];
  const seenNames = /* @__PURE__ */ new Set();
  const uniqueMatches = combined.filter((m) => {
    if (!m) return false;
    const key = `${String(m.name || "").toLowerCase()}|${String(m.state || "").toLowerCase()}`;
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  res.json(uniqueMatches.slice(0, 15));
}));
apiRouter.post("/route-metrics", asyncWrapper(async (req, res) => {
  const { pLat, pLng, dLat, dLng } = req.body;
  if (pLat === void 0 || pLng === void 0 || dLat === void 0 || dLng === void 0) {
    res.status(400).json({ error: "Pickup and drop coordinates are required." });
    return;
  }
  const fallbackDistance = haversineDistanceKm(Number(pLat), Number(pLng), Number(dLat), Number(dLng));
  const fallbackDuration = Number((fallbackDistance * 2.1).toFixed(1));
  const orsApiKey = process.env.OPENROUTESERVICE_API_KEY || process.env.ORS_API_KEY || "";
  if (orsApiKey) {
    try {
      const orsResponse = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
        method: "POST",
        headers: {
          "Authorization": orsApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coordinates: [
            [Number(pLng), Number(pLat)],
            [Number(dLng), Number(dLat)]
          ],
          instructions: false
        })
      });
      if (orsResponse.ok) {
        const orsData = await orsResponse.json();
        const route = orsData.routes?.[0];
        if (route?.summary) {
          res.json({
            distance: Number((route.summary.distance / 1e3).toFixed(2)),
            duration: Number((route.summary.duration / 60).toFixed(1)),
            source: "OpenRouteService"
          });
          return;
        }
      }
    } catch (err) {
      console.warn("OpenRouteService routing failed, trying Geoapify/OSRM:", err);
    }
  }
  const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || "";
  if (geoapifyApiKey) {
    try {
      const geoapifyUrl = new URL("https://api.geoapify.com/v1/routing");
      geoapifyUrl.searchParams.set("waypoints", `${pLat},${pLng}|${dLat},${dLng}`);
      geoapifyUrl.searchParams.set("mode", "drive");
      geoapifyUrl.searchParams.set("apiKey", geoapifyApiKey);
      const geoapifyResponse = await fetch(geoapifyUrl);
      if (geoapifyResponse.ok) {
        const geoapifyData = await geoapifyResponse.json();
        const feature = geoapifyData.features?.[0];
        const props = feature?.properties || {};
        if (props.distance && props.time) {
          res.json({
            distance: Number((props.distance / 1e3).toFixed(2)),
            duration: Number((props.time / 60).toFixed(1)),
            source: "Geoapify Routing"
          });
          return;
        }
      }
    } catch (err) {
      console.warn("Geoapify routing failed, trying OSRM:", err);
    }
  }
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=false`;
    const response = await fetch(osrmUrl);
    if (response.ok) {
      const resData = await response.json();
      if (resData.routes && resData.routes.length > 0) {
        const route = resData.routes[0];
        const distanceKm = Number((route.distance / 1e3).toFixed(2));
        const durationMin = Number((route.duration / 60).toFixed(1));
        res.json({
          distance: distanceKm,
          duration: durationMin,
          source: "OSRM Real-time API"
        });
        return;
      }
    }
  } catch (err) {
    console.warn("OSRM routing request failed, falling back to geodetic model:", err);
  }
  res.json({
    distance: fallbackDistance,
    duration: fallbackDuration,
    source: "Geodetic Great-Circle Math (OSRM Fallback)"
  });
}));
apiRouter.post("/rides/:id/adjustment/trigger", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { trigger, amount, evidenceType, evidenceDescription } = req.body;
  if (!trigger || !amount) {
    res.status(400).json({ error: "Trigger and amount are required." });
    return;
  }
  if (ride.adjustmentStatus) {
    res.status(400).json({ error: "Adjustment already triggered for this ride." });
    return;
  }
  const cap = ride.initialFare * 0.3;
  let finalAmount = Number(amount);
  const wasCapped = finalAmount > cap;
  if (wasCapped) {
    finalAmount = Number(cap.toFixed(2));
  } else {
    finalAmount = Number(finalAmount.toFixed(2));
  }
  ride.adjustmentTrigger = trigger;
  ride.adjustmentAmount = finalAmount;
  ride.adjustmentEvidence = {
    type: evidenceType || "Sensor Log",
    description: evidenceDescription || "Auto-generated system log."
  };
  ride.adjustmentStatus = "pending";
  db.updateRide(ride);
  db.addAlert({
    id: `ADJ-${Date.now()}`,
    rideId: ride.id,
    type: "info",
    message: `System triggered a fare adjustment of \u20B9${finalAmount} for reason: ${trigger}. Awaiting rider consent.`,
    severity: "medium",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ ride, wasCapped });
});
apiRouter.post("/rides/:id/adjustment/respond", (req, res) => {
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const { action } = req.body;
  if (!ride.adjustmentStatus || ride.adjustmentStatus !== "pending") {
    res.status(400).json({ error: "No pending adjustment found for this ride." });
    return;
  }
  if (action === "accept") {
    ride.adjustmentStatus = "accepted";
    ride.finalFare = Number((ride.finalFare + (ride.adjustmentAmount || 0)).toFixed(2));
    db.addAlert({
      id: `ADJ-ACC-${Date.now()}`,
      rideId: ride.id,
      type: "info",
      message: `Rider accepted the fare adjustment of \u20B9${ride.adjustmentAmount}. New final fare is \u20B9${ride.finalFare}.`,
      severity: "low",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else if (action === "dispute") {
    ride.adjustmentStatus = "disputed";
    const disputeId = `DSPA-${Math.floor(1e4 + Math.random() * 9e4)}`;
    db.addDispute({
      id: disputeId,
      rideId: ride.id,
      pickup: ride.pickup,
      drop: ride.drop,
      driverName: ride.driverName || "Rajesh Kumar",
      safetyScore: ride.safetyScore,
      initialFare: ride.initialFare,
      finalFare: ride.finalFare,
      reason: `Disputed system fare adjustment (+\u20B9${ride.adjustmentAmount}) for ${ride.adjustmentTrigger}.`,
      status: "open",
      resolutionRefundAmount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.addAlert({
      id: `ADJ-DIS-${Date.now()}`,
      rideId: ride.id,
      type: "safety",
      message: `Rider disputed the fare adjustment. Ops review requested. Original fare locked pending review.`,
      severity: "high",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else {
    res.status(400).json({ error: "Invalid action. Must be accept or dispute." });
    return;
  }
  db.updateRide(ride);
  res.json(ride);
});
apiRouter.post("/emergency/trigger", (req, res) => {
  const { rideId, reason, isSilentSOS } = req.body;
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const allSosAlerts = db.getSosAlerts();
  const riderName = ride.riderName || "Saran";
  const riderAlerts = allSosAlerts.filter((a) => a.riderName === riderName);
  const sosCountPerUser = riderAlerts.length + 1;
  let severity = "high";
  if (["Vehicle Breakdown", "Other Emergency"].includes(reason)) {
    severity = "medium";
  } else if (["Feeling Unsafe", "Wrong Route"].includes(reason)) {
    severity = "high";
  }
  const sosAlert = {
    id: `SOS-${Math.floor(1e4 + Math.random() * 9e4)}`,
    rideId: ride.id,
    riderId: ride.riderId || "USR-SARAN",
    riderName,
    driverId: ride.driverId || "DRV001",
    driverName: ride.driverName || "Rajesh Kumar",
    vehicleNumber: ride.driverVehicle || "MH-02-AB-1234",
    reason: reason || "Feeling Unsafe",
    riderLocation: {
      lat: ride.riderLat || 19.076,
      lng: ride.riderLng || 72.8777
    },
    driverLocation: {
      lat: ride.driverLat || 19.0765,
      lng: ride.driverLng || 72.878
    },
    status: "active",
    severity,
    isSilentSOS: !!isSilentSOS,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  ride.isSilentSOS = !!isSilentSOS;
  ride.hasActiveSOS = true;
  db.updateRide(ride);
  db.addSosAlert(sosAlert);
  db.addAlert({
    id: `ALRT-SOS-${Date.now()}`,
    rideId: ride.id,
    type: "safety",
    message: isSilentSOS ? `\u{1F6A8} Silent SOS triggered by rider! Status: ACTIVE. Severity: HIGH.` : `\u{1F6A8} Emergency SOS triggered! Reason: ${reason}. Driver alerted.`,
    severity: "critical",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ sosAlert, sosCountPerUser });
});
apiRouter.post("/sos", (req, res) => {
  const { rideId, reason, isSilentSOS } = req.body;
  const rides = db.getRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  const allSosAlerts = db.getSosAlerts();
  const riderName = ride.riderName || "Saran";
  const riderAlerts = allSosAlerts.filter((a) => a.riderName === riderName);
  const sosCountPerUser = riderAlerts.length + 1;
  let severity = "high";
  if (["Vehicle Breakdown", "Other Emergency"].includes(reason)) {
    severity = "medium";
  } else if (["Feeling Unsafe", "Wrong Route"].includes(reason)) {
    severity = "high";
  }
  const sosAlert = {
    id: `SOS-${Math.floor(1e4 + Math.random() * 9e4)}`,
    rideId: ride.id,
    riderId: ride.riderId || "USR-SARAN",
    riderName,
    driverId: ride.driverId || "DRV001",
    driverName: ride.driverName || "Rajesh Kumar",
    vehicleNumber: ride.driverVehicle || "MH-02-AB-1234",
    reason: reason || "Feeling Unsafe",
    riderLocation: {
      lat: ride.riderLat || 19.076,
      lng: ride.riderLng || 72.8777
    },
    driverLocation: {
      lat: ride.driverLat || 19.0765,
      lng: ride.driverLng || 72.878
    },
    status: "active",
    severity,
    isSilentSOS: !!isSilentSOS,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  ride.isSilentSOS = !!isSilentSOS;
  ride.hasActiveSOS = true;
  db.updateRide(ride);
  db.addSosAlert(sosAlert);
  db.addAlert({
    id: `ALRT-SOS-${Date.now()}`,
    rideId: ride.id,
    type: "safety",
    message: isSilentSOS ? `\u{1F6A8} Silent SOS triggered by rider! Status: ACTIVE. Severity: HIGH.` : `\u{1F6A8} Emergency SOS triggered! Reason: ${reason}. Driver alerted.`,
    severity: "critical",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ sosAlert, sosCountPerUser });
});
apiRouter.get("/sos", (req, res) => {
  res.json(db.getSosAlerts());
});
apiRouter.get("/sos/:id", (req, res) => {
  const alerts = db.getSosAlerts();
  const alert = alerts.find((a) => a.id === req.params.id);
  if (!alert) {
    res.status(404).json({ error: "SOS alert not found" });
    return;
  }
  res.json(alert);
});
apiRouter.patch("/sos/:id", (req, res) => {
  const alerts = db.getSosAlerts();
  const alert = alerts.find((a) => a.id === req.params.id);
  if (!alert) {
    res.status(404).json({ error: "SOS alert not found" });
    return;
  }
  const { status } = req.body;
  if (!["active", "investigating", "resolved", "false_alarm"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  alert.status = status;
  db.updateSosAlert(alert);
  if (["resolved", "false_alarm"].includes(status)) {
    const rides = db.getRides();
    const ride = rides.find((r) => r.id === alert.rideId);
    if (ride) {
      ride.hasActiveSOS = false;
      db.updateRide(ride);
    }
  }
  db.addAlert({
    id: `ALRT-SOS-UPD-${Date.now()}`,
    rideId: alert.rideId,
    type: "safety",
    message: `SOS alert ${alert.id} status updated to: ${status.toUpperCase()}.`,
    severity: status === "resolved" ? "info" : "medium",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json(alert);
});

// server.ts
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3001;
  app.use(import_express2.default.json());
  app.use(import_express2.default.urlencoded({ extended: true }));
  app.use("/api", apiRouter);
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in Development mode - booting Vite dev middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in Production mode - serving static assets...");
    const distPath = import_path4.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path4.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZipRide live full-stack server running at http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal crash during server startup:", err);
});
//# sourceMappingURL=server.cjs.map
