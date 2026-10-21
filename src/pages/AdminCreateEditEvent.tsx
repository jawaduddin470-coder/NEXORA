import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { getApiBaseUrl } from '../lib/api';
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

const CATEGORY_PRESETS: Record<EventCategory, string> = {
  Technology: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
  Music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
  Business: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200',
  Workshop: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200',
  Sports: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200',
  Education: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200',
  Art: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200',
  Conference: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200',
};

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
  const [bannerImage, setBannerImage] = useState(CATEGORY_PRESETS.Technology);
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
        const apiBase = getApiBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${apiBase}/events/${id}`, { signal: controller.signal });
        clearTimeout(timeoutId);
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
          setTicketPrice(data.ticketPrice || 0);
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

  // Handle local file selection with instant preview & validation (5MB max)
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

  // Compress and optimize image on client side before upload (max 1280px, ~150-250KB)
  const prepareImageForUpload = async (
    file: File,
    maxDimension = 1280,
    quality = 0.85
  ): Promise<{ base64: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          return reject(new Error('Failed to read image file.'));
        }

        if (file.type === 'image/svg+xml') {
          const parts = dataUrl.split(',');
          return resolve({ base64: parts[1] || '', contentType: file.type });
        }

        const img = new Image();
        img.onload = () => {
          try {
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              const parts = dataUrl.split(',');
              return resolve({ base64: parts[1] || '', contentType: file.type || 'image/jpeg' });
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            const parts = compressed.split(',');
            resolve({ base64: parts[1] || '', contentType: 'image/jpeg' });
          } catch {
            const parts = dataUrl.split(',');
            resolve({ base64: parts[1] || '', contentType: file.type || 'image/jpeg' });
          }
        };
        img.onerror = () => {
          const parts = dataUrl.split(',');
          resolve({ base64: parts[1] || '', contentType: file.type || 'image/jpeg' });
        };
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsDataURL(file);
    });
  };

  // Resilient banner upload helper:
  // Tries Firebase Storage first (if provisioned), and seamlessly falls back to the
  // internal NEXORA Cloud Image API (/api/upload -> /api/images/:id) so publishing never hangs or fails.
  const uploadBannerImage = async (file: File): Promise<string> => {
    setUploadStatusText('Preparing & optimizing banner image...');
    setUploadProgress(20);

    const prepared = await prepareImageForUpload(file);
    setUploadProgress(45);

    // Strategy 1: Attempt Firebase Storage if available with a fast 3-second race
    if (storage) {
      try {
        setUploadStatusText('Connecting to storage...');
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `events/${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, storagePath);

        const storageUploadPromise = new Promise<string>((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
          });

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (uploadErr) => reject(uploadErr),
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        });

        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage unavailable or unprovisioned')), 3000)
        );

        const storageUrl = await Promise.race([storageUploadPromise, timeoutPromise]);
        if (storageUrl) {
          setUploadProgress(100);
          return storageUrl;
        }
      } catch (storageErr) {
        console.warn('Firebase Storage direct upload skipped, using resilient NEXORA Image Service:', storageErr);
      }
    }

    // Strategy 2: High-reliability internal cloud image service via /api/upload
    setUploadStatusText('Saving banner image to NEXORA cloud storage...');
    setUploadProgress(70);

    const token = await getIdToken();
    const apiBase = getApiBaseUrl();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${apiBase}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        base64: prepared.base64,
        contentType: prepared.contentType,
        fileName: file.name,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload banner image.');
    }

    setUploadProgress(100);
    return data.url;
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
      const ticketsBooked = Math.max(0, existingEvent.capacity - existingEvent.availableSeats);
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
      let finalBannerUrl = bannerImage.trim() || CATEGORY_PRESETS[category] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';
      if (selectedFile) {
        setUploadStatusText('Uploading banner image...');
        setUploadProgress(0);
        try {
          finalBannerUrl = await uploadBannerImage(selectedFile);
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

      // Explicit Safety Check: Do NOT allow Base64 data URLs in event metadata payload
      if (finalBannerUrl.startsWith('data:')) {
        setError('Invalid banner format: Base64 data URLs cannot be embedded in event metadata. Please upload an image file or provide an external image URL.');
        setSaving(false);
        setUploadStatusText(null);
        return;
      }

      // STEP 2: Save Event Specification to Firestore via REST API (compact JSON payload with image URL only)
      setUploadStatusText(isEditing ? 'Updating event specification...' : 'Publishing event to Firestore...');
      const token = await getIdToken();
      const apiBase = getApiBaseUrl();
      const url = isEditing ? `${apiBase}/events/${id}` : `${apiBase}/events`;
      const method = isEditing ? 'PUT' : 'POST';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          time: `${startTime || '09:00 AM'} - ${endTime || '05:00 PM'}`,
          startTime: startTime || '09:00 AM',
          endTime: endTime || '05:00 PM',
          venue: venue.trim(),
          location: `${venue.trim()}, ${city.trim()}`,
          city: city.trim(),
          capacity: Number(capacity),
          ticketPrice: Number(ticketPrice),
          status,
          featured,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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
      setError(
        err.name === 'AbortError'
          ? 'Network request timed out. Please check your internet connection or server availability and try again.'
          : err.message || 'Error executing event save.'
      );
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
                <span>Event Banner Image</span>
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

                {/* Direct Image URL input & Quick Preset */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      value={bannerImage.startsWith('data:') ? '' : bannerImage}
                      placeholder="Or paste external image URL (e.g. Unsplash, CDN)..."
                      onChange={(e) => {
                        if (selectedFile) handleRemoveSelectedImage();
                        setBannerImage(e.target.value);
                      }}
                      disabled={saving}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFile) handleRemoveSelectedImage();
                        setBannerImage(CATEGORY_PRESETS[category] || CATEGORY_PRESETS.Technology);
                      }}
                      disabled={saving}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold border border-slate-700 hover:border-cyan-500 transition whitespace-nowrap"
                    >
                      Use Category Preset
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Supported formats: PNG, JPG, JPEG, WEBP (Max 5 MB). Upload directly from your device, paste an image URL, or choose a category preset.
                  </p>
                </div>

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
                onChange={(e) => {
                  const newCat = e.target.value as EventCategory;
                  setCategory(newCat);
                  if (!isEditing && !selectedFile && (!bannerImage || Object.values(CATEGORY_PRESETS).includes(bannerImage))) {
                    setBannerImage(CATEGORY_PRESETS[newCat]);
                  }
                }}
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
