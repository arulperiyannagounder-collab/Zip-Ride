import { Router, Request, Response, NextFunction } from 'express';
import { db, Ride, Dispute, AlertLog } from './db.js';
import { summarizeDispute, askGeminiAssist, queryGeographicCities } from './gemini.js';
import { getWeatherData } from './weather.js';
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

// GET WEATHER DATA FROM LIVE SERVICE
apiRouter.get('/weather', asyncWrapper(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'Valid lat and lng coordinates are required.' });
    return;
  }

  const weather = await getWeatherData(lat, lng);
  res.json(weather);
}));

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

// ADMIN: Hot-patch rides missing riderName in-memory
apiRouter.post('/admin/patch-rider-names', (req: Request, res: Response) => {
  const defaultName = req.body.name || 'Saran';
  const patched = db.patchMissingRiderNames(defaultName);
  res.json({ success: true, patched, message: `Patched ${patched} rides with riderName: '${defaultName}'` });
});

// 3. GET DRIVERS
apiRouter.get('/drivers', (req: Request, res: Response) => {
  res.json(db.getDrivers());
});

// 3.3 PATCH UPDATE OR REGISTER DRIVER
apiRouter.patch('/drivers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone, vehicle, vehicleType, status, location } = req.body;

  let driver = db.getDrivers().find(d => d.id === id);
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
      name: name || 'Anonymous Driver',
      phone: phone || '+91 9876543210',
      vehicle: vehicle || 'BIKE-TN-09-XX-9999',
      vehicleType: vehicleType || 'Bike',
      rating: 5.0,
      status: status || 'online',
      location: location || { lat: 13.0827, lng: 80.2707 }
    };
    db.getDrivers().push(driver);
  }
  db.save();
  res.json(driver);
});

// 3.4 POST REGISTER DRIVER
apiRouter.post('/drivers/register', (req: Request, res: Response) => {
  try {
    const { name, phone, location, vehicleType, vehicleNumber } = req.body;

    if (!name || !phone || !location || !vehicleType || !vehicleNumber) {
      res.status(400).json({ error: 'Name, phone, location, vehicleType, and vehicleNumber are required.' });
      return;
    }

    const driverId = `DRV-${Date.now().toString().slice(-6)}`;
    const finalVehicle = `${vehicleType.toUpperCase()}-${vehicleNumber}`;

    const latVal = typeof location.lat === 'string' ? parseFloat(location.lat) : Number(location.lat);
    const lngVal = typeof location.lng === 'string' ? parseFloat(location.lng) : Number(location.lng);

    if (isNaN(latVal) || isNaN(lngVal)) {
      res.status(400).json({ error: 'Location coordinates must be valid numbers.' });
      return;
    }

    const driver = {
      id: driverId,
      name,
      phone,
      vehicle: finalVehicle,
      vehicleType: vehicleType as 'Bike' | 'Auto' | 'Cab',
      vehicleNumber,
      rating: 5.0,
      status: 'online' as const,
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
    console.error('Driver Registration Error Stack Trace:', err);
    res.status(500).json({ error: 'Internal server error during driver registration.' });
  }
});

// 3.0 GET DRIVER ORDERS
apiRouter.get('/driver/orders', (req: Request, res: Response) => {
  const rides = db.getRides().filter(r => r.status === 'booked');
  res.json(rides);
});

// 3.1 GET DRIVER PROFILE
apiRouter.get('/driver/profile', (req: Request, res: Response) => {
  const name = req.query.name as string;
  if (!name) {
    res.status(400).json({ error: 'Driver name is required.' });
    return;
  }

  let driver = db.getDrivers().find(d => d.name.toLowerCase() === name.toLowerCase());

  if (!driver) {
    // Dynamically register a new driver
    const id = `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const vehicleNumber = `TN37AB${Math.floor(1000 + Math.random() * 9000)}`;
    const rating = Number((4.5 + Math.random() * 0.5).toFixed(1));
    
    driver = {
      id,
      name,
      phone: '+91 9876543210',
      vehicle: `BIKE-${vehicleNumber}`,
      rating,
      status: 'online',
      location: { lat: 13.0827, lng: 80.2707 },
      vehicleType: 'Bike',
      vehicleNumber,
      baseCompletedRides: 24,
      baseTodayEarnings: 1250
    };
    
    db.getDrivers().push(driver);
    db.save();
  }

  const vehicleType = driver.vehicleType || 'Bike';
  const vehicleNumber = driver.vehicleNumber || (driver.vehicle.includes('-') ? driver.vehicle.substring(driver.vehicle.indexOf('-') + 1) : driver.vehicle);

  const driverRides = db.getRides().filter(r => r.driverName === driver!.name || r.driverId === driver!.id);
  const completedRidesList = driverRides.filter(r => r.status === 'completed');
  
  const baseCompletedRides = driver.baseCompletedRides !== undefined ? driver.baseCompletedRides : 24;
  const baseTodayEarnings = driver.baseTodayEarnings !== undefined ? driver.baseTodayEarnings : 1250;

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

// 3.2 POST UPDATE DRIVER STATUS
apiRouter.post('/driver/status', (req: Request, res: Response) => {
  const { name, status } = req.body;
  if (!name || !status) {
    res.status(400).json({ error: 'Name and status are required.' });
    return;
  }
  
  const driver = db.getDrivers().find(d => d.name.toLowerCase() === name.toLowerCase());
  if (driver) {
    driver.status = status;
    db.save();
    res.json({ success: true, status: driver.status });
  } else {
    res.status(404).json({ error: 'Driver not found.' });
  }
});

// 4. GET ALL RIDES
apiRouter.get('/rides', (req: Request, res: Response) => {
  db.reload();
  res.json(db.getRides());
});

// 5. GET SINGLE RIDE
apiRouter.get('/rides/:id', (req: Request, res: Response) => {
  db.reload();
  const ride = db.getRides().find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }
  res.json(ride);
});

// 6. POST CREATE (BOOK) A RIDE WITH DYNAMIC PRICING ALGORITHM
apiRouter.post('/rides', asyncWrapper(async (req: Request, res: Response) => {
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
    vehicleType
  } = req.body;

  if (!pickup || !drop || !paymentMethod) {
    res.status(400).json({ error: 'Pickup, drop, and paymentMethod are required.' });
    return;
  }

  const rideId = `ZR-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Use coordinates if supplied, or default to center coordinates
  const gpsLat = clientLat !== undefined ? clientLat : 19.0760;
  const gpsLng = clientLng !== undefined ? clientLng : 72.8777;

  // Retrieve current weather and traffic from system configuration or client calculations
  const sysConfig = db.getConfig();
  const weather = clientWeather || sysConfig.weather;
  const traffic = clientTraffic || sysConfig.traffic;

  // Retrieve weather from weather API
  let liveWeather = {
    temp: 28,
    weatherText: weather,
    windSpeed: 10,
    humidity: 55,
    weatherMultiplier: 1.0,
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
    console.warn('[POST /rides] Weather fetch failed, falling back to simulated logic:', err);
  }

  // Use client values if available, otherwise calculate using default estimations
  let distanceKm = clientDistance;
  if (distanceKm === undefined) {
    const rawDist = 2.0 + (Math.abs(pickup.length - drop.length) % 12) * 1.1 + (pickup.charCodeAt(0) % 5) * 0.5;
    distanceKm = Number(rawDist.toFixed(2));
  }

  let durationMin = clientDuration;
  let baseDuration = distanceKm * 3.0;

  // Surcharges and factors
  const weatherSurcharge = liveWeather.weatherFactor;
  const weatherMultiplier = liveWeather.weatherMultiplier;
  
  let speedLimit = 80;
  let etaMultiplier = 1.0;

  const wt = liveWeather.weatherText.toLowerCase();
  if (wt.includes('overcast') || wt.includes('clouds') || wt.includes('mist') || wt.includes('haze') || wt.includes('fog')) {
    speedLimit = 75;
    etaMultiplier = 1.1;
  } else if (wt.includes('rain') || wt.includes('drizzle')) {
    speedLimit = 60;
    etaMultiplier = 1.3;
  } else if (wt.includes('storm') || wt.includes('thunderstorm') || wt.includes('snow') || wt.includes('extreme')) {
    speedLimit = 50;
    etaMultiplier = 1.5;
  }

  let trafficMultiplier = 1.0;
  if (traffic === 'Moderate') {
    trafficMultiplier = 1.1;
    etaMultiplier *= 1.3;
  } else if (traffic === 'Heavy Congestion') {
    trafficMultiplier = 1.3;
    etaMultiplier *= 1.8;
  } else if (traffic === 'Gridlock') {
    trafficMultiplier = 1.5;
    etaMultiplier *= 2.5;
  }

  if (durationMin === undefined) {
    durationMin = Number((baseDuration * etaMultiplier).toFixed(1));
  }

  // Vehicle-specific Pricing
  const vType = vehicleType || 'Bike';
  let baseFare = 25.0;
  let perKmRate = 8.0;
  let perMinRate = 1.0;

  if (vType === 'Auto') {
    baseFare = 40.0;
    perKmRate = 12.0;
    perMinRate = 1.5;
  } else if (vType === 'Cab') {
    baseFare = 80.0;
    perKmRate = 18.0;
    perMinRate = 2.5;
  }

  const distanceFare = Number((distanceKm * perKmRate).toFixed(2));
  const durationFare = Number((durationMin * perMinRate).toFixed(2));
  const environmentalTransitCharges = (distanceFare + durationFare) * (trafficMultiplier - 1.0);
  
  let initialFare = clientFare;
  if (initialFare === undefined) {
    initialFare = Number((baseFare + weatherSurcharge + distanceFare + durationFare + environmentalTransitCharges).toFixed(2));
  }

  const newRide: Ride = {
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
    paymentStatus: 'pending',
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
    progress: 0,

    // Rider Details
    riderName: riderName || 'Saran',
    riderPhone: '9876543210',
    riderLat: gpsLat,
    riderLng: gpsLng,

    // Extended Vehicle & Weather details
    vehicleType: vType,
    weatherCondition: liveWeather.weatherText,
    temperature: liveWeather.temp,
    humidity: liveWeather.humidity,
    windSpeed: liveWeather.windSpeed,
    weatherMultiplier: weatherMultiplier,
    rainChance: liveWeather.rainChance
  };

  db.addRide(newRide);

  db.addAlert({
    id: `EVT-${Date.now()}`,
    rideId: rideId,
    type: 'info',
    message: `Ride ${rideId} booked (${vType}). Pickup: "${pickup}" -> Drop: "${drop}". Dynamic Fare calculated at ₹${initialFare} (Weather fee: +₹${weatherSurcharge}, Traffic Multiplier: ${trafficMultiplier}x, Dist: ${distanceKm} km).`,
    severity: 'info',
    timestamp: new Date().toISOString()
  });

  res.json(newRide);
}));

// 7. POST ACCEPT RIDE (DRIVER TAKES RIDE)
apiRouter.post('/rides/:id/accept', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  // Grab the driver name from body or fallback
  const { driverName } = req.body;
  let driver;
  if (driverName) {
    driver = db.getDrivers().find(d => d.name.toLowerCase() === driverName.toLowerCase());
  }
  if (!driver) {
    driver = db.getDrivers().find(d => d.status === 'online') || db.getDrivers()[0];
  }

  ride.status = 'assigned';
  ride.driverId = driver.id;
  ride.driverName = driver.name;
  ride.driverVehicle = driver.vehicle;
  ride.driverRating = driver.rating;
  ride.driverPhone = (driver as any).phone || '9876543210';
  ride.driverVehicleType = (driver as any).vehicleType || 'Bike';
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

  const { gpsLat, gpsLng, speed, ignition, seat, motion, nfc, progress, triggerHarshBrake, status } = req.body;

  if (gpsLat !== undefined) ride.gpsLat = Number(gpsLat);
  if (gpsLng !== undefined) ride.gpsLng = Number(gpsLng);
  if (speed !== undefined) ride.speed = Number(speed);
  if (ignition !== undefined) ride.ignition = ignition;
  if (seat !== undefined) ride.seat = seat;
  if (motion !== undefined) ride.motion = motion;
  if (nfc !== undefined) ride.nfc = nfc;
  if (status !== undefined) ride.status = status;
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

  // Compute final fare (subtract discounts, baseline floor is ride.baseFare)
  const floorFare = ride.baseFare !== undefined ? ride.baseFare : 20.0;
  ride.finalFare = Number(Math.max(floorFare, ride.initialFare - ride.behaviorDiscount).toFixed(2));

  db.updateRide(ride);
  res.json(ride);
});

// 8.5 POST CANCEL RIDE (passenger can cancel before driver picks up)
apiRouter.post('/rides/:id/cancel', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  // Only allow cancellation before ride has started moving
  const cancellableStatuses = ['booked', 'assigned'];
  if (!cancellableStatuses.includes(ride.status)) {
    res.status(400).json({ error: `Ride cannot be cancelled when status is '${ride.status}'.` });
    return;
  }

  ride.status = 'cancelled';
  ride.paymentStatus = 'Pending';
  ride.completedAt = new Date().toISOString();
  ride.speed = 0;
  ride.motion = 'stationary';
  ride.ignition = 'off';

  db.updateRide(ride);

  db.addAlert({
    id: `EVT-CAN-${Date.now()}`,
    rideId: ride.id,
    type: 'info',
    message: `Ride ${ride.id} was cancelled by the passenger before pickup.`,
    severity: 'medium',
    timestamp: new Date().toISOString()
  });

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

// 9.2 POST PAY RIDE
apiRouter.post('/rides/:id/pay', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }
  const { paymentReference, paymentMethod, paymentStatus } = req.body;
  ride.paymentStatus = paymentStatus || 'paid';
  ride.paymentMethod = paymentMethod || 'UPI';
  ride.paymentReference = paymentReference || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
  if (ride.paymentStatus === 'paid') {
    ride.paidAt = new Date().toISOString();
  }

  db.updateRide(ride);

  db.addAlert({
    id: `EVT-PAY-${Date.now()}`,
    rideId: ride.id,
    type: 'info',
    message: `Payment successful for ride ${ride.id}. Reference: ${ride.paymentReference}. Amount: ₹${ride.finalFare}.`,
    severity: 'info',
    timestamp: new Date().toISOString()
  });

  res.json(ride);
});

// 9.5 POST RATE RIDE
apiRouter.post('/rides/:id/rate', (req: Request, res: Response) => {
  const rides = db.getRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }
  const { rating } = req.body;
  if (rating === undefined || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    return;
  }
  ride.rating = Number(rating);
  db.updateRide(ride);
  
  db.addAlert({
    id: `EVT-RT-${Date.now()}`,
    rideId: ride.id,
    type: 'info',
    message: `Rider rated ride ${ride.id} as ${rating} stars.`,
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
  const { question, history, currentUser, role } = req.body;
  if (!question) {
    res.status(400).json({ error: 'A user question query is required.' });
    return;
  }

  // Build dynamic context based on database records if currentUser is passed
  let context = '';
  if (currentUser) {
    const rides = db.getRides();
    const activeStatuses = ['booked', 'accepted', 'assigned', 'pickup', 'en_route', 'arrived', 'anomaly', 'in_progress'];
    const activeRide = rides.find(r => {
      const isCompletedAndUnpaid = r.status === 'completed' && r.paymentStatus !== 'paid';
      if (role === 'driver') {
        return r.driverName === currentUser && activeStatuses.includes(r.status);
      }
      return r.riderName === currentUser && (activeStatuses.includes(r.status) || isCompletedAndUnpaid);
    });

    const sysConfig = db.getConfig();
    context = `System Weather configuration: ${sysConfig.weather}, Traffic: ${sysConfig.traffic}. Current user: ${currentUser}, Role: ${role || 'passenger'}.`;
    
    if (activeRide) {
      context += `\nActive Ride:\n` +
        `- Ride ID: ${activeRide.id}\n` +
        `- Pickup: ${activeRide.pickup}\n` +
        `- Drop: ${activeRide.drop}\n` +
        `- Status: ${activeRide.status}\n` +
        `- Driver Name: ${activeRide.driverName || 'None assigned'}\n` +
        `- Rider Name: ${activeRide.riderName || 'Saran'}\n` +
        `- Vehicle Type: ${activeRide.vehicleType || 'Bike'}\n` +
        `- Dynamic Fare: Initial ₹${activeRide.initialFare}, Final charged ₹${activeRide.finalFare}\n` +
        `- Speed: ${activeRide.speed} km/h\n` +
        `- Safety Score: ${activeRide.safetyScore}%\n` +
        `- Overspeed Events: ${activeRide.overspeedEvents}, Harsh Braking: ${activeRide.harshBrakeEvents}\n` +
        `- Payment Status: ${activeRide.paymentStatus || 'Pending'}\n` +
        `- Active SOS Flag: ${activeRide.hasActiveSOS ? 'YES' : 'NO'}`;
    }
  }

  const answer = await askGeminiAssist(question, history || [], context);
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

// 21. SOS ENDPOINTS
apiRouter.post('/emergency/trigger', (req: Request, res: Response) => {
  const { rideId, reason, isSilentSOS } = req.body;
  const rides = db.getRides();
  const ride = rides.find(r => r.id === rideId);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  const allSosAlerts = db.getSosAlerts();
  const riderName = ride.riderName || 'Saran';
  const riderAlerts = allSosAlerts.filter(a => a.riderName === riderName);
  const sosCountPerUser = riderAlerts.length + 1;

  let severity: 'low' | 'medium' | 'high' = 'high';
  if (['Vehicle Breakdown', 'Other Emergency'].includes(reason)) {
    severity = 'medium';
  } else if (['Feeling Unsafe', 'Wrong Route'].includes(reason)) {
    severity = 'high';
  }

  const sosAlert = {
    id: `SOS-${Math.floor(10000 + Math.random() * 90000)}`,
    rideId: ride.id,
    riderId: ride.riderId || 'USR-SARAN',
    riderName: riderName,
    driverId: ride.driverId || 'DRV001',
    driverName: ride.driverName || 'Rajesh Kumar',
    vehicleNumber: ride.driverVehicle || 'MH-02-AB-1234',
    reason: reason || 'Feeling Unsafe',
    riderLocation: {
      lat: ride.riderLat || 19.0760,
      lng: ride.riderLng || 72.8777
    },
    driverLocation: {
      lat: ride.driverLat || 19.0765,
      lng: ride.driverLng || 72.8780
    },
    status: 'active' as const,
    severity,
    isSilentSOS: !!isSilentSOS,
    createdAt: new Date().toISOString()
  };

  ride.isSilentSOS = !!isSilentSOS;
  ride.hasActiveSOS = true;
  db.updateRide(ride);

  db.addSosAlert(sosAlert);

  db.addAlert({
    id: `ALRT-SOS-${Date.now()}`,
    rideId: ride.id,
    type: 'safety',
    message: isSilentSOS 
      ? `🚨 Silent SOS triggered by rider! Status: ACTIVE. Severity: HIGH.`
      : `🚨 Emergency SOS triggered! Reason: ${reason}. Driver alerted.`,
    severity: 'critical',
    timestamp: new Date().toISOString()
  });

  res.json({ sosAlert, sosCountPerUser });
});

apiRouter.post('/sos', (req: Request, res: Response) => {
  const { rideId, reason, isSilentSOS } = req.body;
  const rides = db.getRides();
  const ride = rides.find(r => r.id === rideId);
  if (!ride) {
    res.status(404).json({ error: 'Ride not found' });
    return;
  }

  const allSosAlerts = db.getSosAlerts();
  const riderName = ride.riderName || 'Saran';
  const riderAlerts = allSosAlerts.filter(a => a.riderName === riderName);
  const sosCountPerUser = riderAlerts.length + 1;

  let severity: 'low' | 'medium' | 'high' = 'high';
  if (['Vehicle Breakdown', 'Other Emergency'].includes(reason)) {
    severity = 'medium';
  } else if (['Feeling Unsafe', 'Wrong Route'].includes(reason)) {
    severity = 'high';
  }

  const sosAlert = {
    id: `SOS-${Math.floor(10000 + Math.random() * 90000)}`,
    rideId: ride.id,
    riderId: ride.riderId || 'USR-SARAN',
    riderName: riderName,
    driverId: ride.driverId || 'DRV001',
    driverName: ride.driverName || 'Rajesh Kumar',
    vehicleNumber: ride.driverVehicle || 'MH-02-AB-1234',
    reason: reason || 'Feeling Unsafe',
    riderLocation: {
      lat: ride.riderLat || 19.0760,
      lng: ride.riderLng || 72.8777
    },
    driverLocation: {
      lat: ride.driverLat || 19.0765,
      lng: ride.driverLng || 72.8780
    },
    status: 'active' as const,
    severity,
    isSilentSOS: !!isSilentSOS,
    createdAt: new Date().toISOString()
  };

  ride.isSilentSOS = !!isSilentSOS;
  ride.hasActiveSOS = true;
  db.updateRide(ride);

  db.addSosAlert(sosAlert);

  db.addAlert({
    id: `ALRT-SOS-${Date.now()}`,
    rideId: ride.id,
    type: 'safety',
    message: isSilentSOS 
      ? `🚨 Silent SOS triggered by rider! Status: ACTIVE. Severity: HIGH.`
      : `🚨 Emergency SOS triggered! Reason: ${reason}. Driver alerted.`,
    severity: 'critical',
    timestamp: new Date().toISOString()
  });

  res.json({ sosAlert, sosCountPerUser });
});

apiRouter.get('/sos', (req: Request, res: Response) => {
  res.json(db.getSosAlerts());
});

apiRouter.get('/sos/:id', (req: Request, res: Response) => {
  const alerts = db.getSosAlerts();
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'SOS alert not found' });
    return;
  }
  res.json(alert);
});

apiRouter.patch('/sos/:id', (req: Request, res: Response) => {
  const alerts = db.getSosAlerts();
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'SOS alert not found' });
    return;
  }
  const { status } = req.body;
  if (!['active', 'investigating', 'resolved', 'false_alarm'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  alert.status = status;
  db.updateSosAlert(alert);

  if (['resolved', 'false_alarm'].includes(status)) {
    const rides = db.getRides();
    const ride = rides.find(r => r.id === alert.rideId);
    if (ride) {
      ride.hasActiveSOS = false;
      db.updateRide(ride);
    }
  }

  db.addAlert({
    id: `ALRT-SOS-UPD-${Date.now()}`,
    rideId: alert.rideId,
    type: 'safety',
    message: `SOS alert ${alert.id} status updated to: ${status.toUpperCase()}.`,
    severity: status === 'resolved' ? 'info' : 'medium',
    timestamp: new Date().toISOString()
  });

  res.json(alert);
});
