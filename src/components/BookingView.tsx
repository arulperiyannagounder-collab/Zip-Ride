import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  CircleDot, 
  Smartphone, 
  Wallet, 
  CreditCard, 
  ShieldAlert, 
  Zap, 
  IndianRupee,
  ShieldCheck,
  Compass,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  TrafficCone,
  Info,
  CheckCircle2,
  Bike,
  Car,
  Gauge
} from 'lucide-react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Ride, SystemConfig } from '../types';
import LiveJourneyMap from './LiveJourneyMap';

// Props matching main app expectation
interface BookingViewProps {
  systemConfig: SystemConfig;
  onBookRide: (pickup: string, drop: string, paymentMethod: 'UPI' | 'Wallet' | 'Card', extraData?: any) => Promise<Ride>;
  onSelectTab: (tab: string) => void;
}

// Fallback search database of master Indian landmarks/cities
const ALL_INDIA_METROS_LOCATIONS = [
  // Mumbai metro region
  "Andheri West Metro, Mumbai, MH",
  "Bandra Kurla Complex (BKC), Mumbai, MH",
  "Powai Tech Park, Mumbai, MH",
  "Juhu Promenade Beach, Mumbai, MH",
  "Lower Parel High-Street, Mumbai, MH",
  "Colaba Causeway Gate, Mumbai, MH",
  "Worli Sea Face Point, Mumbai, MH",
  "Chhatrapati Shivaji Terminal (CST), Mumbai, MH",
  "Dadar Central Circle, Mumbai, MH",
  "Mulund Sonapur Junction, Mumbai, MH",
  "Thane Teen Hath Naka, Mumbai, MH",
  "Navi Mumbai Vashi Station, Mumbai, MH",
  
  // Delhi NCR
  "Connaught Place Central Block, New Delhi, DL",
  "Indira Gandhi International Airport Terminal 3, New Delhi, DL",
  "Rajiv Chowk Metro Hub, Delhi, DL",
  "Cyber City Business Park, Gurugram, HR",
  "Noida Sector 18 Market Exchange, Noida, UP",
  "Qutub Minar Archaeological Site, New Delhi, DL",
  "Red Fort Lahori Gate, Delhi, DL",
  "Greater Noida Pari Chowk, Delhi NCR, UP",
  "Dwarka Sector 21 Metro, New Delhi, DL",
  
  // Bangalore
  "Indiranagar 100 Feet Boulevard, Bengaluru, KA",
  "Koramangala 3rd Block Complex, Bengaluru, KA",
  "Whitefield ITPL Tech Terminal, Bengaluru, KA",
  "Electronic City Phase 1 Main Entrance, Bengaluru, KA",
  "Kempegowda International Airport Terminal, Bengaluru, KA",
  "MG Road Metro Intersection, Bengaluru, KA",
  "Cubbon Park Rose Arch, Bengaluru, KA",
  "HSR Layout 5th Main, Bengaluru, KA",
  "Jayanagar 4th Block, Bengaluru, KA",
  
  // Chennai & Coimbatore
  "Gandhipuram Town Central Bus Stand, Coimbatore, TN",
  "RS Puram East Club Road, Coimbatore, TN",
  "Nila Road Junction, Coimbatore, TN",
  "Marina Beach Lighthouse point, Chennai, TN",
  "T Nagar Ranganathan Shopping Lane, Chennai, TN",
  "Adyar Signal Crossing, Chennai, TN",
  "Guindy Industrial Gate, Chennai, TN",
  "Coimbatore Airport (CJB), Peelamedu, TN",
  "Vadapalani Metro Station, Chennai, TN",
  
  // Hyderabad
  "HITEC City Cyber Towers, Hyderabad, TG",
  "Gachibowli Outer Crossing, Hyderabad, TG",
  "Secunderabad Station Main Terminal, Hyderabad, TG",
  "Charminar Heritage Arch, Hyderabad, TG",
  "Banjara Hills Avenue Road, Hyderabad, TG",
  "Jubilee Hills Checkpost, Hyderabad, TG",
  
  // Pune & Maharashtra
  "Koregaon Park Road 1 Lane, Pune, MH",
  "Viman Nagar IT Hub, Pune, MH",
  "Hhinjewadi Phase 2 Crossing, Pune, MH",
  "Pune Junction Railway Terminal, Pune, MH",
  "Deccan Gymkhana Circle, Pune, MH",
  "Nagpur Zero Mile Monument, Nagpur, MH",
  "Nashik Panchavati Temple Area, Nashik, MH",
  
  // Kolkata & West Bengal
  "Park Street Shopping Corridor, Kolkata, WB",
  "Salt Lake Sector V, Kolkata, WB",
  "Howrah Bridge Entrance, Kolkata, WB",
  "New Market Esplanade, Kolkata, WB",
  "Dum Dum Netaji Subhash Airport, Kolkata, WB",
  
  // Northern India (Agra, Jaipur, Lucknow, Chandigarh, Varanasi, Amritsar)
  "Taj Mahal West Gate, Agra, UP",
  "Hawa Mahal Palace Road, Jaipur, RJ",
  "Hazratganj Multi-Level Block, Lucknow, UP",
  "Rock Garden Sector 1, Chandigarh, CH",
  "Kashi Vishwanath Corridor, Varanasi, UP",
  "Golden Temple Heritage Plaza, Amritsar, PB",
  "Amritsar Junction Main, Amritsar, PB",
  "Bara Imambara Gate, Lucknow, UP",
  "Jaipur Junction Center, Jaipur, RJ",
  "Shimla Mall Road Tourist Post, Shimla, HP",
  "Dehradun Clock Tower Crossing, Dehradun, UK",
  "Jammu Tawi Railway Station Office, Jammu, JK",

  // Western India (Ahmedabad, Surat, Vadodara, Rajkot, Goa, Udaipur)
  "Sabarmati Ashram Riverfront, Ahmedabad, GJ",
  "Surat Textile Market Hub, Surat, GJ",
  "Alkapuri commercial lane, Vadodara, GJ",
  "Panaji Church Square Plaza, Panaji, GA",
  "Calangute Beach Promenade, Goa, GA",
  "Lake Pichola Ambrai Ghat, Udaipur, RJ",
  "Udaipur Railway Junction Town, Udaipur, RJ",
  "Baga Beach Coast Lane, Baga, GA",

  // Southern India (Kochi, Trivandrum, Kozhikode, Visakhapatnam, Mysore, Madurai)
  "Fort Kochi Chinese Fishing Nets, Kochi, KL",
  "Lulu Mall Edappally Intersection, Kochi, KL",
  "Trivandrum central Temple Gate, Thiruvananthapuram, KL",
  "Calicut Beach Bypass Junction, Kozhikode, KL",
  "Mysore Palace North Arch Gate, Mysuru, KA",
  "Meenakshi Amman East Chitra Street, Madurai, TN",
  "Visakhapatnam RK Beach Road, Visakhapatnam, AP",
  "Vijayawada Benz Circle Exchange, Vijayawada, AP",

  // Eastern & Central India (Patna, Ranchi, Raipur, Bhubaneswar, Bhopal, Indore, Guwahati)
  "Gandhi Maidan Golghar Circle, Patna, BR",
  "Ranchi Main Albert Ekka Chowk, Ranchi, JH",
  "Raipur Marine Drive Telibandha, Raipur, CG",
  "Bhubaneswar Master Canteen Junction, Bhubaneswar, OD",
  "Lake View Upper Boat Club, Bhopal, MP",
  "Indore Chappan Dukan Food Lane, Indore, MP",
  "Indore Junction Station Front, Indore, MP",
  "Guwahati Paltan Bazar Junction, Guwahati, AS",
  "Shillong Police Bazar Circle, Shillong, ML"
];

interface Coords {
  lat: number;
  lng: number;
}

interface WeatherReport {
  temp: number;
  weatherText: string;
  windSpeed: number;
  humidity: number;
}

type VehicleType = 'Bike' | 'Auto' | 'Cab';

interface FareProfile {
  id: VehicleType;
  label: string;
  description: string;
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  capacity: string;
}

const VEHICLE_FARE_PROFILES: FareProfile[] = [
  { id: 'Bike', label: 'Bike', description: 'Fastest low-cost ride', baseFare: 25, perKmRate: 10, perMinRate: 1.2, capacity: '1 rider' },
  { id: 'Auto', label: 'Auto', description: 'Balanced city commute', baseFare: 35, perKmRate: 14, perMinRate: 1.5, capacity: '2-3 riders' },
  { id: 'Cab', label: 'Cab', description: 'Comfort ride', baseFare: 50, perKmRate: 18, perMinRate: 2, capacity: '4 riders' }
];

interface PlaceSuggestion {
  name: string;
  district?: string;
  state?: string;
  lat: number;
  lng: number;
}

const LOCAL_LANDMARK_SUGGESTIONS: PlaceSuggestion[] = [
  { name: "Karpagam College of Engineering", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8784, lng: 77.0227 },
  { name: "Karpagam Institute of Technology", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8815, lng: 77.0253 },
  { name: "Karpagam Academy of Higher Education", district: "Coimbatore", state: "Tamil Nadu", lat: 10.8798, lng: 77.0235 },
  { name: "Karpaga Vinayaga College of Engineering and Technology", district: "Chengalpattu", state: "Tamil Nadu", lat: 12.4487, lng: 79.8874 },
  { name: "Karpaga Vinayagar Temple", district: "Coimbatore", state: "Tamil Nadu", lat: 10.9392, lng: 77.0019 },
  { name: "Gandhipuram Town Central Bus Stand", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Gandhi Park", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0054, lng: 76.9471 },
  { name: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", lat: 23.2156, lng: 72.6369 },
  { name: "Gandhi Nagar", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9784, lng: 77.5800 },
  { name: "Mahatma Gandhi Road", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9756, lng: 77.6068 },
  { name: "Gandhi Maidan", district: "Patna", state: "Bihar", lat: 25.6170, lng: 85.1456 },
  { name: "Gandhi Museum", district: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1388 }
];

const formatSuggestion = (suggestion: PlaceSuggestion) => {
  return [suggestion.name, suggestion.district, suggestion.state].filter(Boolean).join(", ");
};

const getLocalSuggestions = (query: string): PlaceSuggestion[] => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const metroMatches = ALL_INDIA_METROS_LOCATIONS
    .filter(location => location.toLowerCase().includes(q))
    .map(location => {
      const coords = getFallbackIndianCoords(location);
      return {
        name: location.split(",")[0].trim(),
        district: location.split(",")[1]?.trim() || "India",
        state: location.split(",")[2]?.trim() || "India",
        lat: coords.lat,
        lng: coords.lng
      };
    });

  return [...LOCAL_LANDMARK_SUGGESTIONS, ...metroMatches].filter(place => {
    const label = formatSuggestion(place).toLowerCase();
    return label.includes(q);
  });
};

// Full database of known precise coordinates for standard landmark nodes in India
const KNOWN_COORDINATES: Record<string, Coords> = {
  "dadar station, mumbai": { lat: 19.0178, lng: 72.8478 },
  "juhu beach, mumbai": { lat: 19.1000, lng: 72.8258 },
  "andheri station, mumbai": { lat: 19.1136, lng: 72.8697 },
  "bkc, mumbai": { lat: 19.0700, lng: 72.8650 },
  "lower parel, mumbai": { lat: 19.0016, lng: 72.8277 },
  "churchgate station, mumbai": { lat: 18.9322, lng: 72.8264 },
  "marine drive, mumbai": { lat: 18.9440, lng: 72.8230 },
  "bandra west, mumbai": { lat: 19.0596, lng: 72.8295 },
  "powai lake, mumbai": { lat: 19.1300, lng: 72.9050 },
  "gandhipuram town central bus stand": { lat: 11.0168, lng: 76.9558 },
  "gandhi park, coimbatore": { lat: 11.0054, lng: 76.9471 },
  "karpagam college of engineering": { lat: 10.8784, lng: 77.0227 },
  "karpagam institute of technology": { lat: 10.8815, lng: 77.0253 },
  "karpagam academy of higher education": { lat: 10.8798, lng: 77.0235 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "othakalmandapam": { lat: 10.8715, lng: 77.0210 }
};

// Full database of precise pre-calculated distance (Km) and travel duration (minutes) for common standard journeys
const STANDARD_ROUTES: Record<string, { distance: number; duration: number }> = {
  "dadar station, mumbai|juhu beach, mumbai": { distance: 14.5, duration: 35.0 },
  "juhu beach, mumbai|dadar station, mumbai": { distance: 14.5, duration: 35.0 },
  
  "andheri station, mumbai|bkc, mumbai": { distance: 18.2, duration: 44.0 },
  "bkc, mumbai|andheri station, mumbai": { distance: 18.2, duration: 44.0 },
  
  "lower parel, mumbai|bkc, mumbai": { distance: 5.4, duration: 15.0 },
  "bkc, mumbai|lower parel, mumbai": { distance: 5.4, duration: 15.0 },
  
  "churchgate station, mumbai|marine drive, mumbai": { distance: 4.5, duration: 12.0 },
  "marine drive, mumbai|churchgate station, mumbai": { distance: 4.5, duration: 12.0 }
};

// Haversine calculator to get accurate line distance in Km
const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2));
};

// Map fallback coordinates for Indian cities
const getFallbackIndianCoords = (address: string): Coords => {
  const addr = address.toLowerCase();
  
  // Try exact lookup from known locations first to guarantee 100% coordinate precision
  for (const [key, value] of Object.entries(KNOWN_COORDINATES)) {
    if (addr.includes(key) || key.includes(addr)) {
      return value;
    }
  }
  
  if (addr.includes("delhi") || addr.includes("noida") || addr.includes("gurugram")) {
    return { lat: 28.6139 + (Math.random() - 0.5) * 0.04, lng: 77.2090 + (Math.random() - 0.5) * 0.04 };
  } else if (addr.includes("bangalore") || addr.includes("bengaluru")) {
    return { lat: 12.9716 + (Math.random() - 0.5) * 0.04, lng: 77.5946 + (Math.random() - 0.5) * 0.04 };
  } else if (addr.includes("coimbatore") || addr.includes("gandhipuram")) {
    return { lat: 11.0168 + (Math.random() - 0.5) * 0.015, lng: 76.9558 + (Math.random() - 0.5) * 0.015 };
  } else if (addr.includes("chennai") || addr.includes("vadapalani") || addr.includes("adyar")) {
    return { lat: 13.0827 + (Math.random() - 0.5) * 0.04, lng: 80.2707 + (Math.random() - 0.5) * 0.04 };
  } else if (addr.includes("hyderabad")) {
    return { lat: 17.3850 + (Math.random() - 0.5) * 0.04, lng: 78.4867 + (Math.random() - 0.5) * 0.04 };
  } else if (addr.includes("pune") || addr.includes("hinjewadi")) {
    return { lat: 18.5204 + (Math.random() - 0.5) * 0.04, lng: 73.8567 + (Math.random() - 0.5) * 0.04 };
  } else if (addr.includes("kolkata")) {
    return { lat: 22.5726 + (Math.random() - 0.5) * 0.04, lng: 88.3639 + (Math.random() - 0.5) * 0.04 };
  } else if (addr.includes("jaipur")) {
    return { lat: 26.9124 + (Math.random() - 0.5) * 0.03, lng: 75.7873 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("lucknow")) {
    return { lat: 26.8467 + (Math.random() - 0.5) * 0.03, lng: 80.9462 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("chandigarh")) {
    return { lat: 30.7333 + (Math.random() - 0.5) * 0.03, lng: 76.7794 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("amritsar")) {
    return { lat: 31.6340 + (Math.random() - 0.5) * 0.03, lng: 74.8723 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("agra")) {
    return { lat: 27.1767 + (Math.random() - 0.5) * 0.03, lng: 78.0081 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("ahmedabad") || addr.includes("surat") || addr.includes("vadodara")) {
    return { lat: 23.0225 + (Math.random() - 0.5) * 0.03, lng: 72.5714 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("goa") || addr.includes("panaji")) {
    return { lat: 15.4909 + (Math.random() - 0.5) * 0.03, lng: 73.8278 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("kochi") || addr.includes("trivandrum") || addr.includes("calicut")) {
    return { lat: 9.9312 + (Math.random() - 0.5) * 0.03, lng: 76.2673 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("patna")) {
    return { lat: 25.5941 + (Math.random() - 0.5) * 0.03, lng: 85.1376 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("bhubaneswar")) {
    return { lat: 20.2961 + (Math.random() - 0.5) * 0.03, lng: 85.8245 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("bhopal") || addr.includes("indore")) {
    return { lat: 22.7196 + (Math.random() - 0.5) * 0.03, lng: 75.8577 + (Math.random() - 0.5) * 0.03 };
  } else if (addr.includes("guwahati") || addr.includes("shillong")) {
    return { lat: 26.1445 + (Math.random() - 0.5) * 0.03, lng: 91.7362 + (Math.random() - 0.5) * 0.03 };
  }
  
  // Default to Mumbai
  return { lat: 19.0760 + (Math.random() - 0.5) * 0.05, lng: 72.8777 + (Math.random() - 0.5) * 0.05 };
};

// Fetch Weather details from Open-Meteo
const fetchWeatherDetails = async (lat: number, lng: number): Promise<WeatherReport> => {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&relative_humidity_2m=true&current=relative_humidity_2m`);
    if (res.ok) {
      const data = await res.json();
      const current = data.current_weather || data.current || {};
      const weatherCode = current.weathercode !== undefined ? current.weathercode : current.weather_code || 0;
      const temp = Math.round(current.temperature !== undefined ? current.temperature : current.temperature_2m || 28);
      const windSpeed = Math.round(current.windspeed !== undefined ? current.windspeed : current.wind_speed_10m || 12);
      const humidity = data.current?.relative_humidity_2m !== undefined ? Math.round(data.current.relative_humidity_2m) : 62;
      
      let weatherText = "Clear Sky";
      if (weatherCode === 1 || weatherCode === 2 || weatherCode === 3) weatherText = "Partly Cloudy";
      else if (weatherCode === 45 || weatherCode === 48) weatherText = "Foggy";
      else if (weatherCode >= 51 && weatherCode <= 67) weatherText = "Light Drizzle";
      else if (weatherCode >= 71 && weatherCode <= 77) weatherText = "Snowy Sky";
      else if (weatherCode >= 80 && weatherCode <= 82) weatherText = "Rain Showers";
      else if (weatherCode >= 95) weatherText = "Heavy Thunderstorm";

      return { temp, weatherText, windSpeed, humidity };
    }
  } catch (err) {
    console.warn("Weather forecast fetch error:", err);
  }
  return { temp: 28, weatherText: "Clear & Sunny", windSpeed: 10, humidity: 55 };
};

function BookingViewInner({
  systemConfig,
  onBookRide,
  onSelectTab,
  apiKey,
  hasValidKey
}: BookingViewProps & { apiKey: string; hasValidKey: boolean }) {
  
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('Bike');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Wallet' | 'Card'>('UPI');
  
  const pickupRef = React.useRef<HTMLInputElement>(null);
  const dropRef = React.useRef<HTMLInputElement>(null);
  const placesLib = useMapsLibrary('places');

  const [isActiveField, setIsActiveField] = useState<'pickup' | 'drop' | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFare, setShowFare] = useState(false);

  // Verification states for inputs
  const [selectedPickup, setSelectedPickup] = useState('');
  const [selectedDrop, setSelectedDrop] = useState('');
  const [isPickupVerified, setIsPickupVerified] = useState(false);
  const [isDropVerified, setIsDropVerified] = useState(false);

  // Monitor verification state based on selection or exact fallback lookup
  useEffect(() => {
    const val = pickup.trim().toLowerCase();
    if (!val) {
      setIsPickupVerified(false);
      return;
    }
    const isSelected = String(selectedPickup || '').toLowerCase() === val;
    setIsPickupVerified(isSelected);
  }, [pickup, selectedPickup]);

  useEffect(() => {
    const val = drop.trim().toLowerCase();
    if (!val) {
      setIsDropVerified(false);
      return;
    }
    const isSelected = String(selectedDrop || '').toLowerCase() === val;
    setIsDropVerified(isSelected);
  }, [drop, selectedDrop]);

  useEffect(() => {
    const activeValue = isActiveField === 'pickup' ? pickup : isActiveField === 'drop' ? drop : '';
    const query = activeValue.trim();

    if (!isActiveField || query.length < 2) {
      if (isActiveField === 'pickup') setPickupSuggestions([]);
      if (isActiveField === 'drop') setDropSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const localMatches = getLocalSuggestions(query);
        let apiMatches: PlaceSuggestion[] = [];

        const res = await fetch(`/api/geographic/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            apiMatches = data
              .filter(item => item && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)))
              .map(item => ({
                name: String(item.name || "Unknown place"),
                district: item.district ? String(item.district) : undefined,
                state: item.state ? String(item.state) : undefined,
                lat: Number(item.lat),
                lng: Number(item.lng)
              }));
          }
        }

        const seen = new Set<string>();
        const merged = [...localMatches, ...apiMatches].filter(item => {
          const key = formatSuggestion(item).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 8);

        if (!cancelled) {
          if (isActiveField === 'pickup') setPickupSuggestions(merged);
          if (isActiveField === 'drop') setDropSuggestions(merged);
        }
      } catch (err) {
        const fallbackMatches = getLocalSuggestions(query).slice(0, 8);
        if (!cancelled) {
          if (isActiveField === 'pickup') setPickupSuggestions(fallbackMatches);
          if (isActiveField === 'drop') setDropSuggestions(fallbackMatches);
        }
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pickup, drop, isActiveField]);

  // Real-time locations coordinates
  const [pickupCoords, setPickupCoords] = useState<Coords>({ lat: 11.0168, lng: 76.9558 }); // default Coimbatore
  const [dropCoords, setDropCoords] = useState<Coords>({ lat: 10.9950, lng: 76.9609 }); // default Ukkadam

  const selectSuggestion = (field: 'pickup' | 'drop', suggestion: PlaceSuggestion) => {
    const label = formatSuggestion(suggestion);
    const coords = { lat: suggestion.lat, lng: suggestion.lng };

    if (field === 'pickup') {
      setPickup(label);
      setSelectedPickup(label);
      setPickupCoords(coords);
      setIsPickupVerified(true);
      setPickupSuggestions([]);
    } else {
      setDrop(label);
      setSelectedDrop(label);
      setDropCoords(coords);
      setIsDropVerified(true);
      setDropSuggestions([]);
    }

    setIsActiveField(null);
  };
  
  // Live weather details fetched from open-meteo
  const [weatherPickup, setWeatherPickup] = useState<WeatherReport | null>(null);
  const [weatherDrop, setWeatherDrop] = useState<WeatherReport | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Route Metrics
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);
  const [calculatedDuration, setCalculatedDuration] = useState<number>(0);
  const [distanceExceeded, setDistanceExceeded] = useState<boolean>(false);

  // Speed breakers & traffic nodes
  const [speedbreakers, setSpeedbreakers] = useState<Array<{ id: string; name: string; position: Coords }>>([]);
  const [heavyTrafficPoints, setHeavyTrafficPoints] = useState<Array<{ id: string; position: Coords }>>([]);

  // Integrated Google Places native Autocomplete
  useEffect(() => {
    if (!placesLib || !pickupRef.current || !dropRef.current || !hasValidKey) return;

    const pickupAutocomplete = new placesLib.Autocomplete(pickupRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types']
    });

    const dropAutocomplete = new placesLib.Autocomplete(dropRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types']
    });

    const pickupListener = pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry?.location && (place.formatted_address || place.name)) {
        const val = place.formatted_address || place.name || '';
        setPickup(val);
        setSelectedPickup(val);
        setPickupCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        setIsPickupVerified(true);
        setPickupSuggestions([]);
      }
    });

    const dropListener = dropAutocomplete.addListener('place_changed', () => {
      const place = dropAutocomplete.getPlace();
      if (place.geometry?.location && (place.formatted_address || place.name)) {
        const val = place.formatted_address || place.name || '';
        setDrop(val);
        setSelectedDrop(val);
        setDropCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        setIsDropVerified(true);
        setDropSuggestions([]);
      }
    });

    return () => {
      google.maps.event.removeListener(pickupListener);
      google.maps.event.removeListener(dropListener);
    };
  }, [placesLib, hasValidKey]);

  // Reset output when source or destination values are changed
  useEffect(() => {
    setShowFare(false);
    setDistanceExceeded(false);
  }, [pickup, drop]);

  // Geocode an address using Live API lookup with instant local memory coordinates
  const resolveCoordinates = async (address: string, isPickup: boolean): Promise<Coords> => {
    const targetVal = address.toLowerCase().trim();
    
    // If exact selected pickup/drop matches state cache, return directly for 100% precision!
    if (isPickup && pickupCoords && address === selectedPickup) {
      return pickupCoords;
    }
    if (!isPickup && dropCoords && address === selectedDrop) {
      return dropCoords;
    }

    try {
      const suggestRes = await fetch(`/api/geographic/suggest?q=${encodeURIComponent(address)}`);
      if (suggestRes.ok) {
        const matches = await suggestRes.json();
        if (matches && matches.length > 0) {
          const matched = matches[0];
          const coords = { lat: matched.lat, lng: matched.lng };
          if (isPickup) setPickupCoords(coords);
          else setDropCoords(coords);
          return coords;
        }
      }
    } catch (e) {
      console.warn("Resolve coordinates search failed, using fallback coordinates:", e);
    }

    // Check KNOWN_COORDINATES first to avoid randomizing coords for standard landmark nodes
    const cleanAddr = address.toLowerCase().trim();
    for (const [key, value] of Object.entries(KNOWN_COORDINATES)) {
      if (cleanAddr.includes(key) || key.includes(cleanAddr)) {
        if (isPickup) setPickupCoords(value);
        else setDropCoords(value);
        return value;
      }
    }

    if (hasValidKey && window.google) {
      try {
        const geocoder = new google.maps.Geocoder();
        const result: google.maps.GeocoderResult[] = await new Promise((resolve, reject) => {
          geocoder.geocode({ address, componentRestrictions: { country: 'IN' } }, (results, status) => {
            if (status === 'OK' && results) resolve(results);
            else reject(new Error('Geocoding status not OK'));
          });
        });
        
        if (result?.[0]?.geometry?.location) {
          const loc = result[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          if (isPickup) setPickupCoords(coords);
          else setDropCoords(coords);
          return coords;
        }
      } catch (err) {
        console.warn("Google Maps geocoder failed, returning fallback coordinates:", err);
      }
    }
    const fallbackCoords = getFallbackIndianCoords(address);
    if (isPickup) setPickupCoords(fallbackCoords);
    else setDropCoords(fallbackCoords);
    return fallbackCoords;
  };

  // Perform fare pricing, real-time weather alerts, hazards placement
  const calculateFareAndRouteMetric = async () => {
    if (!pickup || !drop || pickup === drop) return;

    setWeatherLoading(true);
    try {
      // 1. Resolve coordinates
      const pCoords = await resolveCoordinates(pickup, true);
      const dCoords = await resolveCoordinates(drop, false);

      // 2. Check if this is a standard recognized route first for absolute accuracy
      const routeKey1 = `${pickup.trim().toLowerCase()}|${drop.trim().toLowerCase()}`;
      const routeKey2 = `${drop.trim().toLowerCase()}|${pickup.trim().toLowerCase()}`;
      let matchedRoute = null;

      for (const [key, val] of Object.entries(STANDARD_ROUTES)) {
        if (key === routeKey1 || key === routeKey2 || routeKey1.includes(key) || routeKey2.includes(key)) {
          matchedRoute = val;
          break;
        }
      }

      let distance = 0;
      let duration = 0;

      if (matchedRoute) {
        distance = matchedRoute.distance;
        duration = matchedRoute.duration;
      } else {
        // Prefer Google Directions when configured so distance and ETA follow real roads.
        if (hasValidKey && window.google) {
          try {
            const directionsService = new google.maps.DirectionsService();
            const routeResult: google.maps.DirectionsResult = await new Promise((resolve, reject) => {
              directionsService.route({
                origin: pCoords,
                destination: dCoords,
                travelMode: google.maps.TravelMode.DRIVING
              }, (response, status) => {
                if (status === 'OK' && response) resolve(response);
                else reject(new Error(`Directions API status: ${status}`));
              });
            });

            if (routeResult.routes?.[0]?.legs?.[0]) {
              const leg = routeResult.routes[0].legs[0];
              if (leg.distance?.value) {
                distance = Number((leg.distance.value / 1000).toFixed(2));
              }
              if (leg.duration?.value) {
                duration = Number((leg.duration.value / 60).toFixed(1));
              }
            }
          } catch (directionsErr) {
            console.warn("Google Directions failed, trying server route metrics:", directionsErr);
          }
        }

        if (distance === 0 || duration === 0) {
          try {
            const mRes = await fetch('/api/route-metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pLat: pCoords.lat,
                pLng: pCoords.lng,
                dLat: dCoords.lat,
                dLng: dCoords.lng
              })
            });
            if (mRes.ok) {
              const metrics = await mRes.json();
              distance = metrics.distance;
              duration = metrics.duration;
              console.log(`Resolved route parameters: ${distance} km, ${duration} mins [source: ${metrics.source}]`);
            } else {
              throw new Error("Invalid metrics fetch response status");
            }
          } catch (routeErr) {
            console.warn("Route metrics engine offline, using geodetic fallback:", routeErr);
            distance = calculateHaversineDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
            duration = Number((distance * 2.2).toFixed(1));
          }
        }
      }

      setCalculatedDistance(distance);

      // 3. Distance boundary constraint checkout (Max 50 km!)
      if (distance > 50.0) {
        setDistanceExceeded(true);
        setShowFare(false);
        setWeatherLoading(false);
        return;
      }
      setDistanceExceeded(false);

      // 4. Fetch Real-time Weather details for both points from Open-Meteo
      const [weatherP, weatherD] = await Promise.all([
        fetchWeatherDetails(pCoords.lat, pCoords.lng),
        fetchWeatherDetails(dCoords.lat, dCoords.lng)
      ]);
      setWeatherPickup(weatherP);
      setWeatherDrop(weatherD);

      // 5. Compute Duration depending on Traffic Factor
      let speedFactor = 1.0;
      if (systemConfig.traffic === 'Moderate') speedFactor = 1.35;
      else if (systemConfig.traffic === 'Heavy Congestion') speedFactor = 1.85;
      else if (systemConfig.traffic === 'Gridlock') speedFactor = 2.65;
      
      const finalDuration = Number((duration * speedFactor).toFixed(1));
      setCalculatedDuration(finalDuration);

      // 6. Generate dynamic Speedbreakers & Traffic Obstacles along the route segment
      const numSB = Math.min(6, Math.max(1, Math.round(distance / 8)));
      const sbList = [];
      for (let i = 1; i <= numSB; i++) {
        const ratio = i / (numSB + 1);
        sbList.push({
          id: `sb-${i}-${Date.now()}`,
          name: `Speedbreaker Checkpoint #${i}`,
          position: {
            lat: pCoords.lat + (dCoords.lat - pCoords.lat) * ratio + (Math.random() - 0.5) * 0.002,
            lng: pCoords.lng + (dCoords.lng - pCoords.lng) * ratio + (Math.random() - 0.5) * 0.002
          }
        });
      }
      setSpeedbreakers(sbList);

      const trafficList = [];
      if (systemConfig.traffic !== 'Light') {
        trafficList.push({
          id: `tr-${Date.now()}`,
          position: {
            lat: pCoords.lat + (dCoords.lat - pCoords.lat) * 0.65,
            lng: pCoords.lng + (dCoords.lng - pCoords.lng) * 0.65
          }
        });
      }
      setHeavyTrafficPoints(trafficList);

      setShowFare(true);
    } catch (err) {
      console.error("Pricing computation error:", err);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Pricing Calculation algorithm structure
  const getDynamicFareValues = () => {
    const base = 25.0; // flag down block
    const distFare = Number((calculatedDistance * 13.5).toFixed(2)); // ₹13.5 per km
    const timeFare = Number((calculatedDuration * 1.75).toFixed(2)); // ₹1.75 per minute

    // Weather surcharge from real-time climate checks
    let weatherSurcharge = 0;
    const peakPickupWeather = weatherPickup?.weatherText || systemConfig.weather;
    if (peakPickupWeather.includes("Rain") || peakPickupWeather.includes("Shower")) weatherSurcharge = 35;
    else if (peakPickupWeather.includes("Storm") || peakPickupWeather.includes("Thunder")) weatherSurcharge = 55;
    else if (peakPickupWeather.includes("Drizzle")) weatherSurcharge = 20;

    // Traffic surcharge multiplier factors
    let trafficMultiplier = 1.0;
    if (systemConfig.traffic === 'Moderate') trafficMultiplier = 1.15;
    else if (systemConfig.traffic === 'Heavy Congestion') trafficMultiplier = 1.35;
    else if (systemConfig.traffic === 'Gridlock') trafficMultiplier = 1.60;

    const environmentalTransitSurcharges = (distFare + timeFare) * (trafficMultiplier - 1.0);
    const total = Number((base + weatherSurcharge + distFare + timeFare + environmentalTransitSurcharges).toFixed(2));

    return {
      base,
      distFare,
      timeFare,
      weatherSurcharge,
      trafficSurgeAmt: environmentalTransitSurcharges,
      total
    };
  };

  const currentFare = getDynamicFareValues();

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !drop || pickup === drop || distanceExceeded || !showFare || !isPickupVerified || !isDropVerified) return;

    setIsSubmitting(true);
    try {
      // Pass client-side computed real-time coordinates, distance, and details to keep everything locked and accurate
      await onBookRide(pickup, drop, paymentMethod, {
        distanceKm: calculatedDistance,
        durationMin: calculatedDuration,
        weatherType: weatherPickup?.weatherText || systemConfig.weather,
        trafficType: systemConfig.traffic,
        initialFare: currentFare.total,
        gpsLat: pickupCoords.lat,
        gpsLng: pickupCoords.lng
      });
      onSelectTab('tracker');
    } catch (err) {
      console.error('Booking submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuggestionList = (field: 'pickup' | 'drop', suggestions: PlaceSuggestion[]) => {
    const isOpen = isActiveField === field && suggestions.length > 0;
    if (!isOpen) return null;

    return (
      <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_16px_40px_rgba(15,23,42,0.18)] overflow-hidden max-h-72 overflow-y-auto">
        {suggestionsLoading && (
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
            Searching Indian places...
          </div>
        )}
        {suggestions.map((suggestion, index) => (
          <button
            key={`${field}-${formatSuggestion(suggestion)}-${index}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectSuggestion(field, suggestion)}
            className="w-full text-left px-4 py-3 hover:bg-indigo-50/70 border-b border-slate-100 last:border-b-0 transition-colors"
          >
            <span className="flex items-start gap-3">
              {field === 'pickup' ? (
                <CircleDot className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-800 truncate">{suggestion.name}</span>
                <span className="block text-[11px] font-semibold text-slate-500 truncate">
                  {[suggestion.district, suggestion.state].filter(Boolean).join(", ") || "India"}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden" id="ride-setup-container">
      
      {/* Background Full View Dynamic visualizing Map */}
      <div className="absolute inset-0 z-0 bg-slate-100" id="live-map-container">
        {pickup || drop ? (
          <LiveJourneyMap
            apiKey={apiKey}
            hasValidKey={hasValidKey}
            pickupName={pickup}
            dropName={drop}
            pickupCoords={pickupCoords}
            dropCoords={dropCoords}
            distanceKm={calculatedDistance}
            weatherAtPickup={weatherPickup ? `${weatherPickup.temp}°C ${weatherPickup.weatherText}` : undefined}
            weatherAtDrop={weatherDrop ? `${weatherDrop.temp}°C ${weatherDrop.weatherText}` : undefined}
            speedbreakers={speedbreakers}
            heavyTrafficSegments={heavyTrafficPoints}
            onRouteSelect={(dist, dur) => {
              if (dist !== calculatedDistance || dur !== calculatedDuration) {
                setCalculatedDistance(dist);
                setCalculatedDuration(dur);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/5 relative overflow-hidden">
             {/* Map placeholder pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 z-0"></div>
             
             <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-sm max-w-sm text-center">
               <Compass className="w-12 h-12 text-indigo-400 mb-4 animate-bounce" />
               <h3 className="text-lg font-bold text-slate-800 tracking-tight">Map Display</h3>
               <p className="text-xs font-semibold text-slate-500 mt-2">Enter your pickup and destination on the left to see live roads, weather, and real traffic mapping.</p>
             </div>
          </div>
        )}
      </div>

      {/* Floating Left Column: Form Setup & Calculations */}
      <div className="absolute top-4 left-4 right-4 lg:right-auto lg:left-6 z-20 w-auto lg:w-full lg:max-w-[380px] h-auto max-h-[calc(100vh-120px)] flex flex-col gap-5 overflow-y-auto pr-2 pb-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shrink-0" id="booking-form-card">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            <span>Set Up Your Journey</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">Enter real-time pickup and drop locations in India with Google Maps validation.</p>

          <form onSubmit={handleBooking} className="space-y-4">
            {/* Pickup Input Field */}
            <div className="relative" id="pickup-selection-block">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">PICKUP LOCATION POINT</label>
              <div className="relative">
                <CircleDot className="w-5 h-5 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2 shrink-0" />
                <input
                  ref={pickupRef}
                  type="text"
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setSelectedPickup('');
                    setIsPickupVerified(false);
                    setIsActiveField('pickup');
                  }}
                  onFocus={() => setIsActiveField('pickup')}
                  onBlur={() => window.setTimeout(() => setIsActiveField(null), 120)}
                  placeholder="Type any place, city, or landmark in India..."
                  className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-850 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                />
              </div>
              {renderSuggestionList('pickup', pickupSuggestions)}

              {/* Validation Status Badge */}
              {pickup.trim() !== '' && (
                isPickupVerified ? (
                  <div className="flex items-center gap-1 mt-2 text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit border border-emerald-100/50">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Verified Indian Location</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-2 text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit border border-amber-200/50 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Please select from Google Maps dropdown</span>
                  </div>
                )
              )}
            </div>

            {/* Drop Destination Input Field */}
            <div className="relative" id="drop-selection-block">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">DROP DESTINATION POINT</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2 shrink-0" />
                <input
                  ref={dropRef}
                  type="text"
                  value={drop}
                  onChange={(e) => {
                    setDrop(e.target.value);
                    setSelectedDrop('');
                    setIsDropVerified(false);
                    setIsActiveField('drop');
                  }}
                  onFocus={() => setIsActiveField('drop')}
                  onBlur={() => window.setTimeout(() => setIsActiveField(null), 120)}
                  placeholder="Type full destination address in India..."
                  className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-850 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                />
              </div>
              {renderSuggestionList('drop', dropSuggestions)}

              {/* Validation Status Badge */}
              {drop.trim() !== '' && (
                isDropVerified ? (
                  <div className="flex items-center gap-1 mt-2 text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit border border-emerald-100/50">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Verified Indian Location</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-2 text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit border border-amber-200/50 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Please select from Google Maps dropdown</span>
                  </div>
                )
              )}
            </div>

            {/* Price Calculations and Boundary check trigger */}
            <div className="pt-1">
              <button
                type="button"
                id="calculate-price-btn"
                onClick={calculateFareAndRouteMetric}
                disabled={!pickup || !drop || pickup === drop || !isPickupVerified || !isDropVerified || weatherLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition duration-300 cursor-pointer disabled:cursor-not-allowed ${
                  showFare
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400'
                }`}
              >
                {weatherLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
                    <span>Querying Maps & Weather data...</span>
                  </>
                ) : (
                  <>
                    <IndianRupee className="w-4 h-4 shrink-0" />
                    <span>{showFare ? 'Estimated Price Pre-Calculated ✓' : 'Calculate & Show Price'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Error banner if distance > 50 Km boundary limit is hit */}
            {distanceExceeded && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 leading-relaxed text-xs space-y-1.5" id="distance-exceeded-alert">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Out of Boundary Limits!</span>
                </div>
                <p>
                  Calculated journey distance between those points is <strong className="font-bold">{calculatedDistance} km</strong>! ZipRide has a maximum operating boundary radius of <strong className="font-bold">50 km</strong> to guarantee bike rider safety and speed. Trips to other states (like Delhi to Coimbatore/Gandhipuram) are not feasible.
                </p>
              </div>
            )}

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">DIGITAL MODE SELECTOR</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'UPI', label: 'UPI Node', icon: Smartphone },
                  { id: 'Wallet', label: 'Wallet Pay', icon: Wallet },
                  { id: 'Card', label: 'Card Swipe', icon: CreditCard }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-xl gap-2 transition duration-200 ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-bold' 
                          : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500 font-semibold'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Final Booking Submit trigger */}
            <button
              type="submit"
              id="book-ride-btn"
              disabled={isSubmitting || !pickup || !drop || pickup === drop || !showFare || distanceExceeded || !isPickupVerified || !isDropVerified}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition duration-300 cursor-pointer disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5 shrink-0" />
              <span>{isSubmitting ? 'Securing Bike Connection...' : !showFare ? 'Show Price First to Book' : 'Trigger Taxi Booking'}</span>
            </button>
          </form>
        </div>

        {/* Real-time details region of Weather/Traffic (highly user-friendly) */}
        {showFare && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4" id="weather-traffic-detail-card">
            <h4 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-1.5 uppercase font-mono border-b border-slate-100 pb-3">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Journey Regional Weather & Traffic Details</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup forecast */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-150 relative overflow-hidden">
                <span className="absolute right-3 top-3 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono">PICKUP POINT</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Location Conditions</p>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{weatherPickup?.temp}°C <span className="text-xs font-semibold text-sky-600">({weatherPickup?.weatherText})</span></h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Air Temperature</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{weatherPickup?.humidity}%</span>
                      <span className="text-[9px] text-slate-400">Humidity</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-sky-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{weatherPickup?.windSpeed} km/h</span>
                      <span className="text-[9px] text-slate-400">Wind Velocity</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination forecast */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-150 relative overflow-hidden">
                <span className="absolute right-3 top-3 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono">DROP POINT</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Location Conditions</p>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{weatherDrop?.temp}°C <span className="text-xs font-semibold text-rose-500">({weatherDrop?.weatherText})</span></h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Air Temperature</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{weatherDrop?.humidity}%</span>
                      <span className="text-[9px] text-slate-400">Humidity</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-sky-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{weatherDrop?.windSpeed} km/h</span>
                      <span className="text-[9px] text-slate-400">Wind Velocity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel safety hazards summary */}
            <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-indigo-800">Dynamic Traffic & Road Hazards Advisory</span>
              <div className="flex flex-wrap gap-4 items-center gap-y-2 text-indigo-700">
                <div className="flex items-center gap-1 font-semibold text-[11px]">
                  <TrafficCone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{speedbreakers.length} Speedbreakers Detected</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Traffic Index: {systemConfig.traffic}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Overspeeding Protections Armed</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Dynamic pricing panel */}
        <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] shrink-0" id="fare-panel">
          <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800 text-sm">Dynamic Fare Calculator</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Surcharge Protection
            </span>
          </div>

          {pickup && drop && pickup !== drop && showFare ? (
            <div className="p-6 space-y-4">
              
              {/* Dynamic Surcharges Warning Banner if active */}
              {(weatherPickup?.weatherText && !weatherPickup.weatherText.toLowerCase().includes("clear") && !weatherPickup.weatherText.toLowerCase().includes("sunny")) && (
                <div className="p-3 bg-sky-50 border border-sky-100 text-[11px] text-sky-700 rounded-xl leading-relaxed font-semibold">
                  ⛈️ Real-time Weather surcharge active parent for <strong>"{weatherPickup.weatherText}"</strong>: Climate fees apply to vehicle safety adjustments.
                </div>
              )}
              {systemConfig.traffic !== 'Light' && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/50 text-[11px] text-amber-700 rounded-xl leading-relaxed font-semibold">
                  🚗 Traffic Index surge active: <strong>"{systemConfig.traffic}"</strong> applying multipliers to variable km/min travel costs.
                </div>
              )}

              <div className="space-y-2.5 text-xs text-slate-500 font-semibold border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <span>Description Metric</span>
                  <span>Sub-Total</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Flag Down Block (Base)</span>
                  <span className="font-mono text-slate-800">₹{currentFare.base.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Calculated Route Distance ({calculatedDistance} km)</span>
                  <span className="font-mono text-slate-800 font-bold">₹{currentFare.distFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Estimated Transit ETA ({calculatedDuration} mins)</span>
                  <span className="font-mono text-slate-800 font-bold">₹{currentFare.timeFare.toFixed(2)}</span>
                </div>
                {currentFare.weatherSurcharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Live Weather Safety Factor</span>
                    <span className="font-mono text-sky-600">+₹{currentFare.weatherSurcharge.toFixed(2)}</span>
                  </div>
                )}
                {currentFare.trafficSurgeAmt > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Traffic Surge Surcharge</span>
                    <span className="font-mono text-amber-500">+₹{currentFare.trafficSurgeAmt.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Combined Final Toll */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block font-sans">Locked Ride Fare</span>
                  <span className="text-[10px] text-emerald-500 font-semibold tracking-wide">Live discount refund shield active</span>
                </div>
                <h2 className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">₹{currentFare.total.toFixed(2)}</h2>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
                ℹ️ <strong>Refund Shield Commitment</strong>: Fares are fully locked upon booking. If your assigned driver breaches weather speed safety limits or performs harsh decelerations, instant dynamic discounts are computed and credited.
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <Compass className="w-12 h-12 text-indigo-400 mb-4 animate-bounce" />
              <p className="text-sm font-bold text-slate-700">Calculate Distance & Fare</p>
              <p className="text-xs text-slate-400 max-w-[250px] mt-2 mb-4 leading-relaxed">
                Provide your journey pick-up and destination points in the form block to query maps routing, coordinates, distance, and real-time open weather details.
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Route Visualization Map block is removed from here since it's now in the background */}

      </div>

    </div>
  );
}

// Master wrapper to correctly inject Google Maps API contexts dynamically
export default function BookingView(props: BookingViewProps) {
  // Read process.env.GOOGLE_MAPS_PLATFORM_KEY
  const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
  const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim().length > 5;

  if (hasValidKey) {
    return (
      <APIProvider apiKey={API_KEY} version="weekly">
        <BookingViewInner {...props} apiKey={API_KEY} hasValidKey={true} />
      </APIProvider>
    );
  } else {
    return <BookingViewInner {...props} apiKey="" hasValidKey={false} />;
  }
}
