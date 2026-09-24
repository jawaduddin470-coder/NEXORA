import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { EventCategory, EventStatus, EventItem } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ShieldCheck,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Tag,
  DollarSign,
  Users,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Star,
} from 'lucide-react';

const CATEGORIES: EventCategory[] = [
  'Technology',
  'Music',
  'Business',
  'Workshop',
  'Sports',
  'Education',
  'Art',
  'Conference',
];

const STATUSES: EventStatus[] = ['published', 'draft', 'cancelled', 'completed'];

export const AdminCreateEditEvent: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { getIdToken } = useAuth();
  const { addToast } = useToast();

  const [existingEvent, setExistingEvent] = useState<EventItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Technology');
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState<number>(200);
  const [ticketPrice, setTicketPrice] = useState<number>(99);
  const [status, setStatus] = useState<EventStatus>('published');
  const [featured, setFeatured] = useState<boolean>(false);

  // Image Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Status State
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadEvent() {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/events/${id}`);
        const data = await res.json();
        if (data && data.title) {
          setExistingEvent(data);
          setTitle(data.title);
          setCategory(data.category || 'Technology');
          setDescription(data.description || '');
          setBannerImage(data.bannerImage || '');
          setDate(data.date || '');
          setStartTime(data.startTime || data.time || '09:00 AM');
          setEndTime(data.endTime || '05:00 PM');
          setVenue(data.venue || '');
          setCity(data.city || data.location || '');
          setCapacity(data.capacity || 200);
          setTicketPrice(data.ticketPrice || 99);
          setStatus(data.status || 'published');
          setFeatured(Boolean(data.featured));
        }
      } catch (err) {
        console.error('Error fetching event for edit:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  // Handle banner upload to Firebase Storage
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      addToast('Storage Error', 'Firebase Storage client is not initialized.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Selected file must be a valid image (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must not exceed 5MB.');
      return;
    }

    setError(null);
    const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (err) => {
        console.error('Firebase Storage upload error:', err);
        setUploading(false);
        addToast('Upload Failed', err.message || 'Image upload failed.', 'error');
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setBannerImage(downloadUrl);
        setUploading(false);
        addToast('Image Uploaded', 'Event banner image uploaded to Firebase Storage.', 'success');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Event Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Event Description is required.');
      return;
    }
    if (!date) {
      setError('Event Date is required.');
      return;
    }
    if (!venue.trim()) {
      setError('Venue Name is required.');
      return;
    }
    if (!city.trim()) {
      setError('City/Location is required.');
      return;
    }
    if (capacity <= 0) {
      setError('Total Seating Capacity must be greater than 0.');
      return;
    }
    if (ticketPrice < 0) {
      setError('Ticket Price cannot be negative.');
      return;
    }

    // Capacity Safety Check for Edit
    if (isEditing && existingEvent) {
      const ticketsBooked = existingEvent.capacity - existingEvent.availableSeats;
      if (capacity < ticketsBooked) {
        setError(
          `Cannot reduce total capacity to ${capacity}. ${ticketsBooked} ticket(s) have already been booked for this event.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      const token = await getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const url = isEditing ? `${apiBase}/events/${id}` : `${apiBase}/events`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          bannerImage,
          date,
          time: `${startTime} - ${endTime}`,
          startTime,
          endTime,
          venue: venue.trim(),
          location: `${venue.trim()}, ${city.trim()}`,
          city: city.trim(),
          capacity: Number(capacity),
          ticketPrice: Number(ticketPrice),
          status,
          featured,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save event');
      }

      addToast(
        isEditing ? 'Event Updated' : 'Event Published',
        `"${title}" has been saved to Cloud Firestore.`,
        'success'
      );
      navigate('/admin/events');
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'Error executing event save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading Event Specification...</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Events Catalog</span>
      </button>

      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          <span>{isEditing ? 'Edit Event Specification' : 'Create New Event Listing'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
          {isEditing ? `Edit "${title || 'Event'}"` : 'Publish New Event'}
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800 shadow-soft">
        {/* Banner Upload Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Event Banner Image
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-56 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 shadow-soft-sm">
              <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2 flex-1 w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id="banner-file-input"
              />
              <label
                htmlFor="banner-file-input"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-white hover:border-violet-400 cursor-pointer font-bold transition shadow-soft-sm"
              >
                <Upload className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Upload Banner to Firebase Storage</span>
              </label>

              {uploading && (
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-violet-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Uploading: {uploadProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Global AI & Web3 Summit 2026"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Event Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Start Time *</label>
            <input
              type="text"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="09:00 AM"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">End Time *</label>
            <input
              type="text"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="05:00 PM"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Venue Name *</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Metropolis Convention Center"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">City / Location *</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Total Capacity (Seats) *</label>
            <input
              type="number"
              required
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Ticket Price ($ USD) *</label>
            <input
              type="number"
              required
              min={0}
              value={ticketPrice}
              onChange={(e) => setTicketPrice(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="featured-checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="featured-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Feature on Landing Page Spotlight Carousel</span>
              </label>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the event schedule and speakers..."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        <Button type="submit" loading={saving} variant="primary" size="lg" className="w-full font-bold">
          {isEditing ? 'Save Event Specification Changes' : 'Publish Event Listing to Firestore'}
        </Button>
      </form>
      </div>
    </AdminLayout>
  );
};
