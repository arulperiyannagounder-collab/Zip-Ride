import React, { useState } from 'react';
import { Ride, Dispute } from '../types';
import {
  Calendar, MapPin, CircleDot, FileText, AlertTriangle,
  Star, Eye, Navigation, XCircle, CheckCircle2, Clock,
  ShieldAlert, BadgeCheck, RefreshCw, ChevronRight,
  Receipt, X, ReceiptText
} from 'lucide-react';

interface RideHistoryViewProps {
  allRides: Ride[];
  currentUser: string | null;
  currentUserRole?: 'passenger' | 'driver' | 'admin' | null;
  onRateRide: (id: string, rating: number) => Promise<void>;
  onFileDispute: (rideId: string, reason: string) => Promise<void>;
  onRebook: (pickup: string, drop: string) => void;
  onCancelRide: (id: string) => Promise<void>;
  onTrackRide: () => void;
  disputes: Dispute[];
}

// ─── Status helpers ────────────────────────────────────────────────────────────

type DisplayStatus =
  | 'completed'
  | 'cancelled'
  | 'in_progress'
  | 'dispute_open'
  | 'refund_processed';

function getDisplayStatus(ride: Ride, dispute?: Dispute): DisplayStatus {
  if (dispute?.status === 'resolved' && dispute.resolutionRefundAmount > 0) return 'refund_processed';
  if (dispute && dispute.status === 'open') return 'dispute_open';
  if (ride.paymentStatus && ride.paymentStatus.toLowerCase() === 'disputed') return 'dispute_open';
  if (ride.status === 'completed') return 'completed';
  if (ride.status === 'cancelled') return 'cancelled';
  // active
  return 'in_progress';
}

const STATUS_CONFIG: Record<DisplayStatus, {
  label: string;
  badge: string;
  dot: string;
}> = {
  completed:        { label: 'Completed',        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-500' },
  cancelled:        { label: 'Cancelled',         badge: 'bg-rose-100 text-rose-700 border-rose-200',           dot: 'bg-rose-500' },
  in_progress:      { label: 'Ride In Progress',  badge: 'bg-amber-100 text-amber-700 border-amber-200',        dot: 'bg-amber-500' },
  dispute_open:     { label: 'Dispute Open',      badge: 'bg-orange-100 text-orange-700 border-orange-200',     dot: 'bg-orange-500' },
  refund_processed: { label: 'Refund Processed',  badge: 'bg-sky-100 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
};

const DISPUTE_REASONS = [
  'Driver demanded extra cash payment',
  'Unsafe / reckless driving behaviour',
  'Driver took wrong or longer route',
  'Driver never arrived at pickup',
  'Overcharged fare or hidden charges',
  'Driver was rude or unprofessional',
  'Other (describe below)',
];

const ACTIVE_STATUSES = ['booked', 'assigned', 'pickup', 'en_route', 'anomaly', 'arrived'];

// ─── Main component ────────────────────────────────────────────────────────────

export default function RideHistoryView({
  allRides,
  currentUser,
  currentUserRole,
  onRateRide,
  onFileDispute,
  onRebook,
  onCancelRide,
  onTrackRide,
  disputes,
}: RideHistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingRideId, setRatingRideId] = useState<string | null>(null);
  const [disputeRideId, setDisputeRideId] = useState<string | null>(null);
  const [selectedDisputeReason, setSelectedDisputeReason] = useState('');
  const [customDisputeReason, setCustomDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active' | 'cancelled' | 'disputed'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  // ── Filter & sort rides ──
  const HISTORY_STATUSES = ['completed', 'cancelled'];

  const filteredRides = allRides.filter(r => {
    // 1. Role boundaries
    if (currentUserRole === 'driver') {
      if (r.driverName && r.driverName !== currentUser) return false;
    } else if (currentUserRole === 'passenger') {
      if (r.riderName && r.riderName !== currentUser) return false;
    }

    // 2. Search query checking
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = r.id.toLowerCase().includes(q);
      const matchPickup = r.pickup.toLowerCase().includes(q);
      const matchDrop = r.drop.toLowerCase().includes(q);
      const matchDriver = (r.driverName || '').toLowerCase().includes(q);
      if (!matchId && !matchPickup && !matchDrop && !matchDriver) return false;
    }

    // 3. Status filter checking
    const statusNorm = (r.status || '').toLowerCase().trim();
    const isDisputed = (r.paymentStatus || '').toLowerCase() === 'disputed' || !!disputes.find(d => d.rideId === r.id);
    
    if (statusFilter === 'completed') {
      return statusNorm === 'completed';
    } else if (statusFilter === 'active') {
      return ACTIVE_STATUSES.includes(statusNorm);
    } else if (statusFilter === 'cancelled') {
      return statusNorm === 'cancelled';
    } else if (statusFilter === 'disputed') {
      return isDisputed;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
  });

  const getDisputeForRide = (rideId: string) =>
    disputes.find(d => d.rideId === rideId);

  // ── Dispute submission ──
  const handleDisputeSubmit = async (rideId: string) => {
    const finalReason = selectedDisputeReason === 'Other (describe below)'
      ? customDisputeReason.trim()
      : selectedDisputeReason;
    if (!finalReason || isSubmittingDispute) return;

    setIsSubmittingDispute(true);
    try {
      await onFileDispute(rideId, finalReason);
      setDisputeRideId(null);
      setSelectedDisputeReason('');
      setCustomDisputeReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // ── Cancel ride ──
  const handleCancel = async (id: string) => {
    if (cancellingId) return;
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    setCancellingId(id);
    try {
      await onCancelRide(id);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-theme-text-primary tracking-tight">Ride History</h2>
          <p className="text-sm text-theme-text-secondary mt-1">
            View, track, rate and manage all your rides in one place.
          </p>
        </div>
      </div>

      {/* Search and Filters Controls */}
      <div className="bg-theme-card border border-theme-border rounded-3xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary mb-1.5">Search Trips</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, pickup, drop, driver..."
            className="w-full bg-theme-bg border border-theme-border text-theme-text-primary font-medium px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary mb-1.5">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-theme-bg border border-theme-border text-theme-text-primary font-medium px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Rides</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary mb-1.5">Sort Order</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full bg-theme-bg border border-theme-border text-theme-text-primary font-medium px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-indigo-500"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSortOrder('latest');
            }}
            className="w-full py-2.5 bg-theme-bg hover:bg-theme-card border border-theme-border text-theme-text-primary text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Clear Controls
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {filteredRides.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {(['completed', 'in_progress', 'cancelled', 'dispute_open', 'refund_processed'] as DisplayStatus[]).map(status => {
            const count = filteredRides.filter(r => getDisplayStatus(r, getDisputeForRide(r.id)) === status).length;
            if (count === 0) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <span key={status} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label} · {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Table */}
      {filteredRides.length > 0 ? (
        <div className="bg-theme-card border border-theme-border rounded-3xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-theme-bg/60 border-b border-theme-border text-theme-text-secondary font-mono text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-4 py-4">Ride ID</th>
                  <th className="px-4 py-4">Booking Date & Time</th>
                  <th className="px-4 py-4">Pickup Location</th>
                  <th className="px-4 py-4">Destination</th>
                  <th className="px-4 py-4">Vehicle Type</th>
                  <th className="px-4 py-4">Driver Name</th>
                  <th className="px-4 py-4">Distance</th>
                  <th className="px-4 py-4">Duration</th>
                  <th className="px-4 py-4">Initial Fare</th>
                  <th className="px-4 py-4">Final Fare</th>
                  <th className="px-4 py-4">Ride Status</th>
                  <th className="px-4 py-4">Payment Method</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/70">
                {filteredRides.map(ride => {
                  const dispute = getDisputeForRide(ride.id);
                  const displayStatus = getDisplayStatus(ride, dispute);
                  const cfg = STATUS_CONFIG[displayStatus];
                  const isExpanded = expandedId === ride.id;
                  const isActive = ACTIVE_STATUSES.includes(ride.status);

                  return (
                    <React.Fragment key={ride.id}>
                      {/* Main row */}
                      <tr
                        className={`transition duration-150 cursor-pointer ${isExpanded ? 'bg-indigo-50/10' : 'hover:bg-theme-bg/30'}`}
                        onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                      >
                        {/* Ride ID */}
                        <td className="px-4 py-4">
                          <span className="font-mono font-bold text-theme-text-primary tracking-tight text-[11px]">
                            {ride.id}
                          </span>
                        </td>

                        {/* Booking Date & Time */}
                        <td className="px-4 py-4 font-mono text-[11px] text-theme-text-secondary whitespace-nowrap">
                          {new Date(ride.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(ride.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Pickup Location */}
                        <td className="px-4 py-4 max-w-[150px] truncate font-medium text-theme-text-secondary">
                          {ride.pickup}
                        </td>

                        {/* Destination */}
                        <td className="px-4 py-4 max-w-[150px] truncate font-medium text-theme-text-secondary">
                          {ride.drop}
                        </td>

                        {/* Vehicle Type */}
                        <td className="px-4 py-4 font-bold text-theme-text-primary">
                          {ride.vehicleType || 'Bike'}
                        </td>

                        {/* Driver Name */}
                        <td className="px-4 py-4 font-semibold text-theme-text-primary">
                          {ride.driverName || 'Finding...'}
                        </td>

                        {/* Distance */}
                        <td className="px-4 py-4 font-mono text-theme-text-secondary">
                          {ride.distanceKm} km
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-4 font-mono text-theme-text-secondary">
                          {ride.durationMin} min
                        </td>

                        {/* Initial Fare */}
                        <td className="px-4 py-4 font-mono text-theme-text-secondary">
                          ₹{ride.initialFare.toFixed(0)}
                        </td>

                        {/* Final Fare */}
                        <td className="px-4 py-4 font-mono font-bold text-brand-emerald text-sm">
                          ₹{ride.finalFare.toFixed(0)}
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                            {displayStatus === 'in_progress' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                            {ride.status}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="px-4 py-4 font-bold text-theme-text-secondary">
                          {ride.paymentMethod}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                            {/* Completed */}
                            {displayStatus === 'completed' && (
                              <>
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-theme-text-primary hover:bg-theme-card text-[10px] font-bold transition cursor-pointer"
                                  title="View Receipt"
                                >
                                  <Receipt className="w-3 h-3" />
                                  Receipt
                                </button>
                                {!getDisputeForRide(ride.id) && (
                                  <button
                                    onClick={() => { setDisputeRideId(ride.id); setExpandedId(null); }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 text-[10px] font-bold transition cursor-pointer"
                                    title="Raise Dispute"
                                  >
                                    <ShieldAlert className="w-3 h-3" />
                                    Dispute
                                  </button>
                                )}
                                {!ride.rating && (
                                  <button
                                    onClick={() => setRatingRideId(ratingRideId === ride.id ? null : ride.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[10px] font-bold transition cursor-pointer"
                                    title="Rate Driver"
                                  >
                                    <Star className="w-3 h-3" />
                                    Rate
                                  </button>
                                )}
                                {ride.rating && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-amber-500 text-[11px] font-bold">
                                    {'★'.repeat(ride.rating)}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Active / In Progress */}
                            {displayStatus === 'in_progress' && (
                              <>
                                <button
                                  onClick={onTrackRide}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition cursor-pointer"
                                >
                                  <Navigation className="w-3 h-3" />
                                  Track
                                </button>
                                {['booked', 'assigned'].includes(ride.status) && (
                                  <button
                                    onClick={() => handleCancel(ride.id)}
                                    disabled={cancellingId === ride.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition cursor-pointer disabled:opacity-60"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    {cancellingId === ride.id ? 'Cancelling…' : 'Cancel'}
                                  </button>
                                )}
                              </>
                            )}

                            {/* Cancelled */}
                            {displayStatus === 'cancelled' && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-theme-text-primary hover:bg-theme-card text-[10px] font-bold transition cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                Details
                              </button>
                            )}

                            {/* Dispute Open */}
                            {displayStatus === 'dispute_open' && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 text-[10px] font-bold transition cursor-pointer"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                View Dispute
                              </button>
                            )}

                            {/* Refund Processed */}
                            {displayStatus === 'refund_processed' && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-[10px] font-bold transition cursor-pointer"
                              >
                                <BadgeCheck className="w-3 h-3" />
                                View Resolution
                              </button>
                            )}

                            {/* Expand chevron */}
                            <ChevronRight
                              className={`w-4 h-4 text-theme-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={13} className="p-0">
                            <div className="border-t border-theme-border/60 bg-theme-bg/40 px-6 py-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Left Column: Route, Fare Breakdown, Payment Info */}
                                <div className="space-y-4">
                                  {/* Route */}
                                  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3 text-xs font-semibold text-theme-text-secondary">
                                    <h5 className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold mb-1">Route Details</h5>
                                    <div className="flex gap-2.5 items-start">
                                      <CircleDot className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="text-[9px] font-mono uppercase block text-theme-text-secondary font-bold">Pickup Origin</span>
                                        <p className="text-theme-text-primary mt-0.5">{ride.pickup}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2.5 items-start border-t border-theme-border/40 pt-3">
                                      <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="text-[9px] font-mono uppercase block text-theme-text-secondary font-bold">Drop Destination</span>
                                        <p className="text-theme-text-primary mt-0.5">{ride.drop}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fare breakdown */}
                                  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-2.5 text-xs font-semibold text-theme-text-secondary">
                                    <div className="flex justify-between text-[9px] uppercase tracking-wider font-mono text-theme-text-secondary mb-1">
                                      <span>Fare Breakdown</span>
                                      <span>Amount</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Base Fare</span>
                                      <span className="font-mono text-theme-text-primary">₹{ride.baseFare.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Distance ({ride.distanceKm} km)</span>
                                      <span className="font-mono text-theme-text-primary">₹{ride.distanceFare.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Duration ({ride.durationMin} min)</span>
                                      <span className="font-mono text-theme-text-primary">₹{ride.durationFare.toFixed(2)}</span>
                                    </div>
                                    {ride.weatherFactor > 0 && (
                                      <div className="flex justify-between">
                                        <span>Weather Surcharge</span>
                                        <span className="font-mono text-indigo-500">+₹{ride.weatherFactor.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {ride.trafficFactor > 1 && (
                                      <div className="flex justify-between">
                                        <span>Traffic Multiplier ({ride.trafficFactor.toFixed(1)}x)</span>
                                        <span className="font-mono text-amber-500">
                                          +₹{((ride.distanceFare + ride.durationFare) * (ride.trafficFactor - 1)).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {ride.behaviorDiscount > 0 && (
                                      <div className="flex justify-between text-emerald-600">
                                        <span>Safety Discount</span>
                                        <span className="font-mono font-bold">-₹{ride.behaviorDiscount.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-theme-border mt-1">
                                      <span className="text-theme-text-primary font-bold">Total Charged</span>
                                      <span className="font-mono font-extrabold text-theme-text-primary text-sm">₹{ride.finalFare.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  {/* Payment Information */}
                                  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-2 text-xs font-semibold text-theme-text-secondary">
                                    <h5 className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold mb-1">Payment Information</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Method</span>
                                        <span className="text-theme-text-primary font-bold">{ride.paymentMethod}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Status</span>
                                        <span className={`font-bold ${
                                          (ride.paymentStatus || '').toLowerCase() === 'disputed' ? 'text-orange-500' :
                                          (ride.paymentStatus || '').toLowerCase() === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                                        }`}>
                                          {ride.paymentStatus ? (ride.paymentStatus.charAt(0).toUpperCase() + ride.paymentStatus.slice(1)) : 'Paid'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column: Driver, Safety Telemetry, Weather Conditions, Timeline */}
                                <div className="space-y-4">
                                  {/* Driver details */}
                                  {ride.driverName ? (
                                    <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
                                      <h5 className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold">Driver details</h5>
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                          {ride.driverName[0]}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-theme-text-primary">{ride.driverName}</p>
                                          <p className="text-[10px] text-theme-text-secondary font-mono">{ride.driverVehicle || 'Vehicle details pending'}</p>
                                          {ride.driverPhone && (
                                            <p className="text-[9px] text-theme-text-secondary font-mono">Phone: {ride.driverPhone}</p>
                                          )}
                                        </div>
                                        {ride.driverRating && (
                                          <span className="ml-auto text-amber-500 font-bold text-xs">★ {ride.driverRating}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-theme-card border border-theme-border rounded-2xl p-4 text-xs text-theme-text-secondary font-semibold">
                                      <p>Driver Details: Searching for a driver...</p>
                                    </div>
                                  )}

                                  {/* Safety Score & Telemetry */}
                                  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3 text-xs font-semibold text-theme-text-secondary">
                                    <h5 className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold">Safety Score & Telemetry</h5>
                                    <div className="flex justify-between items-center">
                                      <span>Safety Score</span>
                                      <span className="font-mono font-bold text-brand-emerald bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                        {ride.safetyScore ?? 100}/100
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme-border/40">
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Overspeed Events</span>
                                        <span className="font-mono text-theme-text-primary">{ride.overspeedEvents ?? 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Harsh Brake Events</span>
                                        <span className="font-mono text-theme-text-primary">{ride.harshBrakeEvents ?? 0}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Weather conditions */}
                                  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3 text-xs font-semibold text-theme-text-secondary">
                                    <h5 className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold">Weather conditions</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Condition</span>
                                        <span className="text-theme-text-primary capitalize">{ride.weatherCondition || ride.weatherType || 'Clear'}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Temperature</span>
                                        <span className="text-theme-text-primary font-mono">{ride.temperature ? `${ride.temperature.toFixed(1)}°C` : 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Humidity</span>
                                        <span className="text-theme-text-primary font-mono">{ride.humidity ? `${ride.humidity}%` : 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase font-mono block text-theme-text-secondary">Wind Speed</span>
                                        <span className="text-theme-text-primary font-mono">{ride.windSpeed ? `${ride.windSpeed} km/h` : 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ride timeline */}
                                  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3 text-xs font-semibold text-theme-text-secondary">
                                    <h5 className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold">Ride Timeline</h5>
                                    <div className="relative pl-4 border-l border-theme-border space-y-3 font-medium">
                                      <div className="relative">
                                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                                        <span className="text-[9px] font-mono block text-theme-text-secondary">
                                          {new Date(ride.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-theme-text-primary text-[11px]">Booking Placed</span>
                                      </div>
                                      {ride.assignedAt && (
                                        <div className="relative">
                                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white" />
                                          <span className="text-[9px] font-mono block text-theme-text-secondary">
                                            {new Date(ride.assignedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          <span className="text-theme-text-primary text-[11px]">Driver Assigned</span>
                                        </div>
                                      )}
                                      {ride.acceptedAt && (
                                        <div className="relative">
                                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                                          <span className="text-[9px] font-mono block text-theme-text-secondary">
                                            {new Date(ride.acceptedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          <span className="text-theme-text-primary text-[11px]">Driver Arrived / Started</span>
                                        </div>
                                      )}
                                      {ride.status === 'completed' && ride.completedAt && (
                                        <div className="relative">
                                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white" />
                                          <span className="text-[9px] font-mono block text-theme-text-secondary">
                                            {new Date(ride.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          <span className="text-theme-text-primary text-[11px]">Completed Successfully</span>
                                        </div>
                                      )}
                                      {ride.status === 'cancelled' && (
                                        <div className="relative">
                                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                                          <span className="text-theme-text-primary text-[11px]">Cancelled</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Completed: Rate driver */}
                                  {displayStatus === 'completed' && !ride.rating && ratingRideId === ride.id && (
                                    <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
                                      <p className="text-xs font-bold text-theme-text-primary">Rate your driver</p>
                                      <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <button
                                            key={star}
                                            onClick={() => { onRateRide(ride.id, star); setRatingRideId(null); }}
                                            className="text-2xl text-slate-300 hover:text-amber-500 cursor-pointer transition-colors"
                                            title={`${star} stars`}
                                          >★</button>
                                        ))}
                                      </div>
                                      <p className="text-[10px] text-theme-text-secondary">Your rating helps us maintain service quality.</p>
                                    </div>
                                  )}

                                  {/* Completed: Already rated */}
                                  {displayStatus === 'completed' && ride.rating && (
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                                      <p className="text-[10px] font-mono text-amber-600 uppercase font-bold mb-1">Your Rating</p>
                                      <div className="flex items-center gap-1 text-amber-500">
                                        {Array.from({ length: ride.rating }).map((_, i) => (
                                          <Star key={i} className="w-4 h-4 fill-current" />
                                        ))}
                                        <span className="text-xs text-theme-text-secondary ml-2">({ride.rating} Stars)</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Dispute details */}
                                  {(displayStatus === 'dispute_open' || displayStatus === 'refund_processed') && getDisputeForRide(ride.id) && (() => {
                                    const disp = getDisputeForRide(ride.id)!;
                                    return (
                                      <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between border-b border-theme-border/50 pb-2">
                                          <span className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                            Dispute Ticket
                                          </span>
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                                            disp.status === 'open'
                                              ? 'bg-orange-100 text-orange-700'
                                              : disp.status === 'resolved'
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : 'bg-rose-100 text-rose-700'
                                          }`}>
                                            {disp.status === 'open' ? 'PENDING REVIEW' : disp.status.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="space-y-2 text-xs text-theme-text-secondary">
                                          <div>
                                            <span className="text-[9px] uppercase font-mono font-bold block">Ticket ID</span>
                                            <span className="font-mono font-semibold text-theme-text-primary">{disp.id}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] uppercase font-mono font-bold block">Complaint</span>
                                            <p className="mt-0.5">{disp.reason}</p>
                                          </div>
                                          {disp.resolutionRefundAmount > 0 && (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center font-bold text-emerald-800">
                                              <span className="flex items-center gap-1.5">
                                                <BadgeCheck className="w-4 h-4" />
                                                Refund Processed
                                              </span>
                                              <span className="font-mono text-sm">₹{disp.resolutionRefundAmount.toFixed(2)}</span>
                                            </div>
                                          )}
                                          {disp.aiExplanation && (
                                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60 text-[11px] leading-relaxed">
                                              <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-700 mb-1">AI Analysis</span>
                                              <p className="italic text-theme-text-secondary">{disp.aiExplanation}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* In-progress ride status */}
                                  {displayStatus === 'in_progress' && (
                                    <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-4 space-y-2">
                                      <div className="flex items-center gap-2 text-amber-700">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Live Ride Status</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-theme-text-secondary font-semibold">
                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                        <span className="capitalize">{ride.status.replace('_', ' ')} · {ride.progress ?? 0}% complete</span>
                                      </div>
                                      {ride.driverName && (
                                        <p className="text-xs text-theme-text-secondary">Rider with <strong className="text-theme-text-primary">{ride.driverName}</strong></p>
                                      )}
                                    </div>
                                  )}

                                  {/* Cancelled ride note */}
                                  {displayStatus === 'cancelled' && (
                                    <div className="bg-rose-50/40 border border-rose-200/50 rounded-2xl p-4 space-y-2">
                                      <div className="flex items-center gap-2 text-rose-600">
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-xs font-bold">Ride Cancelled</span>
                                      </div>
                                      <p className="text-[11px] text-theme-text-secondary">
                                        This ride was cancelled before completion. No fare was charged.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Inline Rating flyout row */}
                      {ratingRideId === ride.id && !isExpanded && (
                        <tr>
                          <td colSpan={13} className="p-0">
                            <div className="border-t border-amber-100 bg-amber-50/30 px-6 py-4 flex items-center gap-4">
                              <Star className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-bold text-theme-text-primary">Rate your driver:</span>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => { onRateRide(ride.id, star); setRatingRideId(null); }}
                                    className="text-2xl text-slate-300 hover:text-amber-500 cursor-pointer transition-colors"
                                  >★</button>
                                ))}
                              </div>
                              <button
                                onClick={() => setRatingRideId(null)}
                                className="ml-auto text-theme-text-secondary hover:text-theme-text-primary cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Dispute form flyout row */}
                      {disputeRideId === ride.id && (
                        <tr>
                          <td colSpan={13} className="p-0">
                            <div className="border-t border-orange-100 bg-orange-50/20 px-6 py-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
                                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                                  File a Dispute — Ride {ride.id}
                                </span>
                                <button onClick={() => { setDisputeRideId(null); setSelectedDisputeReason(''); setCustomDisputeReason(''); }} className="text-theme-text-secondary hover:text-theme-text-primary cursor-pointer">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {DISPUTE_REASONS.map(reason => (
                                  <button
                                    key={reason}
                                    onClick={() => setSelectedDisputeReason(reason)}
                                    className={`text-left px-3 py-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
                                      selectedDisputeReason === reason
                                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                                        : 'border-theme-border bg-theme-card text-theme-text-secondary hover:border-orange-200'
                                    }`}
                                  >
                                    {reason}
                                  </button>
                                ))}
                              </div>

                              {selectedDisputeReason === 'Other (describe below)' && (
                                <textarea
                                  value={customDisputeReason}
                                  onChange={e => setCustomDisputeReason(e.target.value)}
                                  placeholder="Describe your issue in detail..."
                                  rows={3}
                                  className="w-full bg-theme-card border border-theme-border p-3 text-xs font-semibold text-theme-text-primary rounded-xl outline-none focus:border-orange-400 resize-none"
                                />
                              )}

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleDisputeSubmit(ride.id)}
                                  disabled={!selectedDisputeReason || isSubmittingDispute || (selectedDisputeReason === 'Other (describe below)' && !customDisputeReason.trim())}
                                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-theme-text-secondary text-white text-xs font-bold rounded-xl cursor-pointer disabled:cursor-not-allowed transition"
                                >
                                  {isSubmittingDispute ? 'Filing Dispute…' : 'Submit Dispute Report'}
                                </button>
                                <p className="text-[10px] text-theme-text-secondary">Our AI system will review and resolve within 24 hours.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-theme-card border border-theme-border py-20 px-6 text-center rounded-3xl flex flex-col items-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ReceiptText className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="font-semibold text-theme-text-primary text-sm">No Rides Found</h4>
          <p className="text-xs text-theme-text-secondary mt-1 max-w-xs mx-auto">
            Book your first ride to populate your ride history with receipts, ratings, and dispute management.
          </p>
        </div>
      )}
    </div>
  );
}
