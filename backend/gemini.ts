import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Initialize Gemini client lazily to avoid immediate failure if API key is not yet present
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Mock fallback will be used.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Summarizes the ride telemetry, safety telemetry events (overspeeding, harsh brakes), and dynamic pricing factors
 * to output an official operations-friendly summary of a ride dispute, along with automated pricing decision logs.
 */
export async function summarizeDispute(
  rideSummary: {
    pickup: string;
    drop: string;
    driverName: string;
    safetyScore: number;
    initialFare: number;
    finalFare: number;
    overspeedEvents: number;
    harshBrakeEvents: number;
    weather: string;
    traffic: string;
    userStateReason: string;
  }
): Promise<string> {
  const prompt = `You are ZipRide's Lead Dispute Analyst. Review this ride's details, telemetries, and the user's filed dispute complaint.
Provide a clear, brief, structured analysis of the dispute as bullet points:
- Analysis of the incident (highlight weather, traffic, and dynamic price factors)
- Assessment of driver behavior (specifically overspeeding [${rideSummary.overspeedEvents} times] and harsh braking [${rideSummary.harshBrakeEvents} times] relative to safety rules)
- Pricing/cost adjustment log (explain why the price dropped from ₹${rideSummary.initialFare.toFixed(2)} to ₹${rideSummary.finalFare.toFixed(2)} based on behavioral discounts)
- Final Ops Recommendation (Confirm refund/resolution status)

Ride Details:
Pickup: ${rideSummary.pickup}
Drop: ${rideSummary.drop}
Driver: ${rideSummary.driverName}
Weather Condition during ride: ${rideSummary.weather}
Traffic congestion level: ${rideSummary.traffic}
Initial Fare: ₹${rideSummary.initialFare.toFixed(2)}
Final Charged Fare: ₹${rideSummary.finalFare.toFixed(2)}
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
        temperature: 0.2,
      }
    });
    return response.text || getMockDisputeSummary(rideSummary);
  } catch (error) {
    console.error("Gemini API dispute summary failed, falling back to mock:", error);
    return getMockDisputeSummary(rideSummary);
  }
}

/**
 * Direct real-time RAG system answering user's queries about pricing, safety penalties, weather/traffic surcharges, and behavior adjustments.
 */
export async function askGeminiAssist(
  question: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  context?: string
): Promise<string> {
  const systemInstruction = `You are the ZipRide Operations and Safety Support Agent. You guide riders, drivers, and ops managers with extreme safety compliance expertise.
Rely on ZipRide's explicit policy parameters:
1. Base Fare: ₹20.00
2. Per-Kilometer Charge: ₹12.00/km
3. Per-Minute Charge: ₹1.50/min
4. Weather Surcharges (Added to Base):
   - Clear: No surcharge (Limit: 80 km/h)
   - Overcast: +₹10.00 base, Safety warning speed: 75 km/h
   - High Winds: +₹20.00 base, Safety warning speed: 65 km/h
   - Heavy Rain: +₹30.00 base, Safety warning speed: 60 km/h
   - Monsoon Storm: +₹50.00 base, Safety warning speed: 50 km/h
5. Traffic Surcharges (Multipliers applied to Distance/Time fares & ETA duration multiplier):
   - Light: 1.0x (No multiplier)
   - Moderate: 1.1x multiplier, ETA: 1.3x
   - Heavy Congestion: 1.3x multiplier, ETA: 1.8x
   - Gridlock: 1.5x multiplier, ETA: 2.5x
6. Behavior Penalties & Cost Dropping discounts:
   - Overspeeding (Going past warning speed): Triggers an immediate safety warning. Each incident drops the customer's fare cost by ₹15.00 (discount applied directly, deducted from driver's settlement).
   - Harsh Braking (Abrupt deceleration): Triggers safety check. Each incident drops the customer's fare cost by ₹10.00 (discount applied directly, deducted from driver's settlement).
   - High safety score keeps fare intact. Low safety score (<80%) guarantees additional fare protection.

Be helpful, professional, scannable, and extremely clear. Do not cite fake formulas, speak about code files, or output dry developer logs. Speak as an executive customer helper.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getMockAssistAnswer(question);
    }
    const client = getGeminiClient();
    
    // Convert history into the structure expected by the modern SDK
    const pastChats = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.parts[0].text }]
    }));

    const contents = [
      { role: 'user' as const, parts: [{ text: systemInstruction + (context ? `\n\nActive State Grounding Context:\n${context}` : "") }] },
      ...pastChats,
      { role: 'user' as const, parts: [{ text: question }] }
    ];

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        temperature: 0.5,
      }
    });

    return response.text || getMockAssistAnswer(question);
  } catch (error) {
    console.error("Gemini API assist assistant failed:", error);
    return getMockAssistAnswer(question);
  }
}

function getMockDisputeSummary(ride: any): string {
  return `### **ZipRide Automated Operations Dispute Analysis (AI Fallback)**

- **Weather & Traffic Surcharges**: Reviewed. Ride operated during **${ride.weather}** with **${ride.traffic}** traffic. The initial base fare of ₹${ride.initialFare.toFixed(2)} correctly factored environment surcharges.
- **Safety Telemetry Review**: 
  - **Overspeeding Events**: ${ride.overspeedEvents} warnings issued. Driver exceeded safe guidelines.
  - **Harsh Braking Events**: ${ride.harshBrakeEvents} sudden safety stops registered.
- **Cost Adjustments Log**: Real-time telemetry flagged ${ride.overspeedEvents + ride.harshBrakeEvents} behavioral violations. Combined safety discounts successfully dropped the final client fare to **₹${ride.finalFare.toFixed(2)}** (a total safety discount of ₹${(ride.initialFare - ride.finalFare).toFixed(2)} was credited).
- **Executive Recommendation**: Complaint is **VALID**. The safety score of **${ride.safetyScore}%** warrants processing a final full fare lock, and warning the driver (ID: Rajesh Kumar) for reckless transit behavior. No further refund is required as the safety discount was already subtracted in real-time.`;
}

function getMockAssistAnswer(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('weather') || q.includes('rain') || q.includes('storm')) {
    return `### **ZipRide Weather Dynamic Fare Surcharges**

- **Clear**: No surcharge (Standard 80 km/h baseline speed ceiling).
- **Overcast**: **+₹10.00** base surcharge (Safety limit drops to 75 km/h).
- **High Winds**: **+₹20.00** base surcharge (Safety limit drops to 65 km/h).
- **Heavy Rain**: **+₹30.00** base surcharge (Safety limit drops to 60 km/h).
- **Monsoon Storm**: **+₹50.00** base surcharge (Safety limit drops to 50 km/h).

*Note: All speed violations under monsoon weather count as overspeeding and subtract ₹15.00 from your fare dynamically!*`;
  }
  
  if (q.includes('traffic') || q.includes('gridlock') || q.includes('congest')) {
    return `### **ZipRide Traffic Congestion Multipliers**

- **Light Traffic**: **1.0x** (No extra surcharge).
- **Moderate Traffic**: **1.1x** multiplier (ETA increases by 1.3x).
- **Heavy Traffic**: **1.3x** multiplier (ETA increases by 1.8x).
- **Gridlock Traffic**: **1.5x** multiplier (ETA increases by 2.5x).

*Wait-times are calculated in real-time, but fares are strictly locked once the ride begins!*`;
  }

  if (q.includes('overspeed') || q.includes('brake') || q.includes('safety') || q.includes('behavior')) {
    return `### **ZipRide Real-Time Safety Adjustments**

We actively monitor active speed and behavioral safety telemetries during ZipRide bookings:
- **Overspeeding**: If the speed exceeds the dynamic weather ceiling, a warning alert triggers. Each warning automatically **reduces your ride cost by ₹15.00** to compensate for the hazard.
- **Harsh Braking**: If the driver brakes abruptly (instantly losing >20 km/h), a warning alerts operations. Each warning automatically **reduces your ride cost by ₹10.00**.

*All behavioral deductions are displayed live on your ride tracker and deducted directly from the driver's final checkout settlement!*`;
  }

  return `### **Welcome to ZipRide Ops Support**
196: 
197: I can help with questions regarding:
198: - **Base/Kilometer/Time rate systems** (₹20 base, ₹12/km, ₹1.5/min).
199: - **Weather dynamic surcharges** (Drizzle, High Winds, Heavy Rain, Storms).
200: - **Traffic multiplier indexes** (Light, Moderate, Heavy, Gridlock).
201: - **Driver safety behaviour adjustments** (Overspeeding warnings: -₹15, Abrupt deceleration: -₹10).
202: 
203: How can I assist you with ZipRide guidelines today?`;
}

/**
 * Executes a geographic query against the cached indian_cities.json file using Gemini.
 */
export async function queryGeographicCities(userQuery: string): Promise<{ answer: string; source: 'gemini' | 'programmatic' }> {
  const LOCAL_CITIES_FILE = path.join(process.cwd(), 'indian_cities.json');
  let citiesData = "";
  let rawCities: any[] = [];
  try {
    if (fs.existsSync(LOCAL_CITIES_FILE)) {
      citiesData = fs.readFileSync(LOCAL_CITIES_FILE, 'utf-8');
      rawCities = JSON.parse(citiesData);
    } else {
      // Fetch it directly in case
      console.log("Fetching cities.json from raw source on demand...");
      const res = await fetch("https://raw.githubusercontent.com/thatisuday/indian-cities-database/master/cities.json");
      if (res.ok) {
        citiesData = await res.text();
        fs.writeFileSync(LOCAL_CITIES_FILE, citiesData, 'utf-8');
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
      source: 'programmatic'
    };
  }

  try {
    const client = getGeminiClient();
    
    // To fit neatly and keep it highly optimized, we'll pass the first 800KB of the file content
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: 'user', parts: [
          { text: systemInstruction },
          { text: `ATTACHED DOCUMENT (cities.json):\n${citiesData.slice(0, 800000)}` },
          { text: `USER QUERY: ${userQuery}` }
        ]}
      ],
      config: {
        temperature: 0.1,
      }
    });

    return {
      answer: response.text || getProgrammaticQueryFallback(userQuery, rawCities),
      source: 'gemini'
    };
  } catch (err) {
    console.error("Gemini city query failed, running programmatic fallback:", err);
    return {
      answer: getProgrammaticQueryFallback(userQuery, rawCities),
      source: 'programmatic'
    };
  }
}

function getProgrammaticQueryFallback(query: string, cities: any[]): string {
  const qClean = query.toLowerCase();
  
  if (!cities || cities.length === 0) {
    return "The geographic database file is currently loading or was empty. Please check back in a few seconds.";
  }

  // Extract unique states & districts
  const states = Array.from(new Set(cities.map(c => String(c.state || '').trim())));
  const districts = Array.from(new Set(cities.map(c => String(c.district || '').trim())));
  
  let foundState = states.find(s => qClean.includes(s.toLowerCase()));
  let foundDistrict = districts.find(d => qClean.includes(d.toLowerCase()));

  if (foundState) {
    const filtered = cities.filter(c => String(c.state).toLowerCase() === foundState!.toLowerCase());
    if (filtered.length === 0) {
      return `Politely informing you that places in "${foundState}" are missing from the database.`;
    }
    
    const grouped: Record<string, string[]> = {};
    filtered.forEach(c => {
      const dist = c.district || 'General';
      if (!grouped[dist]) grouped[dist] = [];
      if (!grouped[dist].includes(c.name)) {
        grouped[dist].push(c.name);
      }
    });

    let res = `### Available Cities in **${foundState}** (Programmatic Search Online)\n\n`;
    Object.entries(grouped).sort().forEach(([dist, names]) => {
      res += `* **District: ${dist}**\n`;
      names.sort().forEach(name => {
        res += `  - ${name}\n`;
      });
    });
    return res;
  }

  if (foundDistrict) {
    const filtered = cities.filter(c => String(c.district).toLowerCase() === foundDistrict!.toLowerCase());
    if (filtered.length === 0) {
      return `Politely informing you that places in "${foundDistrict}" are missing from the database.`;
    }
    
    let res = `### Available Cities in District: **${foundDistrict}** (Programmatic Search Online)\n\n`;
    filtered.sort((a,b) => String(a.name).localeCompare(String(b.name))).forEach(c => {
      res += `- ${c.name} (State: ${c.state})\n`;
    });
    return res;
  }

  // General search fallback
  const searchTerms = qClean.split(/\s+/).filter(w => w.length > 2 && !['list', 'all', 'the', 'available', 'cities', 'in', 'of', 'and', 'place', 'places', 'located', 'find', 'from'].includes(w));
  if (searchTerms.length > 0) {
    const filtered = cities.filter(c => 
      searchTerms.some(term => 
        String(c.name).toLowerCase().includes(term) || 
        String(c.state).toLowerCase().includes(term) || 
        String(c.district).toLowerCase().includes(term)
      )
    );
    if (filtered.length > 0) {
      const grouped: Record<string, string[]> = {};
      filtered.forEach(c => {
        const state = c.state || 'Unknown';
        if (!grouped[state]) grouped[state] = [];
        const label = `${c.name} (District: ${c.district || 'N/A'})`;
        if (!grouped[state].includes(label)) {
          grouped[state].push(label);
        }
      });

      let res = `### Search Results for "${searchTerms.join(' ')}" (Programmatic Search Online)\n\n`;
      Object.entries(grouped).forEach(([state, names]) => {
        res += `* **State: ${state}**\n`;
        names.slice(0, 50).forEach(name => {
          res += `  - ${name}\n`;
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
