export type UserRole = 'user' | 'admin';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EventCategory =
  | 'Technology'
  | 'Music'
  | 'Business'
  | 'Workshop'
  | 'Sports'
  | 'Education'
  | 'Art'
  | 'Conference';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventItem {
  eventId: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  bannerImage: string;
  date: string;
  time: string; // e.g. "09:00 AM" or "09:00 - 17:00"
  startTime?: string;
  endTime?: string;
  venue: string;
  location: string; // City, State / Full address
  city?: string;
  organizerId: string;
  organizerName: string;
  capacity: number;
  availableSeats: number;
  ticketPrice: number;
  status: EventStatus;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface BookingAttendee {
  name: string;
  email: string;
  phone?: string;
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface BookingItem {
  bookingId: string;
  bookingReference: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  eventCategory?: EventCategory;
  eventBannerImage?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  eventLocation?: string;
  quantity: number;
  ticketsBooked?: number; // Alias for quantity
  ticketPrice?: number;   // Price per ticket at time of booking
  attendeeDetails: BookingAttendee[];
  totalAmount: number;    // Simulated Booking Value (quantity * ticketPrice)
  status: BookingStatus;
  idempotencyKey?: string;
  bookedAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_confirmation' | 'booking_cancelled' | 'event_update' | 'event_cancelled' | 'system';
  bookingId?: string;
  eventId?: string;
  read: boolean;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  eventTitle?: string;
}

export interface AdminAnalyticsMetrics {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  soldOutEvents: number;
  totalCapacity: number;
  remainingCapacity: number;
  registeredUsers: number;
  usersWithBookings: number;
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  ticketsSold: number;
  avgTicketsPerBooking: number;
  simulatedBookingValue: number;
  avgBookingValue: number;
  overallUtilization: number;
}

export interface EventPerformanceItem {
  eventId: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: string;
  status: EventStatus;
  capacity: number;
  availableSeats: number;
  ticketsSold: number;
  utilization: number;
  ticketPrice: number;
  bookingValue: number;
}

export interface CategoryDistribution {
  name: string;
  eventsCount: number;
  bookingsCount: number;
  ticketsSold: number;
  bookingValue: number;
  value?: number; // fallback for basic charts
}

export interface StatusDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  tickets: number;
  bookingValue: number;
}

export interface ActivityLogItem {
  logId?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface AdminAnalyticsData {
  metrics: AdminAnalyticsMetrics;
  categoryData: CategoryDistribution[];
  statusData: StatusDistribution[];
  bookingTrends: BookingTrend[];
  eventPerformance: EventPerformanceItem[];
  recentActivity: ActivityLogItem[];
}
