export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleType: 'Bike' | 'Auto' | 'Cab';
  rating: number;
  status: 'online' | 'offline' | 'busy';
  location: { lat: number; lng: number };
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  rating?: number;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  sosCountPerUser?: number;
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
  paymentMethod: 'UPI' | 'Wallet' | 'Card' | 'GooglePay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'AmazonPay' | 'Razorpay' | 'Stripe' | 'Cash';
  status: 'booked' | 'assigned' | 'pickup' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  driverId?: string;
  driverName?: string;
  driverVehicle?: string;
  driverRating?: number;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  paymentStatus?: 'Pending' | 'Paid' | 'Disputed' | 'pending' | 'processing' | 'paid' | 'failed';
  paymentReference?: string;
  paidAt?: string;
  driverPhone?: string;
  driverVehicleType?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  driverLat?: number;
  driverLng?: number;
  riderLat?: number;
  riderLng?: number;
  assignedAt?: string;
  acceptedAt?: string;
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

export interface SystemState {
  config: SystemConfig;
  activeCount: number;
  completedCount: number;
  revenue: number;
  overspeedCount: number;
  harshBrakeCount: number;
  recentAlerts: AlertLog[];
}
