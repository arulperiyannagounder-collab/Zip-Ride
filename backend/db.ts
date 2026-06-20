import fs from 'fs';
import path from 'path';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  status: 'online' | 'offline' | 'busy';
  location: { lat: number; lng: number };
  vehicleType?: 'Bike' | 'Auto' | 'Cab';
  vehicleNumber?: string;
  baseCompletedRides?: number;
  baseTodayEarnings?: number;
}

export interface Ride {
  id: string;
  pickup: string;
  drop: string;
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  weatherType: string;
  weatherFactor: number;
  trafficType: string;
  trafficFactor: number;
  initialFare: number;
  safetyScore: number; // starts at 100
  overspeedEvents: number;
  harshBrakeEvents: number;
  behaviorDiscount: number; // discount given to customer for bad driving
  finalFare: number;
  paymentMethod: 'UPI' | 'Wallet' | 'Card' | 'GooglePay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'AmazonPay' | 'Razorpay' | 'Stripe' | 'Cash';
  status: 'booked' | 'assigned' | 'pickup' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  driverId?: string;
  driverName?: string;
  driverVehicle?: string;
  driverRating?: number;
  driverPhone?: string;
  driverVehicleType?: string;
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
  riderId?: string;
  driverLat?: number;
  driverLng?: number;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  paymentStatus?: 'Pending' | 'Paid' | 'Disputed' | 'pending' | 'processing' | 'paid' | 'failed';
  paymentReference?: string;
  paidAt?: string;
  
  // Live Telemetry
  gpsLat: number;
  gpsLng: number;
  speed: number;
  ignition: 'on' | 'off';
  seat: 'empty' | 'occupied';
  motion: 'stationary' | 'moving' | 'riding' | 'braking';
  nfc: 'active' | 'inactive';
  progress: number; // 0 to 100 %

  // Post-Lock Fare Adjustment
  adjustmentTrigger?: 'weather' | 'diversion' | 'rider_stop' | 'traffic' | 'force_majeure';
  adjustmentAmount?: number;
  adjustmentEvidence?: {
    type: string;
    description: string;
  };
  adjustmentStatus?: 'pending' | 'accepted' | 'disputed';
  vehicleType?: 'Bike' | 'Auto' | 'Cab';
  weatherCondition?: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  weatherMultiplier?: number;
  rainChance?: number;

  // SOS Safety integration
  isSilentSOS?: boolean;
  hasActiveSOS?: boolean;

  // Travel Safety Mode flags
  isChildSafety?: boolean;
  isWomenSafety?: boolean;
  isFamilySafety?: boolean;
  pickupCode?: string;
  childArrivalConfirmed?: boolean;
  selectedRouteIndex?: number;
  routePath?: Array<{ lat: number; lng: number }>;
}

export interface SOSAlert {
  id: string;
  rideId: string;
  riderId: string;
  riderName: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  reason: string;
  riderLocation: {
    lat: number;
    lng: number;
  };
  driverLocation: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'investigating' | 'resolved' | 'false_alarm';
  severity: 'low' | 'medium' | 'high';
  isSilentSOS?: boolean;
  createdAt: string;
}

export interface Dispute {
  id: string;
  rideId: string;
  pickup: string;
  drop: string;
  driverName: string;
  safetyScore: number;
  initialFare: number;
  finalFare: number;
  reason: string;
  aiExplanation?: string;
  status: 'open' | 'resolved' | 'rejected';
  resolutionRefundAmount: number;
  createdAt: string;
}

export interface SystemConfig {
  weather: 'Clear' | 'Heavy Rain' | 'Overcast' | 'Monsoon Storm' | 'High Winds';
  traffic: 'Light' | 'Moderate' | 'Heavy Congestion' | 'Gridlock';
}

export interface AlertLog {
  id: string;
  rideId: string;
  type: 'speed' | 'braking' | 'safety' | 'info' | 'weather' | 'traffic';
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface DatabaseSchema {
  drivers: Driver[];
  rides: Ride[];
  disputes: Dispute[];
  config: SystemConfig;
  alerts: AlertLog[];
  sosAlerts: SOSAlert[];
}

const DB_FILE = path.join(process.cwd(), 'zipride_db.json');

const INITIAL_DB: DatabaseSchema = {
  drivers: [],
  rides: [],
  disputes: [],
  config: {
    weather: 'Clear',
    traffic: 'Light'
  },
  alerts: [],
  sosAlerts: []
};

class FileDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...INITIAL_DB };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure standard templates
        if (!this.data.drivers || this.data.drivers.length === 0) {
          this.data.drivers = [...INITIAL_DB.drivers];
        } else {
          // Remove hardcoded seed profiles from existing db file
          this.data.drivers = this.data.drivers.filter(d => !['DRV001', 'DRV002', 'DRV003'].includes(d.id));
          this.data.drivers.forEach(d => {
            if (!d.phone) d.phone = '+91 9876543210';
            if (!d.vehicleType) d.vehicleType = 'Bike';
            if (!d.location) d.location = { lat: 13.0827, lng: 80.2707 };
          });
        }
        if (this.data.rides) {
          this.data.rides.forEach(r => {
            if (!r.riderName) {
              r.riderName = 'Saran';
            }
            if (!r.driverName && r.driverId) {
              const driver = this.data.drivers.find(d => d.id === r.driverId);
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
      console.error('Failed to load JSON database, using in-memory state:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save JSON database:', e);
    }
  }

  public reload() {
    this.load();
  }

  public patchMissingRiderNames(defaultName: string = 'Saran') {
    let patched = 0;
    this.data.rides.forEach(r => {
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

  public getDrivers(): Driver[] {
    return this.data.drivers;
  }

  public getRides(): Ride[] {
    return this.data.rides;
  }

  public getDisputes(): Dispute[] {
    return this.data.disputes;
  }

  public getConfig(): SystemConfig {
    return this.data.config;
  }

  public getAlerts(): AlertLog[] {
    return this.data.alerts;
  }

  public setConfig(weather: SystemConfig['weather'], traffic: SystemConfig['traffic']) {
    this.data.config = { weather, traffic };
    this.save();
  }

  public addRide(ride: Ride) {
    this.data.rides.push(ride);
    this.save();
  }

  public updateRide(updatedRide: Ride) {
    this.data.rides = this.data.rides.map(r => r.id === updatedRide.id ? updatedRide : r);
    this.save();
  }

  public addDispute(dispute: Dispute) {
    this.data.disputes.push(dispute);
    this.save();
  }

  public updateDispute(updatedDispute: Dispute) {
    this.data.disputes = this.data.disputes.map(d => d.id === updatedDispute.id ? updatedDispute : d);
    this.save();
  }

  public getSosAlerts(): SOSAlert[] {
    if (!this.data.sosAlerts) this.data.sosAlerts = [];
    return this.data.sosAlerts;
  }

  public addSosAlert(sos: SOSAlert) {
    if (!this.data.sosAlerts) this.data.sosAlerts = [];
    this.data.sosAlerts.push(sos);
    this.save();
  }

  public updateSosAlert(updatedSosAlert: SOSAlert) {
    if (!this.data.sosAlerts) this.data.sosAlerts = [];
    this.data.sosAlerts = this.data.sosAlerts.map(s => s.id === updatedSosAlert.id ? updatedSosAlert : s);
    this.save();
  }

  public addAlert(alert: AlertLog) {
    this.data.alerts.unshift(alert); // Add to beginning of alerts stream
    if (this.data.alerts.length > 200) {
      this.data.alerts = this.data.alerts.slice(0, 200);
    }
    this.save();
  }

  public clearRides() {
    this.data.rides = [];
    this.data.disputes = [];
    this.data.alerts = [];
    this.data.sosAlerts = [];
    this.save();
  }

  public clearAll() {
    this.data = {
      drivers: [...INITIAL_DB.drivers],
      rides: [],
      disputes: [],
      config: { weather: 'Clear', traffic: 'Light' },
      alerts: [],
      sosAlerts: []
    };
    this.save();
  }
}

export const db = new FileDatabase();
