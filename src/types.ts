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
  safetyScore: number;
  overspeedEvents: number;
  harshBrakeEvents: number;
  behaviorDiscount: number;
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
  gpsLat: number;
  gpsLng: number;
  speed: number;
  ignition: 'on' | 'off';
  seat: 'empty' | 'occupied';
  motion: 'stationary' | 'moving' | 'riding' | 'braking';
  nfc: 'active' | 'inactive';
  progress: number;
  // Post-Lock Fare Adjustment (Addition 6)
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

export interface SystemState {
  config: SystemConfig;
  activeCount: number;
  completedCount: number;
  revenue: number;
  overspeedCount: number;
  harshBrakeCount: number;
  recentAlerts: AlertLog[];
}
