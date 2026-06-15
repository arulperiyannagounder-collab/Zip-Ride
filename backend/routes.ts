import { Router, Request, Response, NextFunction } from 'express';
import { db, Ride, Dispute, AlertLog } from './db.js';
import { summarizeDispute, askGeminiAssist, queryGeographicCities } from './gemini.js';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Middleware to catch async route errors gracefully
const asyncWrapper = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const NOMINATIM_USER_AGENT = process.env.APP_URL || 'ZipRideLocalBooking/1.0';

const haversineDistanceKm = (pLat: number, pLng: number, dLat: number, dLng: number) => {
  const R = 6371;
  const dLatRad = (dLat - pLat) * Math.PI / 180;
  const dLonRad = (dLng - pLng) * Math.PI / 180;
  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(pLat * Math.PI / 180) * Math.cos(dLat * Math.PI / 180) *
    Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

// 1. GET SYSTEM STATE (WEATHER, TRAFFIC, GLOBAL COUNTS)
apiRouter.get('/system-state', (req: Request, res: Response) => {
  const config = db.getConfig();
  const rides = db.getRides();
  const alerts = db.getAlerts();
  
  // Calculate analytics
  const activeRides = rides.filter(r => ['booked', 'assigned', 'pickup', 'en_route', 'anomaly'].includes(r.status));
  const completedToday = rides.filter(r => r.status === 'completed');
  const revenue = completedToday.reduce((total, r) => total + r.finalFare, 0);
  
  const overspeedCount = alerts.filter(a => a.type === 'speed').length;
  const harshBrakeCount = alerts.filter(a => a.type === 'braking').length;

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

// 2. POST UPDATE SYSTEM STATE
apiRouter.post('/system-state', (req: Request, res: Response) => {
  const { weather, traffic } = req.body;
  if (!weather || !traffic) {
    res.status(400).json({ error: 'Weather and Traffic are required fields.' });
    return;
  }
  db.setConfig(weather, traffic);
  
  // Add operation notification log
  db.addAlert({
    id: `SYS-${Date.now()}`,
    rideId: 'SYSTEM',
    type: 'info',
    message: `System environment adjusted: Weather is now "${weather}", Traffic level is now "${traffic}".`,
    severity: 'info',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, config: db.getConfig() });
});

// 3. GET DRIVERS
apiRouter.get('/drivers', (req: Request, res: Response) => {
  res.json(db.getDrivers());
});

// 4. GET ALL RIDES
apiRouter.get('/rides', (req: Request, res: Response) => {
  res.json(db.getRides());
});

// 5. GET SINGLE RIDE
apiRouter.get('/rides/:id', (req: Request, res: Response) => {
  const ride = db.getRides().find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }
  res.json(ride);
});

// 6. POST CREATE (BOOK) A RIDE WITH DYNAMIC PRICING ALGORITHM
apiRouter.post('/rides', (req: Request, res: Response) => {
  const { 
    pickup, 
    drop, 
    paymentMethod,
    distanceKm: clientDistance,
    durationMin: clientDuration,
    weatherType: clientWeather,
    trafficType: clientTraffic,
    initialFare: clientFare,
    gpsLat: clientLat,
    gpsLng: clientLng
  } = req.body;

  if (!pickup || !drop || !paymentMethod) {
    res.status(400).json({ error: 'Pickup, drop, and paymentMethod are required.' });
    return;
  }

  const rideId = `ZR-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Retrieve current weather and traffic from system configuration or client calculations
  const sysConfig = db.getConfig();
  const weather = clientWeather || sysConfig.weather;
  const traffic = clientTraffic || sysConfig.traffic;

  // Use client values if available, otherwise calculate using default estimations
  let distanceKm = clientDistance;
  if (distanceKm === undefined) {
    const rawDist = 2.0 + (Math.abs(pickup.length - drop.length) % 12) * 1.1 + (pickup.charCodeAt(0) % 5) * 0.5;
    distanceKm = Number(rawDist.toFixed(2));
  }

  let durationMin = clientDuration;
  let baseDuration = distanceKm * 3.0;

  // Surcharges and factors
  let weatherSurcharge = 0;
  if (weather === 'Overcast') weatherSurcharge = 10;
  else if (weather === 'High Winds') weatherSurcharge = 20;
  else if (weather === 'Heavy Rain') weatherSurcharge = 30;
  else if (weather === 'Monsoon Storm') weatherSurcharge = 50;

  let trafficMultiplier = 1.0;
  let etaMultiplier = 1.0;
  if (traffic === 'Moderate') {
    trafficMultiplier = 1.1;
    etaMultiplier = 1.3;
  } else if (traffic === 'Heavy Congestion') {
    trafficMultiplier = 1.3;
    etaMultiplier = 1.8;
  } else if (traffic === 'Gridlock') {
    trafficMultiplier = 1.5;
    etaMultiplier = 2.5;
  }

  if (durationMin === undefined) {
    durationMin = Number((baseDuration * etaMultiplier).toFixed(1));
  }

  const baseFare = 20.0;
  const distanceFare = Number((distanceKm * 12.0).toFixed(2)); // ₹12 per km
  const durationFare = Number((durationMin * 1.5).toFixed(2)); // ₹1.5 per minute

  const environmentalTransitCharges = (distanceFare + durationFare) * (trafficMultiplier - 1.0);
  
  let initialFare = clientFare;
  if (initialFare === undefined) {
    initialFare = Number((baseFare + weatherSurcharge + distanceFare + durationFare + environmentalTransitCharges).toFixed(2));
  }

  // Lat and Lng starting points
  const gpsLat = clientLat !== undefined ? clientLat : 19.0760;
  const gpsLng = clientLng !== undefined ? clientLng : 72.8777;

  const newRide: Ride = {
    id: rideId,
    pickup,
    drop,
    distanceKm,
    durationMin,
    baseFare,
    distanceFare,
    durationFare,
    weatherType: weather,
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
    status: 'booked',
    createdAt: new Date().toISOString(),
    
    // Coordinates
    gpsLat,
    gpsLng,
    speed: 0.0,
    ignition: 'off',
    seat: 'empty',
    motion: 'stationary',
    nfc: 'inactive',
    progress: 0
  };

  db.addRide(newRide);

  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId: rideId,
    type: 'info',
    message: `Ride ${rideId} booked. Pickup: "${pickup}" -> Drop: "${drop}". Dynamic Fare calculated at ₹${initialFare} (Weather fee: +₹${weatherSurcharge}, Traffic Multiplier: ${trafficMultiplier}x, Dist: ${distanceKm} km).`,
    severity: 'info',
    timestamp: new Date().toISOString()
  });

  res.json(newRide);
});

// 7. POST ACCEPT RIDE (DRIVER TAKES RIDE)
apiRouter.post('/rides/:id/accept', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  // Grab the first online driver or fallback
  const driver = db.getDrivers().find(d => d.status === 'online') || db.getDrivers()[0];

  ride.status = 'assigned';
  ride.driverId = driver.id;
  ride.driverName = driver.name;
  ride.driverVehicle = driver.vehicle;
  ride.driverRating = driver.rating;
  ride.progress = 0;
  ride.ignition = 'on';
  ride.seat = 'empty';
  ride.motion = 'stationary';

  db.updateRide(ride);

  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId: ride.id,
    type: 'info',
    message: `Driver "${driver.name}" (${driver.vehicle}) accepted ride ${ride.id} and is heading to the pickup location.`,
    severity: 'low',
    timestamp: new Date().toISOString()
  });

  res.json(ride);
});

// 8. POST UPDATE TELEMETRY (DYNAMIC SPEED & DRIVER BEHAVIOR OVER-SPEED/HARSH BRAKE SENSORS)
apiRouter.post('/rides/:id/telemetry', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  const { gpsLat, gpsLng, speed, ignition, seat, motion, nfc, progress, triggerHarshBrake } = req.body;

  if (gpsLat !== undefined) ride.gpsLat = Number(gpsLat);
  if (gpsLng !== undefined) ride.gpsLng = Number(gpsLng);
  if (speed !== undefined) ride.speed = Number(speed);
  if (ignition !== undefined) ride.ignition = ignition;
  if (seat !== undefined) ride.seat = seat;
  if (motion !== undefined) ride.motion = motion;
  if (nfc !== undefined) ride.nfc = nfc;
  if (progress !== undefined) {
    ride.progress = Number(progress);
    
    // Automatically transition statuses based on progress metric
    if (ride.progress > 0 && ride.progress < 25 && ride.status === 'assigned') {
      ride.status = 'pickup';
    } else if (ride.progress >= 25 && ride.progress < 100 && (ride.status === 'pickup' || ride.status === 'assigned')) {
      ride.status = 'en_route';
      ride.seat = 'occupied';
      ride.nfc = 'active';
    } else if (ride.progress >= 100 && ride.status === 'en_route') {
      ride.status = 'arrived';
      ride.speed = 0;
      ride.motion = 'stationary';
      ride.seat = 'empty';
      ride.nfc = 'inactive';
    }
  }

  // DYNAMIC COMPLIANCE & SAFETY THRESHOLDS BASED ON WEATHTER
  // Baseline limit is 80 km/h, rain reduces safety margins
  let safeSpeedLimit = 80;
  if (ride.weatherType === 'Overcast') safeSpeedLimit = 75;
  else if (ride.weatherType === 'High Winds') safeSpeedLimit = 65;
  else if (ride.weatherType === 'Heavy Rain') safeSpeedLimit = 60;
  else if (ride.weatherType === 'Monsoon Storm') safeSpeedLimit = 50;

  // OVER-SPEED DETECTION
  if (ride.speed > safeSpeedLimit) {
    ride.overspeedEvents += 1;
    ride.safetyScore = Math.max(10, ride.safetyScore - 10);
    
    // Settle dynamic rider discount: compensation of ₹15.00 per overspeed event
    const overspeedPenaltyDiscount = 15.00;
    ride.behaviorDiscount += overspeedPenaltyDiscount;
    
    db.addAlert({
      id: `SPD-${Date.now()}-${Math.random()}`,
      rideId: ride.id,
      type: 'speed',
      message: `Speed Violation on Ride ${ride.id}! Driver recorded speed of ${ride.speed} km/h (Limit set at ${safeSpeedLimit} km/h due to "${ride.weatherType}"). Dynamic billing applied a ₹${overspeedPenaltyDiscount.toFixed(2)} refund discount.`,
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  }

  // HARSH BRAKING DETECTION
  if (triggerHarshBrake === true) {
    ride.harshBrakeEvents += 1;
    ride.safetyScore = Math.max(10, ride.safetyScore - 10);
    
    // Compensation of ₹10.00 per harsh brake incident
    const harshBrakingPenaltyDiscount = 10.00;
    ride.behaviorDiscount += harshBrakingPenaltyDiscount;
    ride.motion = 'braking';

    db.addAlert({
      id: `BRK-${Date.now()}-${Math.random()}`,
      rideId: ride.id,
      type: 'braking',
      message: `Harsh Deceleration detected on Ride ${ride.id}! Telemetry recorded rapid safety brake shift. Dynamic billing applied a ₹${harshBrakingPenaltyDiscount.toFixed(2)} safety refund discount.`,
      severity: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  // Compute final fare (subtract discounts, baseline floor is baseFare ₹20)
  ride.finalFare = Number(Math.max(20.0, ride.initialFare - ride.behaviorDiscount).toFixed(2));

  db.updateRide(ride);
  res.json(ride);
});

// 9. POST COMPLETE RIDE
apiRouter.post('/rides/:id/complete', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  ride.status = 'completed';
  ride.progress = 100;
  ride.completedAt = new Date().toISOString();
  ride.speed = 0;
  ride.motion = 'stationary';
  ride.seat = 'empty';
  ride.nfc = 'inactive';

  db.updateRide(ride);

  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId: ride.id,
    type: 'info',
    message: `Ride ${ride.id} successfully completed. Total Charged: ₹${ride.finalFare} (Deductions for behavior: -₹${ride.behaviorDiscount}). Final safety score: ${ride.safetyScore}%.`,
    severity: 'info',
    timestamp: new Date().toISOString()
  });

  res.json(ride);
});

// 10. GET DISPUTES
apiRouter.get('/disputes', (req: Request, res: Response) => {
  res.json(db.getDisputes());
});

// 11. POST FILE COMPLAINT / RIDE DISPUTE (TRIGGERS GEMINI ANALYSIS IN BACKGROUND)
apiRouter.post('/rides/:id/dispute', asyncWrapper(async (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  const { reason } = req.body;
  if (!reason) {
    res.status(400).json({ error: 'A physical reason description is required for disputes' });
    return;
  }

  const disputeId = `DSP-${Math.floor(10000 + Math.random() * 90000)}`;

  const newDispute: Dispute = {
    id: disputeId,
    rideId: ride.id,
    pickup: ride.pickup,
    drop: ride.drop,
    driverName: ride.driverName || 'Rajesh Kumar',
    safetyScore: ride.safetyScore,
    initialFare: ride.initialFare,
    finalFare: ride.finalFare,
    reason,
    status: 'open',
    resolutionRefundAmount: 0.0,
    createdAt: new Date().toISOString()
  };

  db.addDispute(newDispute);

  // Async query to Gemini to generate the summary
  try {
    const aiExplanation = await summarizeDispute({
      pickup: ride.pickup,
      drop: ride.drop,
      driverName: ride.driverName || 'Rajesh Kumar',
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
    console.error('Async dispute summarizer failed:', err);
  }

  db.addAlert({
    id: `SYS-${Date.now()}`,
    rideId: ride.id,
    type: 'safety',
    message: `Dispute ${disputeId} filed for Ride ${ride.id} by rider. Reason: "${reason}". AI analyst prompted.`,
    severity: 'medium',
    timestamp: new Date().toISOString()
  });

  res.json(newDispute);
}));

// 12. POST RESOLVE DISPUTE
apiRouter.post('/disputes/:id/resolve', (req: Request, res: Response) => {
  const disputes = db.getDisputes();
  const dispute = disputes.find(d => d.id === req.params.id);
  if (!dispute) {
    res.status(404).json({ error: 'Dispute not found' });
    return;
  }

  const { status, refundAmount } = req.body;
  if (!status || !['resolved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Valid status ("resolved" or "rejected") is required.' });
    return;
  }

  dispute.status = status;
  if (status === 'resolved' && refundAmount !== undefined) {
    dispute.resolutionRefundAmount = Number(refundAmount);
  } else {
    dispute.resolutionRefundAmount = 0.0;
  }

  db.updateDispute(dispute);

  db.addAlert({
    id: `SYS-${Date.now()}`,
    rideId: dispute.rideId,
    type: 'safety',
    message: `Dispute ${dispute.id} was ${status.toUpperCase()} by Operations. Refund processed: ₹${dispute.resolutionRefundAmount}.`,
    severity: 'low',
    timestamp: new Date().toISOString()
  });

  res.json(dispute);
});

// 13. GET ACTIVE ALERTS / NOTIFICATION LOG FEEDS
apiRouter.get('/alerts', (req: Request, res: Response) => {
  res.json(db.getAlerts());
});

// 14. POST GEMINI REAL-TIME GROUNDED ASSISTANT
apiRouter.post('/gemini/assist', asyncWrapper(async (req: Request, res: Response) => {
  const { question, history } = req.body;
  if (!question) {
    res.status(400).json({ error: 'A user question query is required.' });
    return;
  }

  const answer = await askGeminiAssist(question, history || []);
  res.json({ answer });
}));

// 15. GET GEOGRAPHIC DATA RETRIEVAL STATUS (DOWNLOADS cities.json FROM GITHUB IF MISSING)
apiRouter.get('/geographic/status', asyncWrapper(async (req: Request, res: Response) => {
  const LOCAL_CITIES_FILE = path.join(process.cwd(), 'indian_cities.json');
  let exists = fs.existsSync(LOCAL_CITIES_FILE);
  let metadata = { sizeBytes: 0, citiesCount: 0, statesCount: 0, districtsCount: 0, lastModified: '' };

  if (exists) {
    try {
      const stats = fs.statSync(LOCAL_CITIES_FILE);
      const data = JSON.parse(fs.readFileSync(LOCAL_CITIES_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        const uniqueStates = new Set(data.map(c => String(c.state || '').trim()));
        const uniqueDistricts = new Set(data.map(c => String(c.district || '').trim()));
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
        fs.writeFileSync(LOCAL_CITIES_FILE, text, 'utf-8');
        exists = true;
        
        const data = JSON.parse(text);
        const stats = fs.statSync(LOCAL_CITIES_FILE);
        const uniqueStates = new Set(data.map((c: any) => String(c.state || '').trim()));
        const uniqueDistricts = new Set(data.map((c: any) => String(c.district || '').trim()));
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

// 16. POST GEOGRAPHIC DATA RETRIEVAL QUERY (RAG ENGINE INTERFACE matching python logic)
apiRouter.post('/geographic/query', asyncWrapper(async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    res.status(400).json({ error: 'A geographic search query is required.' });
    return;
  }

  const result = await queryGeographicCities(query);
  res.json(result);
}));

// 17. GET DYNAMIC AUTOCOMPLETE SUGGESTIONS INTEGRATED WITH CITIES.JSON & COIMBATORE LANDMARKS
apiRouter.get('/geographic/suggest', asyncWrapper(async (req: Request, res: Response) => {
  const queryStr = String(req.query.q || '').trim().toLowerCase();
  
  // Seeded rich Coimbatore area locations with precise coordinates for high-fidelity booking simulation
  const coimbatoreLandmarks = [
    { name: "Ukkadam Bus Stand", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9950, lng: 76.9609 },
    { name: "Ukkadam Lake Promenade", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9925, lng: 76.9585 },
    { name: "Gandhipuram Town Central Bus Stand", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
    { name: "RS Puram East Club Road", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0093, lng: 76.9453 },
    { name: "Othakalmandapam Central", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8715, lng: 77.0210 },
    { name: "Peelamedu Coimbatore Airport (CJB)", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0200, lng: 77.0434 },
    { name: "Coimbatore Junction Railway Station", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0000, lng: 76.9667 },
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
    { name: "Gandhi Nagar", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9784, lng: 77.5800 },
    { name: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", lat: 23.2156, lng: 72.6369 },
    { name: "Mahatma Gandhi Road", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9756, lng: 77.6068 },
    { name: "Gandhi Maidan", district: "Patna", state: "Bihar", lat: 25.6170, lng: 85.1456 },
    { name: "Gandhi Museum", district: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1388 }
  ];

  if (!queryStr) {
    res.json([]);
    return;
  }

  let nominatimMatches: any[] = [];
  if (queryStr.length >= 3) {
    try {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.set('q', queryStr);
      nominatimUrl.searchParams.set('format', 'jsonv2');
      nominatimUrl.searchParams.set('addressdetails', '1');
      nominatimUrl.searchParams.set('limit', '10');
      nominatimUrl.searchParams.set('countrycodes', 'in');

      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': NOMINATIM_USER_AGENT,
          'Accept-Language': 'en-IN,en;q=0.9'
        }
      });

      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();
        if (Array.isArray(data)) {
          nominatimMatches = data.map((place: any) => {
            const address = place.address || {};
            return {
              name: place.name || address.amenity || address.road || place.display_name?.split(',')[0] || 'Unknown place',
              district: address.city || address.town || address.village || address.county || address.state_district || 'India',
              state: address.state || 'India',
              lat: Number(place.lat),
              lng: Number(place.lon),
              source: 'Nominatim OpenStreetMap'
            };
          }).filter((place: any) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
        }
      }
    } catch (e) {
      console.warn("Nominatim location search failed, using local Indian fallback data:", e);
    }
  }

  let fileMatches: any[] = [];
  try {
    const LOCAL_CITIES_FILE = path.join(process.cwd(), 'indian_cities.json');
    if (fs.existsSync(LOCAL_CITIES_FILE)) {
      const cities = JSON.parse(fs.readFileSync(LOCAL_CITIES_FILE, 'utf-8'));
      if (Array.isArray(cities)) {
        fileMatches = cities.filter(c => 
          c && (
            String(c.name || '').toLowerCase().includes(queryStr) ||
            String(c.district || '').toLowerCase().includes(queryStr) ||
            String(c.state || '').toLowerCase().includes(queryStr)
          )
        ).map(c => ({
          name: c.name || "Unknown City",
          district: c.district || "General",
          state: c.state || "India",
          lat: Number(c.lat) || (11.0168 + (Math.random() - 0.5) * 0.03),
          lng: Number(c.lng) || (76.9558 + (Math.random() - 0.5) * 0.03)
        }));
      }
    }
  } catch (e) {
    console.error("Suggest file read failure:", e);
  }

  // Handle Coimbatore local landmarks search
  const landmarkMatches = coimbatoreLandmarks.filter(l => 
    l && (
      String(l.name || '').toLowerCase().includes(queryStr) ||
      String(l.district || '').toLowerCase().includes(queryStr) ||
      String(l.state || '').toLowerCase().includes(queryStr)
    )
  );

  const combined = [...landmarkMatches, ...nominatimMatches, ...fileMatches];
  const seenNames = new Set();
  const uniqueMatches = combined.filter(m => {
    if (!m) return false;
    const key = `${String(m.name || '').toLowerCase()}|${String(m.state || '').toLowerCase()}`;
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  res.json(uniqueMatches.slice(0, 15));
}));

// 18. POST REAL-TIME ROUTE METRICS FROM PUBLIC WEB ROUTING ENGINE (OSRM)
apiRouter.post('/route-metrics', asyncWrapper(async (req: Request, res: Response) => {
  const { pLat, pLng, dLat, dLng } = req.body;
  if (pLat === undefined || pLng === undefined || dLat === undefined || dLng === undefined) {
    res.status(400).json({ error: 'Pickup and drop coordinates are required.' });
    return;
  }

  // Pre-calculate geodetic Haversine straight line as dynamic safety fallback
  const fallbackDistance = haversineDistanceKm(Number(pLat), Number(pLng), Number(dLat), Number(dLng));
  const fallbackDuration = Number((fallbackDistance * 2.1).toFixed(1)); // Approx 2.1 min per km average path

  const orsApiKey = process.env.OPENROUTESERVICE_API_KEY || process.env.ORS_API_KEY || '';
  if (orsApiKey) {
    try {
      const orsResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': orsApiKey,
          'Content-Type': 'application/json'
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
            distance: Number((route.summary.distance / 1000).toFixed(2)),
            duration: Number((route.summary.duration / 60).toFixed(1)),
            source: 'OpenRouteService'
          });
          return;
        }
      }
    } catch (err) {
      console.warn("OpenRouteService routing failed, trying Geoapify/OSRM:", err);
    }
  }

  const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || '';
  if (geoapifyApiKey) {
    try {
      const geoapifyUrl = new URL('https://api.geoapify.com/v1/routing');
      geoapifyUrl.searchParams.set('waypoints', `${pLat},${pLng}|${dLat},${dLng}`);
      geoapifyUrl.searchParams.set('mode', 'drive');
      geoapifyUrl.searchParams.set('apiKey', geoapifyApiKey);

      const geoapifyResponse = await fetch(geoapifyUrl);
      if (geoapifyResponse.ok) {
        const geoapifyData = await geoapifyResponse.json();
        const feature = geoapifyData.features?.[0];
        const props = feature?.properties || {};
        if (props.distance && props.time) {
          res.json({
            distance: Number((props.distance / 1000).toFixed(2)),
            duration: Number((props.time / 60).toFixed(1)),
            source: 'Geoapify Routing'
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
        const distanceKm = Number((route.distance / 1000).toFixed(2));
        const durationMin = Number((route.duration / 60).toFixed(1));

        res.json({
          distance: distanceKm,
          duration: durationMin,
          source: 'OSRM Real-time API'
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
    source: 'Geodetic Great-Circle Math (OSRM Fallback)'
  });
}));

// 19. POST TRIGGER SYSTEM FARE ADJUSTMENT (Addition 6)
apiRouter.post('/rides/:id/adjustment/trigger', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  const { trigger, amount, evidenceType, evidenceDescription } = req.body;
  if (!trigger || !amount) {
    res.status(400).json({ error: 'Trigger and amount are required.' });
    return;
  }

  // ONLY ALLOW ONE ADJUSTMENT
  if (ride.adjustmentStatus) {
    res.status(400).json({ error: 'Adjustment already triggered for this ride.' });
    return;
  }

  // APPLY CAP RULE: adjustment_total cannot exceed 30% of original locked_fare
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
    type: evidenceType || 'Sensor Log',
    description: evidenceDescription || 'Auto-generated system log.'
  };
  ride.adjustmentStatus = 'pending';
  
  db.updateRide(ride);

  db.addAlert({
    id: `ADJ-${Date.now()}`,
    rideId: ride.id,
    type: 'info',
    message: `System triggered a fare adjustment of ₹${finalAmount} for reason: ${trigger}. Awaiting rider consent.`,
    severity: 'medium',
    timestamp: new Date().toISOString()
  });

  res.json({ ride, wasCapped });
});

// 20. POST RIDER RESPONSE TO ADJUSTMENT (Addition 6)
apiRouter.post('/rides/:id/adjustment/respond', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  const { action } = req.body; // 'accept' or 'dispute'
  
  if (!ride.adjustmentStatus || ride.adjustmentStatus !== 'pending') {
    res.status(400).json({ error: 'No pending adjustment found for this ride.' });
    return;
  }

  if (action === 'accept') {
    ride.adjustmentStatus = 'accepted';
    // Update final fare
    ride.finalFare = Number((ride.finalFare + (ride.adjustmentAmount || 0)).toFixed(2));
    
    db.addAlert({
      id: `ADJ-ACC-${Date.now()}`,
      rideId: ride.id,
      type: 'info',
      message: `Rider accepted the fare adjustment of ₹${ride.adjustmentAmount}. New final fare is ₹${ride.finalFare}.`,
      severity: 'low',
      timestamp: new Date().toISOString()
    });
  } else if (action === 'dispute') {
    ride.adjustmentStatus = 'disputed';
    
    // Auto-create a dispute ticket
    const disputeId = `DSPA-${Math.floor(10000 + Math.random() * 90000)}`;
    db.addDispute({
      id: disputeId,
      rideId: ride.id,
      pickup: ride.pickup,
      drop: ride.drop,
      driverName: ride.driverName || 'Rajesh Kumar',
      safetyScore: ride.safetyScore,
      initialFare: ride.initialFare,
      finalFare: ride.finalFare,
      reason: `Disputed system fare adjustment (+₹${ride.adjustmentAmount}) for ${ride.adjustmentTrigger}.`,
      status: 'open',
      resolutionRefundAmount: 0.0,
      createdAt: new Date().toISOString()
    });

    db.addAlert({
      id: `ADJ-DIS-${Date.now()}`,
      rideId: ride.id,
      type: 'safety',
      message: `Rider disputed the fare adjustment. Ops review requested. Original fare locked pending review.`,
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({ error: 'Invalid action. Must be accept or dispute.' });
    return;
  }

  db.updateRide(ride);
  res.json(ride);
});
