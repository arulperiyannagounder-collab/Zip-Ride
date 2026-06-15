import fs from 'fs';
import path from 'path';

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  status: 'online' | 'offline' | 'busy';
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
  paymentMethod: 'UPI' | 'Wallet' | 'Card';
  status: 'booked' | 'assigned' | 'pickup' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  driverId?: string;
  driverName?: string;
  driverVehicle?: string;
  driverRating?: number;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  paymentStatus?: 'Pending' | 'Paid' | 'Disputed';
  
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
}

const DB_FILE = path.join(process.cwd(), 'zipride_db.json');

const INITIAL_DB: DatabaseSchema = {
  drivers: [
    { id: 'DRV001', name: 'Rajesh Kumar', vehicle: 'BIKE-MH12-AB-1234', rating: 4.8, status: 'online' },
    { id: 'DRV002', name: 'Priya Sharma', vehicle: 'BIKE-MH12-CD-5678', rating: 4.9, status: 'online' },
    { id: 'DRV003', name: 'Suresh Reddy', vehicle: 'BIKE-MH12-GH-3456', rating: 4.6, status: 'online' }
  ],
  rides: [],
  disputes: [],
  config: {
    weather: 'Clear',
    traffic: 'Light'
  },
  alerts: []
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

  public addAlert(alert: AlertLog) {
    this.data.alerts.unshift(alert); // Add to beginning of alerts stream
    if (this.data.alerts.length > 200) {
      this.data.alerts = this.data.alerts.slice(0, 200);
    }
    this.save();
  }

  public clearAll() {
    this.data = {
      drivers: [...INITIAL_DB.drivers],
      rides: [],
      disputes: [],
      config: { weather: 'Clear', traffic: 'Light' },
      alerts: []
    };
    this.save();
  }
}

export const db = new FileDatabase();
