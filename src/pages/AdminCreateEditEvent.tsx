import React, { useEffect, useState, useRef } from 'react';
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
  ImageIcon,
  X,
  FileText,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [existingEvent, setExistingEvent] = useState<EventItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Technology');
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'
  );
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState<number>(200);
  const [ticketPrice, setTicketPrice] = useState<number>(99);
  const [status, setStatus] = useState<EventStatus>('published');
  const [featured, setFeatured] = useState<boolean>(false);

  // Image Selection & Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

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
          setStartTime(data.startTime || data.time?.split(' - ')[0] || '09:00 AM');
          setEndTime(data.endTime || data.time?.split(' - ')[1] || '05:00 PM');
          setVenue(data.venue || '');
          setCity(data.city || data.location || '');
          setCapacity(data.capacity || 200);
          setTicketPrice(data.ticketPrice || 99);
          setStatus(data.status || 'published');
          setFeatured(Boolean(data.featured));
        }
      } catch (err) {
        console.error('Error fetching event for edit:', err);
        setError('Failed to load event data for editing.');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle local file selection with instant preview & validation
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selected file must be a valid image (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must not exceed 5MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Revoke previous object URL if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveSelectedImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload helper to upload image to Firebase Storage and return download URL
  const uploadImageToStorage = async (file: File): Promise<string> => {
    if (!storage) {
      throw new Error('Firebase Storage client is not initialized.');
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `events/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          setUploadStatusText(`Uploading banner... ${Math.round(progress)}%`);
        },
        (uploadErr) => {
          console.error('Firebase Storage upload error:', uploadErr);
          reject(new Error(uploadErr.message || 'Firebase Storage upload failed.'));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (urlErr: any) {
            reject(new Error(urlErr.message || 'Failed to retrieve download URL for uploaded banner.'));
          }
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
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

      // STEP 1: Upload banner if a new file is selected
      let finalBannerUrl = bannerImage;
      if (selectedFile) {
        setUploadStatusText('Uploading banner to Firebase Storage...');
        setUploadProgress(0);
        try {
          finalBannerUrl = await uploadImageToStorage(selectedFile);
          setBannerImage(finalBannerUrl);
        } catch (uploadError: any) {
          console.error('Banner upload failed:', uploadError);
          setError(`Banner upload failed: ${uploadError.message}. Event was not saved.`);
          addToast('Upload Error', uploadError.message || 'Image upload failed', 'error');
          setSaving(false);
          setUploadStatusText(null);
          return; // Do NOT proceed to save if image upload was requested but failed
        }
      }

      // STEP 2: Save Event Specification to Firestore via REST API
      setUploadStatusText(isEditing ? 'Updating event specification...' : 'Publishing event to Firestore...');
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
          bannerImage: finalBannerUrl,
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
        throw new Error(data.message || 'Failed to save event to Firestore');
      }

      addToast(
        isEditing ? 'Event Updated' : 'Event Published',
        `"${title}" has been saved to Cloud Firestore with its banner image.`,
        'success'
      );
      navigate('/admin/events');
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'Error executing event save.');
    } finally {
      setSaving(false);
      setUploadStatusText(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading Event Specification...</p>
        </div>
      </AdminLayout>
    );
  }

  const currentDisplayImage = previewUrl || bannerImage;

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
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>{isEditing ? 'Edit Event Specification' : 'Create New Event Listing'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
            {isEditing ? `Edit "${title || 'Event'}"` : 'Publish New Event'}
          </h1>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl space-y-6 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          {/* Banner Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-brand-purple" />
                <span>Event Banner Image (Firebase Storage)</span>
              </label>
              {selectedFile && (
                <span className="text-[11px] text-cyan-400 font-mono flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Image Preview Box */}
              <div className="relative w-full sm:w-64 h-36 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 shadow-lg group">
                <img
                  src={currentDisplayImage}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                />
                {previewUrl && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase shadow-md">
                    Local Preview
                  </div>
                )}
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedImage}
                    title="Remove selected image and restore original"
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-500 text-slate-300 hover:text-white transition shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls & Instructions */}
              <div className="space-y-3 flex-1 w-full">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleImageFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="banner-file-input"
                  disabled={saving}
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor="banner-file-input"
                    className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition shadow-sm cursor-pointer ${
                      saving
                        ? 'opacity-50 pointer-events-none bg-slate-800 text-slate-500 border-slate-700'
                        : 'bg-slate-950 hover:bg-slate-800 text-white border-slate-700 hover:border-brand-purple'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-brand-purple" />
                    <span>{selectedFile ? 'Change Selected Image' : 'Select Image from Computer'}</span>
                  </label>

                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveSelectedImage}
                      className="text-xs text-slate-400 hover:text-rose-400"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Supported formats: PNG, JPG, JPEG, WEBP. Maximum file size: 5 MB. Image is validated locally and uploaded securely to Firebase Storage upon saving.
                </p>

                {/* Upload Progress Bar */}
                {saving && uploadStatusText && (
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-brand-purple to-brand-cyan h-full transition-all duration-300"
                        style={{ width: `${selectedFile ? uploadProgress : 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center space-x-1.5 text-cyan-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{uploadStatusText}</span>
                      </span>
                      {selectedFile && <span>{uploadProgress}%</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Global AI & Web3 Summit 2026"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-brand-purple"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-brand-purple"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Event Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Start Time *</label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00 AM"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">End Time *</label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00 PM"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Venue Name *</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Metropolis Convention Center"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">City / Location *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco, CA"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Total Capacity (Seats) *</label>
              <input
                type="number"
                required
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Ticket Price ($ USD) *</label>
              <input
                type="number"
                required
                min={0}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-brand-purple focus:ring-brand-purple"
                />
                <label htmlFor="featured-checkbox" className="text-xs font-bold text-slate-300 cursor-pointer flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Feature on Landing Page Spotlight Carousel</span>
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Description *</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the event schedule and speakers..."
                disabled={saving}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            variant="primary"
            size="lg"
            className="w-full font-bold bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 text-white py-3 rounded-2xl shadow-lg shadow-violet-950/50"
          >
            {saving
              ? uploadStatusText || 'Saving Event...'
              : isEditing
              ? 'Save Event Specification Changes'
              : 'Publish Event Listing to Firestore'}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminCreateEditEvent;
