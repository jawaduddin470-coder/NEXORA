import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase Admin SDK credentials in .env file.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

const DEMO_EVENTS = [
  {
    title: 'Global AI & Web3 Summit 2026',
    slug: 'global-ai-web3-summit-2026',
    category: 'Technology',
    description: 'Join world-renowned engineers, researchers, and AI pioneers for keynotes on autonomous agents, neural graphics, and decentralized computing infrastructure.',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    date: '2026-10-15',
    time: '09:00 AM',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: 'Metropolis Convention Center',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 500,
    availableSeats: 482,
    ticketPrice: 299,
    status: 'published',
    featured: true,
  },
  {
    title: 'Neon Symphony: Electronic Music Fest',
    slug: 'neon-symphony-electronic-music-fest',
    category: 'Music',
    description: 'An immersive audio-visual celebration featuring international electronic producers, laser choreography, and spatial sound engineering.',
    bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
    date: '2026-11-02',
    time: '07:00 PM',
    startTime: '07:00 PM',
    endTime: '01:00 AM',
    venue: 'Cyber Arena Dome',
    location: 'Austin, TX',
    city: 'Austin',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 1200,
    availableSeats: 1140,
    ticketPrice: 120,
    status: 'published',
    featured: true,
  },
  {
    title: 'Venture Vanguard: Founder & Investor Forum',
    slug: 'venture-vanguard-founder-investor-forum',
    category: 'Business',
    description: 'High-stakes networking, pitch showcases, and private roundtable sessions connecting series-A founders with top-tier venture partners.',
    bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
    date: '2026-10-28',
    time: '10:00 AM',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    venue: 'Grand Horizon Tower',
    location: 'New York, NY',
    city: 'New York',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 250,
    availableSeats: 210,
    ticketPrice: 450,
    status: 'published',
    featured: false,
  },
  {
    title: 'Generative UI & Shader Masterclass',
    slug: 'generative-ui-shader-masterclass',
    category: 'Workshop',
    description: 'Hands-on intensive lab covering Three.js, WebGL shader programming, GSAP animation orchestration, and modern React performance tuning.',
    bannerImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
    date: '2026-11-12',
    time: '01:00 PM',
    startTime: '01:00 PM',
    endTime: '06:00 PM',
    venue: 'Innovate Hub Labs',
    location: 'Seattle, WA',
    city: 'Seattle',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 80,
    availableSeats: 65,
    ticketPrice: 150,
    status: 'published',
    featured: true,
  },
  {
    title: 'Extreme Urban Esports Championship',
    slug: 'extreme-urban-esports-championship',
    category: 'Sports',
    description: 'The world\'s top esports squads compete live in front of a stadium audience for the 2026 Nexus Trophy.',
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    date: '2026-12-05',
    time: '04:00 PM',
    startTime: '04:00 PM',
    endTime: '11:00 PM',
    venue: 'Zenith Arena',
    location: 'Los Angeles, CA',
    city: 'Los Angeles',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 2000,
    availableSeats: 1850,
    ticketPrice: 85,
    status: 'published',
    featured: false,
  },
  {
    title: 'Future of Learning & EdTech Expo',
    slug: 'future-of-learning-edtech-expo',
    category: 'Education',
    description: 'Exploring AI-driven personalized learning, virtual reality classrooms, and open-source global educational access.',
    bannerImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200',
    date: '2026-11-20',
    time: '09:30 AM',
    startTime: '09:30 AM',
    endTime: '05:00 PM',
    venue: 'Academic Center of Excellence',
    location: 'Boston, MA',
    city: 'Boston',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 400,
    availableSeats: 390,
    ticketPrice: 99,
    status: 'published',
    featured: false,
  },
  {
    title: 'Lumina Digital Art & Holography Gallery',
    slug: 'lumina-digital-art-holography-gallery',
    category: 'Art',
    description: 'Step into an interactive gallery featuring immersive light installations, 3D holographic sculptures, and generative digital artwork.',
    bannerImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200',
    date: '2026-10-30',
    time: '06:00 PM',
    startTime: '06:00 PM',
    endTime: '10:00 PM',
    venue: 'Prism Modern Art Center',
    location: 'Chicago, IL',
    city: 'Chicago',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 300,
    availableSeats: 260,
    ticketPrice: 65,
    status: 'published',
    featured: false,
  },
  {
    title: 'NextGen Cloud & Security Conference',
    slug: 'nextgen-cloud-security-conference',
    category: 'Conference',
    description: 'Zero-trust architecture, cloud-native resiliency, quantum-resistant encryption, and automated compliance for modern cloud teams.',
    bannerImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    date: '2026-12-15',
    time: '08:30 AM',
    startTime: '08:30 AM',
    endTime: '05:30 PM',
    venue: 'Tech Dome Expo Hall',
    location: 'Denver, CO',
    city: 'Denver',
    organizerId: 'system-admin',
    organizerName: 'NEXORA Events',
    capacity: 600,
    availableSeats: 580,
    ticketPrice: 350,
    status: 'published',
    featured: false,
  },
];

async function seedDatabase() {
  console.log('⏳ Seeding NEXORA demo events into Firestore...');
  const eventsCollection = db.collection('events');

  for (const eventData of DEMO_EVENTS) {
    const existing = await eventsCollection.where('slug', '==', eventData.slug).get();
    if (existing.empty) {
      const ref = eventsCollection.doc();
      const timestamp = new Date().toISOString();
      await ref.set({
        eventId: ref.id,
        ...eventData,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  + Created event: ${eventData.title} (${ref.id})`);
    } else {
      console.log(`  = Event already exists: ${eventData.title}`);
    }
  }

  console.log('🎉 SEEDING COMPLETE! 8 realistic events available.');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
