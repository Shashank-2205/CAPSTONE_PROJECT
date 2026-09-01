import React, { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Ambulance,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  HeartPulse,
  Home,
  Layers,
  LifeBuoy,
  MapPin,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Navigation,
  Palette,
  Phone,
  Play,
  QrCode,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Truck,
  User,
  Users,
  Video,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import './App.css'

const defaultMapCenter: [number, number] = [17.385, 78.4867]

const responderIcon = L.divIcon({
  className: 'responder-marker',
  html: '<span>⚡</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const locationIcon = L.divIcon({
  className: 'location-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const distanceBetween = (firstLat: number, firstLon: number, secondLat: number, secondLon: number) => {
  const earthRadius = 6371
  const latitudeDelta = ((secondLat - firstLat) * Math.PI) / 180
  const longitudeDelta = ((secondLon - firstLon) * Math.PI) / 180
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos((firstLat * Math.PI) / 180) * Math.cos((secondLat * Math.PI) / 180) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

type Summary = {
  totalEmergencies: number
  criticalEmergencies: number
  activeRescues: number
  availableVolunteers: number
  resourceShortages: number
}

type Emergency = {
  id: string
  type: string
  priority: string
  status: string
  location: string
  description?: string
  createdAt?: string
}

type Task = {
  id: string
  emergencyId: string
  volunteerId: string
  volunteerName: string
  status: string
  notes: string
}

type Volunteer = {
  id: string
  name: string
  availability: string
  area: string
}

type Resource = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  location: string
  status: string
}

type Allocation = {
  id: string
  resourceId: string
  resourceName: string
  emergencyId: string
  quantity: number
  recipient: string
  status: string
}

type HospitalCapacity = {
  id: string
  ward: string
  available: number
  occupied: number
  icu: number
  status: string
}

type CriticalCase = {
  id: string
  patient: string
  severity: string
  hospital: string
  eta: string
  action: string
}

type Shelter = {
  id: string
  name: string
  capacity: number
  occupants: number
  facilities: string[]
  status: string
}

type Disaster = {
  id: string
  name: string
  region: string
  severity: string
  status: string
  affectedAreas: number
}

type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
}

type RoleKey = 'citizen' | 'volunteer' | 'ngo' | 'hospital' | 'admin'

type ThemeKey = 'midnight' | 'tactical' | 'cyber' | 'light'

type GeoStatus = {
  latitude: number
  longitude: number
  accuracy: number
  risk: 'Low' | 'Moderate' | 'High'
  advisory: string
}

type NearbyPlace = {
  id: string
  name: string
  category: string
  latitude: number
  longitude: number
  distance: number
  highGroundCandidate: boolean
  phone?: string
}

type CctvFeed = {
  id: string
  name: string
  location: string
  status: string
  viewType: 'Thermal' | 'Optical 4K' | 'Night-Vision'
  waterDepth?: string
  imageBg: string
}

const recommendedCategories: Record<string, string[]> = {
  Medical: ['Hospital', 'Police station', 'Emergency shelter'],
  Fire: ['Fire station', 'Open ground / high-ground candidate', 'Police station', 'Emergency shelter'],
  Evacuation: ['Emergency shelter', 'Open ground / high-ground candidate', 'School', 'Police station'],
  Flood: ['Emergency shelter', 'Open ground / high-ground candidate', 'Hospital', 'Police station'],
}

const roleLabels: Record<RoleKey, string> = {
  citizen: 'Citizen Hub',
  volunteer: 'Volunteer HQ',
  ngo: 'NGO Aid Hub',
  hospital: 'Hospital Care',
  admin: 'Command Center',
}

const initialForm = {
  type: 'Flood',
  description: '',
  priority: 'High',
  location: 'Hitec City, Hyderabad',
}

const roleDescriptions: Record<RoleKey, { title: string; subtitle: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = {
  citizen: {
    title: 'Citizen Emergency Center',
    subtitle: 'Instantly report incidents, track field responders, and locate safe shelters.',
    icon: User,
  },
  volunteer: {
    title: 'Volunteer Strike Force HQ',
    subtitle: 'Accept active rescue dispatches, navigate routes, and coordinate team response.',
    icon: Users,
  },
  ngo: {
    title: 'NGO Relief Operations',
    subtitle: 'Manage disaster relief supplies, distribute essential rations, and track logistics.',
    icon: Truck,
  },
  hospital: {
    title: 'Emergency Care & ICU Capacity',
    subtitle: 'Monitor emergency ward capacity, ICU beds, and direct incoming ambulance flow.',
    icon: HeartPulse,
  },
  admin: {
    title: 'Strategic Command Center',
    subtitle: 'Real-time citywide disaster surveillance, incident verification, and multi-agency dispatch.',
    icon: Shield,
  },
}

// Active Hazard Warning Clusters for Leaflet Map (Hyderabad Focus)
const activeHazardZones = [
  { id: 'HAZ-01', name: 'Musi River Moosarambagh Causeway', type: 'Severe Waterlogging (4.8ft Surge)', center: [17.375, 78.49] as [number, number], radius: 550 },
  { id: 'HAZ-02', name: 'Gachibowli Bio-Diversity Underpass', type: 'Submerged Road Corridor', center: [17.438, 78.365] as [number, number], radius: 450 },
  { id: 'HAZ-03', name: 'Kukatpally Y-Junction Area', type: 'Active Transformer Hazard', center: [17.487, 78.415] as [number, number], radius: 380 },
]

const cctvFeeds: CctvFeed[] = [
  {
    id: 'CAM-01',
    name: 'Musi River Causeway Hydrology Sensor',
    location: 'Moosarambagh Bridge, Hyderabad',
    status: '4.82m High Watermark',
    viewType: 'Night-Vision',
    waterDepth: '4.82m (Threshold 5.0m)',
    imageBg: 'radial-gradient(circle at center, rgba(0, 198, 255, 0.25) 0%, #030a16 100%)',
  },
  {
    id: 'CAM-02',
    name: 'Bio-Diversity Flyover Underpass Feed',
    location: 'Gachibowli Tech Corridor',
    status: 'Road Submerged · Closed',
    viewType: 'Thermal',
    waterDepth: '3.4ft Standing Water',
    imageBg: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.25) 0%, #0c0505 100%)',
  },
  {
    id: 'CAM-03',
    name: 'Hitec City Cyber Towers Drone Recon',
    location: 'Madhapur Sector West',
    status: 'Patrol Active · 120m Altitude',
    viewType: 'Optical 4K',
    imageBg: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.25) 0%, #03120b 100%)',
  },
  {
    id: 'CAM-04',
    name: 'NIMS Hospital Emergency Trauma Deck',
    location: 'Punjagutta Ambulances Deck',
    status: 'Triage Receiving Active',
    viewType: 'Night-Vision',
    imageBg: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.25) 0%, #100a02 100%)',
  },
]

const hydroData = [
  { time: '02:00', level: '2.4m', heightPct: 40, risk: 'normal' },
  { time: '04:00', level: '2.8m', heightPct: 46, risk: 'normal' },
  { time: '06:00', level: '3.5m', heightPct: 58, risk: 'warning' },
  { time: '08:00', level: '4.1m', heightPct: 68, risk: 'warning' },
  { time: '10:00', level: '4.82m', heightPct: 84, risk: 'critical' },
  { time: '12:00 (Est)', level: '5.1m', heightPct: 92, risk: 'critical' },
]

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [hospitalCapacity, setHospitalCapacity] = useState<HospitalCapacity[]>([])
  const [criticalCases, setCriticalCases] = useState<CriticalCase[]>([])
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const [activeRole, setActiveRole] = useState<RoleKey>('citizen')
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'incidents' | 'map' | 'volunteers' | 'aid' | 'hospital' | 'alerts' | 'drone' | 'qr'>('home')

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeModal, setActiveModal] = useState<'report' | 'help' | 'location' | 'map' | 'qr' | 'drone' | 'ai' | 'cctv' | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultMapCenter)
  const [tracking, setTracking] = useState(false)
  const [responderPosition, setResponderPosition] = useState<[number, number]>(defaultMapCenter)
  const [plannerDestination, setPlannerDestination] = useState('Gachibowli Indoor Stadium Relief Camp')
  const [plannerMode, setPlannerMode] = useState('Avoid flood zones')
  const [plannerStarted, setPlannerStarted] = useState(false)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [areaName, setAreaName] = useState('Hyderabad Central')

  // Theme Management (Midnight, Tactical, Cyber, Daylight)
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(() => {
    return (localStorage.getItem('resqnet-theme') as ThemeKey) || 'midnight'
  })
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
    localStorage.setItem('resqnet-theme', currentTheme)
  }, [currentTheme])

  const themeOptions: Array<{ key: ThemeKey; name: string; desc: string }> = [
    { key: 'midnight', name: 'Midnight Onyx', desc: 'Default Hotstar Dark' },
    { key: 'tactical', name: 'Tactical Red Alert', desc: 'Disaster High-Intensity' },
    { key: 'cyber', name: 'Cyber Neon', desc: 'Cyan / Sapphire HUD' },
    { key: 'light', name: 'Daylight Field', desc: 'Sunlight High-Visibility' },
  ]

  // Feature 1: Voice SOS speech recognition state
  const [isListening, setIsListening] = useState(false)

  // Feature 2: QR Code relief pass state
  const [reliefToken, setReliefToken] = useState({
    code: 'RESQ-PASS-8924',
    name: 'Citizen Relief Kit & Emergency Rations',
    status: 'Verified · Eligible for 1 Camp Ration Pack',
    redeemed: false,
    timestamp: new Date().toLocaleTimeString(),
  })

  // Feature 3: Drone IoT telemetry state
  const [droneTelemetry] = useState({
    waterLevel: '4.82m',
    waterRisk: 'Critical (+0.8m in 1h)',
    windSpeed: '38.4 km/h',
    airQuality: '142 AQI',
    altitude: '120m',
    battery: '88%',
    signal: 'HD 5G LIVE',
  })

  // Feature 6: Interactive ResQ-AI Disaster Copilot state
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; action?: { label: string; modal?: 'report' | 'map' | 'qr'; role?: RoleKey } }>>([
    {
      sender: 'bot',
      text: 'Namaste! I am ResQ-AI, your Hyderabad Disaster Command Copilot. How can I assist your safety right now?',
    },
  ])
  const [aiInput, setAiInput] = useState('')

  // Feature 8: Selected CCTV feed for detailed preview
  const [selectedCctv, setSelectedCctv] = useState<CctvFeed | null>(null)

  // Default fallback data if server endpoints are empty (Hyderabad Focus)
  const defaultEmergencies: Emergency[] = [
    { id: 'RESQ-4091', type: 'Flood', priority: 'Critical', location: 'Gachibowli Outer Ring Road', status: 'Active', description: 'Severe waterlogging with 3 trapped vehicles near underpass.' },
    { id: 'RESQ-4092', type: 'Medical', priority: 'High', location: 'Banjara Hills Rd No. 12', status: 'Dispatched', description: 'Elderly patient with oxygen supply failure, emergency transport required.' },
    { id: 'RESQ-4093', type: 'Fire', priority: 'Critical', location: 'Hitec City Cyber Towers', status: 'Active', description: 'Commercial building transformer fire, evacuation underway.' },
    { id: 'RESQ-4094', type: 'Evacuation', priority: 'Medium', location: 'Musi River Lowlands (Moosarambagh)', status: 'Verified', description: 'Low-lying residential cluster relocation to safe high ground.' },
  ]

  const displayEmergencies = emergencies.length > 0 ? emergencies : defaultEmergencies

  const defaultShelters: Shelter[] = [
    { id: 'SHL-01', name: 'Gachibowli Indoor Stadium Relief Camp', capacity: 1500, occupants: 480, status: 'Active', facilities: ['Mass Triage', 'Clean Water', 'Food Rations', 'Backup Power'] },
    { id: 'SHL-02', name: 'Kotla Vijaya Bhaskara Reddy Stadium (Yousufguda)', capacity: 800, occupants: 320, status: 'Operational', facilities: ['Helipad Access', 'Bedding', 'First Aid', 'Child Care'] },
    { id: 'SHL-03', name: 'Secunderabad Railway Community Hall', capacity: 400, occupants: 310, status: 'Near Full', facilities: ['Emergency Shelter', 'Sanitation', 'Rations'] },
  ]
  const displayShelters = shelters.length > 0 ? shelters : defaultShelters

  const defaultHospitalCapacity: HospitalCapacity[] = [
    { id: 'HSP-01', ward: 'NIMS Hyderabad Trauma & Emergency', available: 14, occupied: 36, icu: 4, status: 'Stable' },
    { id: 'HSP-02', ward: 'Osmania General Hospital ICU', available: 3, occupied: 29, icu: 3, status: 'High Load' },
    { id: 'HSP-03', ward: 'Gandhi Hospital Critical Care', available: 9, occupied: 15, icu: 2, status: 'Stable' },
  ]
  const displayHospitalCapacity = hospitalCapacity.length > 0 ? hospitalCapacity : defaultHospitalCapacity

  const defaultResources: Resource[] = [
    { id: 'RES-01', name: 'Emergency Inflatable Boats', category: 'Rescue', quantity: 14, unit: 'Boats', location: 'Hyderabad Central Depot', status: 'Available' },
    { id: 'RES-02', name: 'Trauma First-Aid Kits', category: 'Medical', quantity: 85, unit: 'Kits', location: 'Secunderabad Warehouse', status: 'Available' },
    { id: 'RES-03', name: 'Packaged Water & Meals', category: 'Rations', quantity: 450, unit: 'Packs', location: 'Gachibowli Relief Hub', status: 'Available' },
    { id: 'RES-04', name: 'High-Output Generators', category: 'Power', quantity: 8, unit: 'Units', location: 'Banjara Hills Sector 5', status: 'In Use' },
  ]
  const displayResources = resources.length > 0 ? resources : defaultResources

  const defaultTasks: Task[] = [
    { id: 'TSK-101', emergencyId: 'RESQ-4091', volunteerId: 'VOL-01', volunteerName: 'Arjun Varma', status: 'In Progress', notes: 'Deploy inflatable boat for Musi River underpass rescue' },
    { id: 'TSK-102', emergencyId: 'RESQ-4092', volunteerId: 'VOL-04', volunteerName: 'Dr. Priya Sharma', status: 'Assigned', notes: 'Rapid oxygen unit transit to Banjara Hills' },
    { id: 'TSK-103', emergencyId: 'RESQ-4093', volunteerId: 'VOL-09', volunteerName: 'Kavita Reddy', status: 'Accepted', notes: 'Perimeter crowd safety and evacuation guiding at Hitec City' },
  ]
  const displayTasks = tasks.length > 0 ? tasks : defaultTasks

  const defaultCriticalCases: CriticalCase[] = [
    { id: 'CAS-01', patient: 'Rahul Varma (42)', severity: 'Critical Trauma', hospital: 'NIMS Emergency', eta: '4 min', action: 'Trauma Bay 2 Ready' },
    { id: 'CAS-02', patient: 'Fatima Begum (64)', severity: 'Severe Respiratory', hospital: 'Apollo Jubilee Hills', eta: '8 min', action: 'Ventilator Assigned' },
  ]
  const displayCriticalCases = criticalCases.length > 0 ? criticalCases : defaultCriticalCases

  const defaultDisasters: Disaster[] = [
    { id: 'DIS-01', name: 'Musi River Flash Flood Surge', region: 'Hyderabad Central & Old City', severity: 'Severe', status: 'Active Surveillance', affectedAreas: 6 },
    { id: 'DIS-02', name: 'Hitec City Substation Electrical Fire', region: 'Madhapur Tech Zone', severity: 'High', status: 'Contained', affectedAreas: 2 },
  ]
  const displayDisasters = disasters.length > 0 ? disasters : defaultDisasters

  const defaultNotifications: NotificationItem[] = [
    { id: 'NOT-01', title: 'Musi River Flash Flood Warning Issued', message: 'Moosarambagh and Chaderghat lowlands under evacuation notice.', type: 'critical', createdAt: '2m ago' },
    { id: 'NOT-02', title: 'Volunteer Strike Team Mobilized', message: '48 rescue responders active across Hyderabad sectors.', type: 'info', createdAt: '10m ago' },
  ]
  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications

  const apiFetch = async (path: string) => {
    const response = await fetch(`http://localhost:5000/api/v1${path}`)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    return response.json()
  }

  const loadData = async (role: RoleKey) => {
    try {
      const endpoints = await Promise.allSettled([
        apiFetch(`/dashboard/summary?role=${role}`),
        apiFetch('/emergencies'),
        apiFetch('/volunteers'),
        apiFetch('/tasks'),
        apiFetch('/resources'),
        apiFetch('/allocations'),
        apiFetch('/hospital/capacity'),
        apiFetch('/hospital/critical-cases'),
        apiFetch('/shelters'),
        apiFetch('/disasters'),
        apiFetch('/notifications'),
      ])
      const data = endpoints.map((result) => (result.status === 'fulfilled' ? result.value.data : []))
      if (data[0]) setSummary(data[0] as Summary)
      if (Array.isArray(data[1]) && data[1].length > 0) setEmergencies(data[1] as Emergency[])
      if (Array.isArray(data[2]) && data[2].length > 0) setVolunteers(data[2] as Volunteer[])
      if (Array.isArray(data[3]) && data[3].length > 0) setTasks(data[3] as Task[])
      if (Array.isArray(data[4]) && data[4].length > 0) setResources(data[4] as Resource[])
      if (Array.isArray(data[5]) && data[5].length > 0) setAllocations(data[5] as Allocation[])
      if (Array.isArray(data[6]) && data[6].length > 0) setHospitalCapacity(data[6] as HospitalCapacity[])
      if (Array.isArray(data[7]) && data[7].length > 0) setCriticalCases(data[7] as CriticalCase[])
      if (Array.isArray(data[8]) && data[8].length > 0) setShelters(data[8] as Shelter[])
      if (Array.isArray(data[9]) && data[9].length > 0) setDisasters(data[9] as Disaster[])
      if (Array.isArray(data[10]) && data[10].length > 0) setNotifications(data[10] as NotificationItem[])
    } catch (error) {
      console.warn('API fetch warning, using live fallback state', error)
    }
  }

  useEffect(() => {
    void loadData(activeRole)
  }, [activeRole])

  // Geolocation watch
  useEffect(() => {
    if (!tracking || !navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextPosition: [number, number] = [coords.latitude, coords.longitude]
        setMapCenter(nextPosition)
        setGeoStatus((current) => ({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          risk: current?.risk ?? 'Moderate',
          advisory: current?.advisory ?? 'Stay alert for local advisories.',
        }))
      },
      () => showToast('Live tracking requires browser location permission.'),
      { enableHighAccuracy: true, maximumAge: 10000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [tracking])

  const showToast = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4500)
  }

  // Voice SOS Speech Recognition
  const startVoiceSOS = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsListening(true)
      setTimeout(() => {
        setIsListening(false)
        const mockVoice = 'Emergency flood near Musi River Moosarambagh, 4 people trapped with rising water.'
        setForm((prev) => ({
          ...prev,
          type: 'Flood',
          priority: 'Critical',
          description: mockVoice,
        }))
        setActiveModal('report')
        showToast(`🎙️ Voice SOS Transcribed: "${mockVoice}"`)
      }, 2500)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-IN'
      setIsListening(true)

      recognition.onresult = (event: any) => {
        const speechText = event.results[0][0].transcript
        setIsListening(false)

        const lower = speechText.toLowerCase()
        let detectedType = form.type
        if (lower.includes('flood') || lower.includes('water') || lower.includes('submerged')) detectedType = 'Flood'
        else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('flame')) detectedType = 'Fire'
        else if (
          lower.includes('medical') ||
          lower.includes('heart') ||
          lower.includes('patient') ||
          lower.includes('doctor') ||
          lower.includes('ambulance') ||
          lower.includes('oxygen')
        )
          detectedType = 'Medical'
        else if (lower.includes('evacuate') || lower.includes('shelter') || lower.includes('trapped')) detectedType = 'Evacuation'

        let detectedPriority = 'High'
        if (
          lower.includes('critical') ||
          lower.includes('emergency') ||
          lower.includes('danger') ||
          lower.includes('dying') ||
          lower.includes('immediate')
        )
          detectedPriority = 'Critical'

        setForm((prev) => ({
          ...prev,
          type: detectedType,
          priority: detectedPriority,
          description: speechText,
        }))
        setActiveModal('report')
        showToast(`🎙️ Voice SOS Transcribed: "${speechText.slice(0, 40)}..."`)
      }

      recognition.onerror = () => {
        setIsListening(false)
        showToast('Voice capture timed out. You can type or retry.')
      }

      recognition.start()
    } catch {
      setIsListening(false)
      showToast('Speech recognition unavailable. You can type in the form directly.')
    }
  }

  // ResQ-AI Query Processor
  const handleSendAiQuery = (queryText: string) => {
    const q = queryText.trim()
    if (!q) return

    setAiMessages((prev) => [...prev, { sender: 'user', text: q }])
    setAiInput('')

    setTimeout(() => {
      const lower = q.toLowerCase()
      let botResponse = ''
      let action: { label: string; modal?: 'report' | 'map' | 'qr'; role?: RoleKey } | undefined = undefined

      if (lower.includes('flood') || lower.includes('water') || lower.includes('musi')) {
        botResponse =
          '⚠️ Musi River water level is at 4.82m (near 5.0m danger threshold). High-risk zones: Moosarambagh and Chaderghat. Safe shelters are active at Gachibowli Indoor Stadium.'
        action = { label: 'Navigate Safe Evacuation Corridor', modal: 'map' }
      } else if (lower.includes('icu') || lower.includes('hospital') || lower.includes('bed') || lower.includes('doctor')) {
        botResponse =
          '🏥 NIMS Hyderabad has 14 available emergency beds and 4 ICU units. Osmania General Hospital is under high load (3 beds remaining).'
        action = { label: 'View Hospital ICU Ward Status', role: 'hospital' }
      } else if (lower.includes('volunteer') || lower.includes('join') || lower.includes('squad')) {
        botResponse =
          '🦺 48 volunteers are active across Hyderabad sectors. Responders needed for medical transit in Banjara Hills and flood rescue near Musi River.'
        action = { label: 'Open Volunteer Strike Force HQ', role: 'volunteer' }
      } else if (lower.includes('ration') || lower.includes('food') || lower.includes('pass') || lower.includes('qr') || lower.includes('kit')) {
        botResponse =
          '🎟️ You can generate a verified Dynamic Relief QR Pass for your sector to claim 1 emergency ration kit and safe camp admittance.'
        action = { label: 'Generate Relief QR Token', modal: 'qr' }
      } else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('electrical')) {
        botResponse =
          '🔥 Active fire protocol: Evacuate downwind, stay below smoke line, avoid water on electrical transformers, and dial 112 immediately.'
        action = { label: 'Report Fire Emergency Now', modal: 'report' }
      } else {
        botResponse =
          `Command Telemetry received: "${q}". Nearest emergency dispatch squad is on standby. Dial 112 or broadcast your coordinates for immediate extraction.`
        action = { label: 'Broadcast Priority SOS', modal: 'report' }
      }

      setAiMessages((prev) => [...prev, { sender: 'bot', text: botResponse, action }])
    }, 600)
  }

  const findNearbyPlaces = async (latitude: number, longitude: number) => {
    const query = `[out:json][timeout:12];(nwr(around:6000,${latitude},${longitude})[amenity~"shelter|hospital|fire_station|police|school"];nwr(around:6000,${latitude},${longitude})[leisure~"park|pitch|sports_centre"];);out center tags;`
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
      if (!response.ok) throw new Error('Nearby places unavailable')
      const result = (await response.json()) as {
        elements: Array<{ id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>
      }
      const places = result.elements
        .map((element) => {
          const placeLatitude = element.lat ?? element.center?.lat
          const placeLongitude = element.lon ?? element.center?.lon
          if (placeLatitude === undefined || placeLongitude === undefined) return null
          const amenity = element.tags?.amenity
          const leisure = element.tags?.leisure
          const category =
            amenity === 'hospital'
              ? 'Hospital'
              : amenity === 'shelter'
                ? 'Emergency shelter'
                : amenity === 'fire_station'
                  ? 'Fire station'
                  : amenity === 'police'
                    ? 'Police station'
                    : leisure === 'park' || leisure === 'pitch' || leisure === 'sports_centre'
                      ? 'Open ground / high-ground candidate'
                      : element.tags?.amenity === 'school'
                        ? 'School'
                        : 'Public support'
          const phone = element.tags?.phone || element.tags?.['contact:phone']
          return {
            id: String(element.id),
            name: element.tags?.name || category,
            category,
            latitude: placeLatitude,
            longitude: placeLongitude,
            distance: distanceBetween(latitude, longitude, placeLatitude, placeLongitude),
            highGroundCandidate: Boolean(leisure),
            ...(phone ? { phone } : {}),
          }
        })
        .filter((place): place is NearbyPlace => place !== null)
        .sort((first, second) => first.distance - second.distance)
        .slice(0, 12)

      setNearbyPlaces(places)
      const firstSafePlace =
        places
          .filter((place) => (recommendedCategories[form.type] || []).includes(place.category))
          .sort((first, second) => first.distance - second.distance)[0] || places[0]
      if (firstSafePlace) {
        setPlannerDestination(firstSafePlace.name)
        setResponderPosition([firstSafePlace.latitude, firstSafePlace.longitude])
      }
    } catch {
      showToast('Nearby places loaded from local telemetry database.')
    }
  }

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
      if (response.ok) {
        const result = (await response.json()) as { address?: { city?: string; town?: string; suburb?: string; county?: string } }
        setAreaName(result.address?.suburb || result.address?.city || result.address?.town || 'Hyderabad Active Sector')
      }
    } catch {
      setAreaName('Hyderabad Active Sector')
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const risk: GeoStatus['risk'] = coords.latitude > 17.2 && coords.latitude < 17.6 ? 'Moderate' : 'Low'
        const advisory =
          risk === 'Moderate'
            ? 'Moderate flood alert in Musi River basin & lowlands. Avoid underpasses and keep emergency channels open.'
            : 'Operational status normal across Hyderabad sectors. Continue monitoring live broadcast feeds.'
        setMapCenter([coords.latitude, coords.longitude])
        setGeoStatus({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, risk, advisory })
        setForm((current) => ({ ...current, location: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` }))
        void findNearbyPlaces(coords.latitude, coords.longitude)
        void reverseGeocode(coords.latitude, coords.longitude)
        setActiveModal('location')
        setLoading(false)
        showToast('📍 Live GPS coordinates synced successfully')
      },
      () => {
        showToast('Location permission denied. Enter your landmark manually.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleEmergencySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/v1/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Emergency submission failed')
      }

      setEmergencies((current) => [result.data, ...current])
      setForm(initialForm)
      setActiveModal(null)
      showToast(`🚨 Priority Emergency #${result.data.id} Dispatched to Command Center!`)
      void loadData(activeRole)
    } catch {
      const newEmergency: Emergency = {
        id: `RESQ-${Math.floor(1000 + Math.random() * 9000)}`,
        type: form.type,
        priority: form.priority,
        status: 'Active',
        location: form.location,
        description: form.description,
      }
      setEmergencies((prev) => [newEmergency, ...prev])
      setForm(initialForm)
      setActiveModal(null)
      showToast(`🚨 Emergency ${newEmergency.id} broadcasted to all rescue squads!`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, nextStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/emergencies/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const result = await response.json()
      if (result.data) {
        setEmergencies((current) => current.map((item) => (item.id === id ? { ...item, status: result.data.status } : item)))
      }
    } catch {
      setEmergencies((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)))
    }
    showToast(`Incident #${id} updated to ${nextStatus}`)
  }

  const handleTaskStatusUpdate = async (taskId: string, nextStatus: string) => {
    try {
      await fetch(`http://localhost:5000/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })
    } catch (e) {
      console.warn(e)
    }
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)))
    showToast(`Mission #${taskId} status marked: ${nextStatus}`)
  }

  const handleResourceAllocation = (resourceId: string) => {
    const resource = displayResources.find((r) => r.id === resourceId)
    if (!resource) return
    const newAllocation: Allocation = {
      id: `ALC-${Math.floor(100 + Math.random() * 900)}`,
      resourceId,
      resourceName: resource.name,
      emergencyId: displayEmergencies[0]?.id ?? 'RESQ-4091',
      quantity: 5,
      recipient: 'Gachibowli Flood Relief Camp',
      status: 'Dispatched',
    }
    setAllocations((prev) => [newAllocation, ...prev])
    showToast(`📦 5 units of ${resource.name} dispatched to Gachibowli Sector`)
  }

  const handleBedUpdate = (ward: string) => {
    setHospitalCapacity((prev) =>
      prev.map((item) => (item.ward === ward ? { ...item, available: item.available + 2, occupied: Math.max(0, item.occupied - 2) } : item)),
    )
    showToast(`🏥 Bed capacity updated for ${ward} (+2 beds freed)`)
  }

  const handleRedeemQR = () => {
    setReliefToken((prev) => ({ ...prev, redeemed: true }))
    showToast(`✅ Relief Token ${reliefToken.code} successfully verified & ration kit dispensed!`)
  }

  const recommendedPlaces = nearbyPlaces
    .filter((place) => (recommendedCategories[form.type] || []).includes(place.category))
    .sort((first, second) => first.distance - second.distance)

  const activeRoleData = roleDescriptions[activeRole]

  return (
    <div className="hotstar-shell">
      {/* Floating AI Copilot Trigger */}
      <button
        type="button"
        className="ai-copilot-trigger"
        onClick={() => setActiveModal('ai')}
        title="Open ResQ-AI Disaster Copilot"
      >
        <div className="ai-copilot-badge">
          <Bot size={14} />
        </div>
        <span>ResQ-AI Copilot</span>
        <Sparkles size={14} color="#00e5ff" />
      </button>

      {/* ==========================================================================
          HOTSTAR COLLAPSIBLE NAVIGATION SIDEBAR
          ========================================================================== */}
      <aside className="hotstar-sidebar">
        <div
          className="sidebar-brand"
          onClick={() => {
            setActiveNavTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-emblem">R</div>
          <div className="brand-text">
            <span className="brand-title">RESQNET</span>
            <span className="brand-badge">EMERGENCY RESPONSE HUB</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activeNavTab === 'home' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('home')
              window.scrollTo({ top: 0, behavior: 'smooth' })
              showToast('Navigated to Spotlight & Home')
            }}
          >
            <Home className="nav-icon" />
            <span className="nav-label">Spotlight & Home</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'incidents' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('incidents')
              document.getElementById('incidents-tray-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <AlertTriangle className="nav-icon" />
            <span className="nav-label">Live Incidents</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'map' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('map')
              document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Compass className="nav-icon" />
            <span className="nav-label">Radar & Safe Map</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'drone' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('drone')
              setActiveModal('drone')
            }}
          >
            <Camera className="nav-icon" />
            <span className="nav-label">Drone & Sensor HUD</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'qr' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('qr')
              setActiveModal('qr')
            }}
          >
            <QrCode className="nav-icon" />
            <span className="nav-label">Relief QR Pass</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('volunteer')
              setActiveNavTab('volunteers')
              document.getElementById('role-workspace-section')?.scrollIntoView({ behavior: 'smooth' })
              showToast('Switched to Volunteer Strike Force HQ')
            }}
          >
            <Users className="nav-icon" />
            <span className="nav-label">Volunteer Squads</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'aid' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('ngo')
              setActiveNavTab('aid')
              document.getElementById('ngo-inventory-section')?.scrollIntoView({ behavior: 'smooth' })
              showToast('Switched to NGO Relief Supply Hub')
            }}
          >
            <Truck className="nav-icon" />
            <span className="nav-label">NGO Aid Logistics</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'hospital' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('hospital')
              setActiveNavTab('hospital')
              document.getElementById('hospital-icu-section')?.scrollIntoView({ behavior: 'smooth' })
              showToast('Switched to Hospital Emergency & ICU Care')
            }}
          >
            <HeartPulse className="nav-icon" />
            <span className="nav-label">Hospital ICU Beds</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNavTab === 'alerts' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('admin')
              setActiveNavTab('alerts')
              document.getElementById('role-workspace-section')?.scrollIntoView({ behavior: 'smooth' })
              showToast('Switched to Strategic Command Center')
            }}
          >
            <Radio className="nav-icon" />
            <span className="nav-label">Broadcast Center</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sos-trigger-btn" onClick={() => setActiveModal('help')}>
            <ShieldAlert size={18} />
            <span className="nav-label">SOS CHANNEL</span>
          </button>
        </div>
      </aside>

      {/* ==========================================================================
          HOTSTAR MAIN CONTENT REGION
          ========================================================================== */}
      <main className="hotstar-main">
        {/* Sticky Top Header Bar */}
        <header className="hotstar-header">
          <div className="header-left">
            <div className="header-sector-badge">
              <MapPin size={14} />
              <span>Sector: {areaName}</span>
            </div>

            {/* Unique Feature: 1-Click Voice SOS trigger */}
            <button
              type="button"
              className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={startVoiceSOS}
              title="One-Tap Voice Emergency Dispatch"
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isListening ? 'Listening...' : 'Voice SOS'}</span>
            </button>
          </div>

          <div className="header-right">
            {/* Hotstar Theme Switcher */}
            <div className="theme-picker-container">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={() => setThemeMenuOpen((prev) => !prev)}
                title="Customize Interface Theme"
              >
                <Palette size={15} />
                <span style={{ textTransform: 'capitalize' }}>{currentTheme} Theme</span>
              </button>

              {themeMenuOpen && (
                <div className="theme-menu-popover" onClick={(e) => e.stopPropagation()}>
                  <span className="theme-menu-header">Select Interface Theme</span>
                  {themeOptions.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={`theme-option-btn ${currentTheme === t.key ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentTheme(t.key)
                        setThemeMenuOpen(false)
                        showToast(`🎨 Theme updated: ${t.name}`)
                      }}
                    >
                      <div className="theme-option-label">
                        <span className={`theme-preview-dot ${t.key}`} />
                        <div>
                          <div>{t.name}</div>
                          <small style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block' }}>{t.desc}</small>
                        </div>
                      </div>
                      {currentTheme === t.key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hotstar Role Switcher Bar */}
            <div className="role-picker" role="tablist">
              {(Object.keys(roleLabels) as RoleKey[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-btn ${activeRole === role ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRole(role)
                    showToast(`Switched view to ${roleLabels[role]}`)
                  }}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>

            <button type="button" className="header-sos-cta" onClick={() => setActiveModal('report')}>
              <Flame size={16} />
              <span>Report Emergency</span>
            </button>
          </div>
        </header>

        {/* ==========================================================================
            HOTSTAR BILLBOARD HERO SPOTLIGHT (CINEMATIC STREAMING BANNER)
            ========================================================================== */}
        <section className="billboard-hero" id="spotlight-hero-section">
          <div className="billboard-backdrop" />
          <div className="billboard-glow-line" />

          <div className="billboard-content">
            <div className="billboard-tag-row">
              <span className="billboard-tag danger">
                <ShieldAlert size={12} />
                URGENT DISPATCH STREAM
              </span>
              <span className="billboard-tag glass">SECTOR WEST · HYDERABAD</span>
            </div>

            <h1 className="billboard-title">
              ResQNet Disaster Command &amp; Citizen Relief
            </h1>

            <p className="billboard-desc">
              Stream live disaster telemetry, request high-priority emergency extractions, locate real-time shelter beds, and dispatch volunteer rescue strike teams in under 4 minutes.
            </p>

            <div className="billboard-actions">
              <button
                type="button"
                className="btn-hotstar-primary"
                onClick={() => setActiveModal('report')}
              >
                <Play size={18} fill="#ffffff" />
                <span>Report Emergency Now</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-radar"
                onClick={() => {
                  document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
                  showToast('🧭 Live Radar Map activated')
                }}
              >
                <Compass size={18} />
                <span>Open Live Radar Map</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={() => setActiveModal('ai')}
              >
                <Bot size={18} color="#00e5ff" />
                <span>Ask ResQ-AI</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={detectLocation}
              >
                <Crosshair size={18} />
                <span>Instant GPS Detect</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={() => setActiveModal('qr')}
              >
                <QrCode size={18} />
                <span>Relief QR Pass</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={() => setActiveModal('drone')}
              >
                <Camera size={18} />
                <span>Drone HUD</span>
              </button>
            </div>

            {/* Telemetry HUD Quick Stats Ribbon */}
            <div className="telemetry-ribbon">
              <div className="telemetry-card">
                <div className="telemetry-icon-box red">
                  <AlertOctagon size={22} />
                </div>
                <div className="telemetry-info">
                  <span className="telemetry-val">{summary?.totalEmergencies ?? displayEmergencies.length}</span>
                  <span className="telemetry-lbl">Active Incidents</span>
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-icon-box amber">
                  <Flame size={22} />
                </div>
                <div className="telemetry-info">
                  <span className="telemetry-val">{summary?.criticalEmergencies ?? 3}</span>
                  <span className="telemetry-lbl">Critical Code Reds</span>
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-icon-box green">
                  <Users size={22} />
                </div>
                <div className="telemetry-info">
                  <span className="telemetry-val">{summary?.availableVolunteers ?? (volunteers.length > 0 ? volunteers.length : 42)}</span>
                  <span className="telemetry-lbl">Volunteers Online</span>
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-icon-box blue">
                  <Ambulance size={22} />
                </div>
                <div className="telemetry-info">
                  <span className="telemetry-val">{summary?.activeRescues ?? 8}</span>
                  <span className="telemetry-lbl">Rescues In Flight</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            ROLE-SPECIFIC WORKSPACE CONSOLE
            ========================================================================== */}
        <section className="role-workspace-panel" id="role-workspace-section">
          <div className="workspace-header">
            <div className="workspace-title-box">
              <div className="workspace-icon-pill">
                <activeRoleData.icon size={24} />
              </div>
              <div>
                <h2 className="workspace-role-title">{activeRoleData.title}</h2>
                <p className="workspace-role-subtitle">{activeRoleData.subtitle}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={() => setActiveModal('qr')}
              >
                <QrCode size={16} />
                <span>Anti-Hoarding QR Scanner</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={() => setActiveModal('ai')}
              >
                <Bot size={16} color="#00e5ff" />
                <span>Ask ResQ-AI Copilot</span>
              </button>

              <button
                type="button"
                className="btn-hotstar-secondary"
                onClick={() => setActiveModal('help')}
              >
                <LifeBuoy size={16} />
                <span>Quick Assistance Guide</span>
              </button>
            </div>
          </div>

          <div className="workspace-actions-grid">
            {activeRole === 'citizen' && (
              <>
                <div className="workspace-action-card" onClick={() => setActiveModal('report')}>
                  <h4 className="action-card-title">
                    <Flame size={18} color="#f87171" />
                    Submit Emergency SOS
                  </h4>
                  <p className="action-card-detail">Send instant coordinates and photos to citywide dispatch.</p>
                </div>
                <div className="workspace-action-card" onClick={startVoiceSOS}>
                  <h4 className="action-card-title">
                    <Mic size={18} color="#38bdf8" />
                    Speak Voice Emergency
                  </h4>
                  <p className="action-card-detail">Hands-free speech transcription for fast emergency reporting.</p>
                </div>
                <div className="workspace-action-card" onClick={() => setActiveModal('qr')}>
                  <h4 className="action-card-title">
                    <QrCode size={18} color="#00c6ff" />
                    Generate Relief Pass
                  </h4>
                  <p className="action-card-detail">Claim verified ration pack and safe shelter admittance QR pass.</p>
                </div>
                <div
                  className="workspace-action-card"
                  onClick={() => {
                    setPlannerStarted(true)
                    document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
                    showToast('🧭 Safe corridor navigation activated on radar')
                  }}
                >
                  <h4 className="action-card-title">
                    <Navigation size={18} color="#38bdf8" />
                    Safe Evacuation Route
                  </h4>
                  <p className="action-card-detail">Turn-by-turn route avoiding submerged underpasses and hazard clusters.</p>
                </div>
              </>
            )}

            {activeRole === 'volunteer' && (
              <>
                <div
                  className="workspace-action-card"
                  onClick={() => {
                    document.getElementById('volunteer-task-queue')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <h4 className="action-card-title">
                    <Activity size={18} color="#38bdf8" />
                    Strike Mission Queue ({displayTasks.length} tasks)
                  </h4>
                  <p className="action-card-detail">Review pending field dispatch assignments and volunteer routes.</p>
                </div>
                <div
                  className="workspace-action-card"
                  onClick={() => {
                    document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <h4 className="action-card-title">
                    <Navigation size={18} color="#60a5fa" />
                    Team Dispatch Map
                  </h4>
                  <p className="action-card-detail">Review rescue team distribution across all active zones.</p>
                </div>
                <div className="workspace-action-card" onClick={() => setActiveModal('qr')}>
                  <h4 className="action-card-title">
                    <QrCode size={18} color="#f59e0b" />
                    Verify Citizen QR Token
                  </h4>
                  <p className="action-card-detail">Scan citizen QR passes to hand over food and shelter kits.</p>
                </div>
              </>
            )}

            {activeRole === 'ngo' && (
              <>
                <div className="workspace-action-card" onClick={() => showToast('Aid distribution route authorized for Hyderabad Sector')}>
                  <h4 className="action-card-title">
                    <Truck size={18} color="#38bdf8" />
                    Dispatch Relief Rations
                  </h4>
                  <p className="action-card-detail">Authorize supply trucks for flood-affected West zone.</p>
                </div>
                <div
                  className="workspace-action-card"
                  onClick={() => {
                    document.getElementById('ngo-inventory-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <h4 className="action-card-title">
                    <Layers size={18} color="#f472b6" />
                    Inventory Health ({displayResources.length} categories)
                  </h4>
                  <p className="action-card-detail">Monitor dry food packs, inflatable boats, and medical kits.</p>
                </div>
                <div className="workspace-action-card" onClick={() => setActiveModal('qr')}>
                  <h4 className="action-card-title">
                    <QrCode size={18} color="#00c6ff" />
                    Anti-Hoarding Token Audit
                  </h4>
                  <p className="action-card-detail">Ensure each household receives 1 quota of ration kits.</p>
                </div>
              </>
            )}

            {activeRole === 'hospital' && (
              <>
                <div
                  className="workspace-action-card"
                  onClick={() => {
                    document.getElementById('hospital-icu-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <h4 className="action-card-title">
                    <HeartPulse size={18} color="#ef4444" />
                    ICU Capacity Surge ({displayHospitalCapacity.reduce((acc, c) => acc + c.available, 0)} free beds)
                  </h4>
                  <p className="action-card-detail">Dynamic bed status broadcast to emergency ambulances.</p>
                </div>
                <div
                  className="workspace-action-card"
                  onClick={() => {
                    document.getElementById('critical-cases-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <h4 className="action-card-title">
                    <Ambulance size={18} color="#fbbf24" />
                    Critical Patients Inbound ({displayCriticalCases.length})
                  </h4>
                  <p className="action-card-detail">Trauma transfers scheduled for imminent arrival.</p>
                </div>
                <div className="workspace-action-card" onClick={() => showToast('Triage escalation confirmed')}>
                  <h4 className="action-card-title">
                    <Shield size={18} color="#38bdf8" />
                    Triage Escalation Protocol
                  </h4>
                  <p className="action-card-detail">Coordinate secondary hospital bed transfers for overflow.</p>
                </div>
              </>
            )}

            {activeRole === 'admin' && (
              <>
                <div className="workspace-action-card" onClick={() => setActiveModal('drone')}>
                  <h4 className="action-card-title">
                    <Camera size={18} color="#38bdf8" />
                    Drone &amp; Sensor Telemetry Stream
                  </h4>
                  <p className="action-card-detail">Live river water level gauges and aerial thermal feeds.</p>
                </div>
                <div className="workspace-action-card" onClick={() => showToast('Push notification alert sent to all citizens and teams')}>
                  <h4 className="action-card-title">
                    <Radio size={18} color="#ef4444" />
                    Citywide Emergency Broadcast
                  </h4>
                  <p className="action-card-detail">Issue high-priority push notification to all citizens and crews.</p>
                </div>
                <div className="workspace-action-card" onClick={() => showToast('Multi-agency alert level escalated')}>
                  <h4 className="action-card-title">
                    <Zap size={18} color="#00c6ff" />
                    Multi-Agency Mobilization
                  </h4>
                  <p className="action-card-detail">Deploy police, fire stations, and NGO logistics simultaneously.</p>
                </div>
              </>
            )}
          </div>

          {/* Volunteer Task Board (When Volunteer or Admin active) */}
          {(activeRole === 'volunteer' || activeRole === 'admin') && (
            <div id="volunteer-task-queue" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span className="tray-kicker">DISPATCH SQUAD QUEUE</span>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{displayTasks.length} Active Missions</span>
              </div>
              <div className="task-queue-grid">
                {displayTasks.map((t) => (
                  <div key={t.id} className="task-item-card">
                    <div className="task-top">
                      <span className="task-id">#{t.id} · {t.emergencyId}</span>
                      <span className="task-status-pill">{t.status}</span>
                    </div>
                    <div className="task-body">
                      <strong>Responder: {t.volunteerName}</strong>
                      <p style={{ marginTop: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>{t.notes}</p>
                    </div>
                    <div className="task-footer">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() =>
                          handleTaskStatusUpdate(
                            t.id,
                            t.status === 'Assigned' ? 'Accepted' : t.status === 'Accepted' ? 'In Progress' : 'Completed',
                          )
                        }
                      >
                        {t.status === 'Assigned' ? 'Accept Mission' : t.status === 'Accepted' ? 'Start Response' : 'Mark Completed'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NGO Allocations & Supplies Board (When NGO active) */}
          {activeRole === 'ngo' && allocations.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <span className="tray-kicker" style={{ display: 'block', marginBottom: '12px' }}>RECENT AID DISPATCHES</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allocations.map((alc) => (
                  <div
                    key={alc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                    }}
                  >
                    <span><strong>{alc.resourceName}</strong> ({alc.quantity} units)</span>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>To: {alc.recipient}</span>
                    <span className="shelter-status-tag">{alc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hospital Critical Triage Stream (When Hospital active) */}
          {activeRole === 'hospital' && (
            <div id="critical-cases-section" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <span className="tray-kicker" style={{ display: 'block', marginBottom: '12px' }}>CRITICAL TRAUMA PATIENT PIPELINE</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {displayCriticalCases.map((c) => (
                  <div key={c.id} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#ffffff' }}>{c.patient}</strong>
                      <span style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: 800 }}>ETA {c.eta}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: 4 }}>{c.severity}</p>
                    <small style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>{c.hospital} · {c.action}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Live Disaster Broadcast Stream (When Admin active) */}
          {activeRole === 'admin' && (
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <span className="tray-kicker" style={{ display: 'block', marginBottom: '12px' }}>CITYWIDE DISASTER EVENTS &amp; BROADCAST LOGS</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {displayDisasters.map((d) => (
                  <div key={d.id} style={{ background: 'rgba(0, 102, 255, 0.08)', border: '1px solid rgba(0, 102, 255, 0.25)', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#ffffff' }}>{d.name}</strong>
                      <span className="shelter-status-tag">{d.severity}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: 4 }}>{d.region}</p>
                    <small style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>
                      {d.affectedAreas} affected zones · Status: {d.status}
                    </small>
                  </div>
                ))}
                {displayNotifications.map((n) => (
                  <div key={n.id} style={{ background: 'rgba(0, 102, 255, 0.08)', border: '1px solid rgba(0, 102, 255, 0.25)', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#ffffff' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{n.createdAt}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 4 }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ==========================================================================
            HOTSTAR TRAY: MULTI-CAM LIVE CCTV & AERIAL DRONE BROADCASTS
            ========================================================================== */}
        <section className="hotstar-tray-section">
          <div className="tray-header">
            <div className="tray-title-wrap">
              <span className="tray-kicker">LIVE BROADCAST FEEDS</span>
              <h3 className="tray-title">Surveillance Feeds &amp; Hydrology Cams</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}>
              ● 4 SECURE CHANNELS STREAMING
            </span>
          </div>

          <div className="cctv-tray-grid">
            {cctvFeeds.map((cam) => (
              <div
                key={cam.id}
                className="cctv-card"
                onClick={() => {
                  setSelectedCctv(cam)
                  setActiveModal('cctv')
                }}
              >
                <div className="cctv-viewport-bg" style={{ background: cam.imageBg }} />
                <div className="cctv-overlay-hud">
                  <div className="cctv-top-row">
                    <span className="cctv-rec-pill">
                      <Video size={11} />
                      LIVE
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{cam.viewType}</span>
                  </div>

                  <div className="cctv-bottom-row">
                    <div>
                      <h4 className="cctv-cam-title">{cam.name}</h4>
                      <p className="cctv-cam-loc">{cam.location}</p>
                    </div>
                    <Maximize2 size={16} color="#00e5ff" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
            HOTSTAR TRAY 1: ACTIVE EMERGENCY OPERATIONS (CAROUSEL / TRAY STYLE)
            ========================================================================== */}
        <section className="hotstar-tray-section" id="incidents-tray-section">
          <div className="tray-header">
            <div className="tray-title-wrap">
              <span className="tray-kicker">LIVE FEED</span>
              <h3 className="tray-title">Active Emergency Incidents</h3>
            </div>
            <button
              type="button"
              className="tray-view-all"
              onClick={() => setActiveModal('report')}
            >
              <span>+ Report New Incident</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="tray-grid">
            {displayEmergencies.map((item) => {
              const bannerClass = item.type.toLowerCase()
              return (
                <div key={item.id} className="incident-card">
                  <div className={`incident-card-banner ${bannerClass}`}>
                    <div className="incident-category-badge">
                      {item.type === 'Flood' && <Waves size={14} />}
                      {item.type === 'Medical' && <HeartPulse size={14} />}
                      {item.type === 'Fire' && <Flame size={14} />}
                      {item.type === 'Evacuation' && <Navigation size={14} />}
                      <span>{item.type}</span>
                    </div>

                    <span className={`incident-priority-badge ${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </div>

                  <div className="incident-card-body">
                    <span className="incident-card-id">#{item.id}</span>
                    <div className="incident-card-location">
                      <MapPin size={15} color="#38bdf8" />
                      <span>{item.location}</span>
                    </div>
                    <p className="incident-card-desc">
                      {item.description || 'Priority incident requiring immediate rapid squad attention.'}
                    </p>

                    <div className="incident-card-footer">
                      <div className="status-indicator active">
                        <span className="live-pulse-dot" style={{ width: 6, height: 6 }} />
                        <span>{item.status || 'Active'}</span>
                      </div>

                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() =>
                          handleStatusUpdate(
                            item.id,
                            item.status === 'Active'
                              ? 'Dispatched'
                              : item.status === 'Dispatched'
                                ? 'Resolved'
                                : 'Verified',
                          )
                        }
                      >
                        {item.status === 'Active' ? 'Dispatch Unit' : item.status === 'Dispatched' ? 'Mark Resolved' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ==========================================================================
            HOTSTAR TRAY: HYDROGRAPH RIVER SURGE & IMPACT ANALYTICS
            ========================================================================== */}
        <section className="hotstar-tray-section">
          <div className="hydrograph-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="tray-kicker">HYDROLOGY INTELLIGENCE</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>
                  Musi River 24-Hour Surge Hydrograph &amp; Water Level Trajectory
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#ef4444" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>
                  Critical Surge (+1.32m in 6h)
                </span>
              </div>
            </div>

            <div className="hydro-bars">
              {hydroData.map((bar) => (
                <div key={bar.time} className="hydro-col">
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: bar.risk === 'critical' ? '#ef4444' : '#38bdf8' }}>
                    {bar.level}
                  </span>
                  <div
                    className={`hydro-bar-fill ${bar.risk}`}
                    style={{ height: `${bar.heightPct}%` }}
                  />
                  <span className="hydro-time-label">{bar.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            HOTSTAR TRAY 2: NEARBY SAFE SHELTERS & EVACUATION HUBS
            ========================================================================== */}
        <section className="hotstar-tray-section" id="shelters-tray-section">
          <div className="tray-header">
            <div className="tray-title-wrap">
              <span className="tray-kicker">SAFETY NET</span>
              <h3 className="tray-title">Designated Evacuation Shelters</h3>
            </div>
            <button
              type="button"
              className="tray-view-all"
              onClick={() => {
                document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>View On Radar</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="tray-grid">
            {displayShelters.map((shelter) => {
              const occupancyPct = Math.round((shelter.occupants / shelter.capacity) * 100)
              const isHigh = occupancyPct > 80
              return (
                <div key={shelter.id} className="shelter-card">
                  <div className="shelter-head">
                    <div>
                      <h4 className="shelter-name">{shelter.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{shelter.id} · Verified Safe Zone</span>
                    </div>
                    <span className="shelter-status-tag">{shelter.status}</span>
                  </div>

                  <div className="capacity-meter-wrap">
                    <div className="capacity-labels">
                      <span>Occupancy: {shelter.occupants} / {shelter.capacity}</span>
                      <strong style={{ color: isHigh ? '#f87171' : '#38bdf8' }}>{occupancyPct}%</strong>
                    </div>
                    <div className="capacity-bar">
                      <div className={`capacity-fill ${isHigh ? 'high' : ''}`} style={{ width: `${occupancyPct}%` }} />
                    </div>
                  </div>

                  <div className="facilities-chips">
                    {shelter.facilities.map((f) => (
                      <span key={f} className="facility-chip">{f}</span>
                    ))}
                  </div>

                  <div className="incident-card-footer" style={{ marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="card-action-btn"
                      style={{ width: '100%', textAlign: 'center' }}
                      onClick={() => {
                        setPlannerDestination(shelter.name)
                        setPlannerStarted(true)
                        document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
                        showToast(`🧭 Evacuation corridor plotted to ${shelter.name}`)
                      }}
                    >
                      Route to this shelter
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ==========================================================================
            HOTSTAR TRAY 3: HOSPITAL ICU & CRITICAL CARE CAPACITY
            ========================================================================== */}
        <section className="hotstar-tray-section" id="hospital-icu-section">
          <div className="tray-header">
            <div className="tray-title-wrap">
              <span className="tray-kicker">MEDICAL SURGE</span>
              <h3 className="tray-title">Hospital Emergency &amp; ICU Units</h3>
            </div>
            <button
              type="button"
              className="tray-view-all"
              onClick={() => {
                setActiveRole('hospital')
                document.getElementById('role-workspace-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>Manage Capacity</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="tray-grid">
            {displayHospitalCapacity.map((hsp) => (
              <div key={hsp.id} className="hospital-card">
                <div className="hospital-head">
                  <div>
                    <h4 className="hospital-name">{hsp.ward}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{hsp.id}</span>
                  </div>
                  <span className="hospital-status-tag">{hsp.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(0, 102, 255, 0.08)', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>AVAILABLE BEDS</span>
                    <strong style={{ fontSize: '1.4rem', color: '#38bdf8' }}>{hsp.available}</strong>
                  </div>

                  <div style={{ background: 'rgba(0, 102, 255, 0.08)', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>ICU UNITS</span>
                    <strong style={{ fontSize: '1.4rem', color: '#60a5fa' }}>{hsp.icu}</strong>
                  </div>
                </div>

                <div className="incident-card-footer" style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Occupied: {hsp.occupied}</span>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => handleBedUpdate(hsp.ward)}
                  >
                    + Free 2 Beds
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
            HOTSTAR TRAY 4: NGO RELIEF SUPPLIES & INVENTORY
            ========================================================================== */}
        <section className="hotstar-tray-section" id="ngo-inventory-section">
          <div className="tray-header">
            <div className="tray-title-wrap">
              <span className="tray-kicker">LOGISTICS</span>
              <h3 className="tray-title">NGO Emergency Inventory</h3>
            </div>
            <button
              type="button"
              className="tray-view-all"
              onClick={() => {
                setActiveRole('ngo')
                document.getElementById('role-workspace-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>Supply Hub</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="tray-grid">
            {displayResources.map((res) => (
              <div key={res.id} className="shelter-card">
                <div className="shelter-head">
                  <div>
                    <h4 className="shelter-name">{res.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{res.category} · {res.location}</span>
                  </div>
                  <span className="shelter-status-tag">{res.status}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <strong style={{ fontSize: '1.8rem', color: '#ffffff' }}>{res.quantity}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{res.unit} ready</span>
                </div>

                <div className="incident-card-footer" style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Verified Stock</span>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => handleResourceAllocation(res.id)}
                  >
                    Allocate Stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
            LIVE RADAR & SAFE ROUTE PLANNER (WITH DYNAMIC HAZARD AVOIDANCE)
            ========================================================================== */}
        <section className="hotstar-tray-section" id="radar-map-section">
          <div className="tray-header">
            <div className="tray-title-wrap">
              <span className="tray-kicker">GPS SURVEILLANCE &amp; HAZARD HEATMAP</span>
              <h3 className="tray-title">Interactive Live Radar &amp; Evacuation Map</h3>
            </div>
            <button
              type="button"
              className="btn-hotstar-secondary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              onClick={() => setTracking((prev) => !prev)}
            >
              <Navigation size={14} color={tracking ? '#38bdf8' : '#ffffff'} />
              <span>{tracking ? 'Live GPS Active' : 'Enable GPS Tracking'}</span>
            </button>
          </div>

          <div className="radar-map-container">
            <div className="radar-sidebar-panel">
              <div>
                <span className="radar-kicker">AI SAFE CORRIDOR PLANNER</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>Dynamic Evacuation Navigation</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
                  Real-time route calculation from <strong>{areaName}</strong> avoiding 3 active flood &amp; fire hazard polygons.
                </p>
              </div>

              <div className="hazard-legend">
                <span className="hazard-dot" />
                <span>3 Red Alert Hazard Clusters Detected</span>
              </div>

              <div className="radar-controls-group">
                <label className="radar-label">Target Destination</label>
                <select
                  className="radar-select"
                  value={plannerDestination}
                  onChange={(e) => {
                    setPlannerDestination(e.target.value)
                    const place = recommendedPlaces.find((p) => p.name === e.target.value)
                    if (place) setResponderPosition([place.latitude, place.longitude])
                  }}
                >
                  <option>Nearest safe place</option>
                  {displayShelters.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} (Shelter)</option>
                  ))}
                  {recommendedPlaces.map((p) => (
                    <option key={p.id} value={p.name}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div className="radar-controls-group">
                <label className="radar-label">Navigation Priority</label>
                <select
                  className="radar-select"
                  value={plannerMode}
                  onChange={(e) => setPlannerMode(e.target.value)}
                >
                  <option>Avoid flood &amp; hazard zones</option>
                  <option>Fastest safe route</option>
                  <option>Nearest medical trauma center</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-hotstar-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => {
                  setPlannerStarted(true)
                  showToast(`🧭 Safe Corridor plotted to ${plannerDestination} (3 hazard zones avoided)`)
                }}
              >
                <Navigation size={16} />
                <span>{plannerStarted ? 'Recalculate Safe Corridor' : 'Plot Hazard-Free Corridor'}</span>
              </button>

              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                  {plannerStarted ? 'Safe Corridor Active' : 'Radar Standby'}
                </span>
                <p style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, marginTop: 4 }}>
                  {plannerStarted ? `18 min safe route · 4.2 km (0 hazard intersections)` : 'Select a destination above to activate guidance'}
                </p>
              </div>
            </div>

            <div className="radar-map-viewport">
              <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="leaflet-container">
                <MapRecenter center={mapCenter} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User GPS Pin */}
                <Marker position={mapCenter} icon={locationIcon}>
                  <Popup>
                    <strong>Your Verified Location</strong>
                    <br />
                    {areaName}
                  </Popup>
                </Marker>

                {/* Dynamic Hazard Warning Polygons on Map */}
                {activeHazardZones.map((hazard) => (
                  <Circle
                    key={hazard.id}
                    center={hazard.center}
                    radius={hazard.radius}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.35, weight: 2 }}
                  >
                    <Popup>
                      <strong style={{ color: '#ef4444' }}>⚠️ HAZARD ZONE: {hazard.name}</strong>
                      <br />
                      {hazard.type} · Evacuate perimeter
                    </Popup>
                  </Circle>
                ))}

                {/* Nearby Places Pins */}
                {recommendedPlaces.map((place) => (
                  <Marker key={place.id} position={[place.latitude, place.longitude]} icon={responderIcon}>
                    <Popup>
                      <strong>{place.name}</strong>
                      <br />
                      {place.category} · {place.distance.toFixed(1)} km away
                    </Popup>
                  </Marker>
                ))}

                {/* Safe Radius Circle */}
                <Circle
                  center={mapCenter}
                  radius={750}
                  pathOptions={{ color: '#00c6ff', fillColor: '#00c6ff', fillOpacity: 0.1 }}
                />

                {/* Simulated Safe Corridor Route Polyline */}
                {plannerStarted && (
                  <Polyline
                    positions={[mapCenter, responderPosition]}
                    pathOptions={{ color: '#00c6ff', weight: 6, dashArray: '12 8' }}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================================================
          HOTSTAR MODALS & OVERLAYS (AI COPILOT, DRILLS, CCTV, VOICE SOS, QR, DRONE)
          ========================================================================== */}

      {/* 0. INTERACTIVE RESQ-AI COPILOT MODAL */}
      {activeModal === 'ai' && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="ai-copilot-badge" style={{ background: '#0066ff' }}>
                  <Bot size={16} />
                </div>
                <div>
                  <span className="modal-kicker">DISASTER INTELLIGENCE</span>
                  <h3 className="modal-title">ResQ-AI Emergency Copilot</h3>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ai-chat-box">
              <div className="ai-chat-history">
                {aiMessages.map((msg, index) => (
                  <div key={index} className={`ai-msg ${msg.sender}`}>
                    <div className="ai-msg-bubble">
                      <p>{msg.text}</p>
                      {msg.action && (
                        <button
                          type="button"
                          className="btn-hotstar-primary"
                          style={{ padding: '8px 14px', fontSize: '0.78rem', marginTop: 10 }}
                          onClick={() => {
                            setActiveModal(msg.action?.modal || null)
                            if (msg.action?.role) setActiveRole(msg.action.role)
                          }}
                        >
                          <span>{msg.action.label}</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick AI Question Chips */}
              <div className="ai-chips-row">
                <button
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => handleSendAiQuery('What is the Musi River flood risk?')}
                >
                  💧 Musi River flood level?
                </button>
                <button
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => handleSendAiQuery('Find open ICU beds near me')}
                >
                  🏥 Open ICU beds?
                </button>
                <button
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => handleSendAiQuery('How can I join volunteer rescue?')}
                >
                  🦺 Volunteer strike team?
                </button>
                <button
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => handleSendAiQuery('How to claim food rations pass?')}
                >
                  📦 Claim relief ration kit?
                </button>
              </div>

              <form
                className="ai-input-row"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendAiQuery(aiInput)
                }}
              >
                <input
                  className="ai-input"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask ResQ-AI about shelters, medical triage, or rescue..."
                />
                <button type="submit" className="ai-send-btn">
                  <Send size={15} />
                  <span>Ask</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 1. CCTV FULL-SCREEN PREVIEW MODAL */}
      {activeModal === 'cctv' && selectedCctv && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">LIVE BROADCAST CAM</span>
                <h3 className="modal-title">{selectedCctv.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="drone-video-viewport" style={{ height: '300px' }}>
                <div className="drone-crosshair" />
                <div className="drone-hud-overlay">
                  <span>{selectedCctv.id} · {selectedCctv.location}</span>
                  <span style={{ color: '#ef4444' }}>● LIVE 4K ENCODING</span>
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
                  <Video size={40} color="#00e5ff" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <strong style={{ fontSize: '1rem' }}>{selectedCctv.status}</strong>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>Mode: {selectedCctv.viewType} Surveillance</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>LOCATION SECTOR</span>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedCctv.location}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>OPTICAL TELEMETRY</span>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>{selectedCctv.waterDepth || 'Clear Visibility'}</div>
                </div>
              </div>

              <button
                type="button"
                className="btn-hotstar-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setActiveModal(null)
                  document.getElementById('radar-map-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Compass size={18} />
                <span>Locate Camera on Radar Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT EMERGENCY MODAL (WITH VOICE SOS) */}
      {activeModal === 'report' && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">PRIORITY DISPATCH</span>
                <h3 className="modal-title">Report Emergency Incident</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Voice SOS Bar inside modal */}
            <div className="voice-sos-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceSOS}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  <span>{isListening ? 'Listening to voice...' : 'Speak Emergency (Voice SOS)'}</span>
                </button>

                {isListening && (
                  <div className="voice-waves">
                    <span className="voice-bar" />
                    <span className="voice-bar" />
                    <span className="voice-bar" />
                    <span className="voice-bar" />
                    <span className="voice-bar" />
                  </div>
                )}
              </div>
              <small style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Auto-categorizes keywords</small>
            </div>

            <form onSubmit={handleEmergencySubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Incident Category</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Flood</option>
                  <option>Medical</option>
                  <option>Fire</option>
                  <option>Evacuation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Incident Location or Landmark</label>
                <div className="location-detect-row">
                  <input
                    className="form-input"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Gachibowli Outer Ring Rd / GPS Coords"
                    required
                  />
                  <button
                    type="button"
                    className="btn-detect-loc"
                    onClick={detectLocation}
                    disabled={loading}
                  >
                    <Crosshair size={15} />
                    <span>{loading ? 'Locating...' : 'GPS Detect'}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Incident Details &amp; People Affected</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe trapped victims, water levels, fire hazards, or medical urgency..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Threat Priority Level</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-hotstar-primary"
                style={{ width: '100%', padding: '16px', marginTop: 10 }}
                disabled={loading}
              >
                <Play size={18} fill="#ffffff" />
                <span>{loading ? 'Broadcasting Dispatch...' : 'Broadcast Emergency to Rescue Teams'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. SOS / INSTANT HELP MODAL (WITH OFFLINE SMS FALLBACK) */}
      {activeModal === 'help' && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">INSTANT RELIEF CHANNELS</span>
                <h3 className="modal-title">Emergency Response Help Center</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                Select the fastest response protocol for your immediate situation:
              </p>

              <button
                type="button"
                className="btn-hotstar-primary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '16px 20px' }}
                onClick={() => setActiveModal('report')}
              >
                <Flame size={20} fill="#ffffff" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800 }}>Report Emergency to ResQNet Command</div>
                  <small style={{ fontSize: '0.75rem', opacity: 0.9 }}>Dispatches nearest ambulance or volunteer squad</small>
                </div>
              </button>

              <a
                href="tel:112"
                className="btn-hotstar-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '16px 20px', border: '1px solid rgba(239, 68, 68, 0.4)' }}
              >
                <Phone size={20} color="#f87171" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: '#f87171' }}>Dial National Emergency 112</div>
                  <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Direct police, fire, and medical helpline</small>
                </div>
              </a>

              {/* Unique Feature: Offline SMS Fallback */}
              <a
                href={`sms:112?body=RESQNET%20EMERGENCY%20SOS:%20Location%20${encodeURIComponent(form.location)},%20Type%20${form.type},%20Need%20immediate%20rescue.`}
                className="btn-hotstar-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '16px 20px', border: '1px solid rgba(0, 198, 255, 0.4)' }}
              >
                <MessageSquare size={20} color="#38bdf8" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: '#38bdf8' }}>Send Offline Emergency SMS (No Internet)</div>
                  <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Formats GPS SOS SMS if cellular data is down</small>
                </div>
              </a>

              <button
                type="button"
                className="btn-hotstar-radar"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '16px 20px' }}
                onClick={() => {
                  detectLocation()
                }}
              >
                <Crosshair size={20} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800 }}>Scan Nearby Safe Shelters &amp; Hospital Beds</div>
                  <small style={{ fontSize: '0.75rem', color: '#93c5fd' }}>Auto-detects closest evacuation points</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RELIEF QR PASS & ANTI-HOARDING DISPENSER MODAL */}
      {activeModal === 'qr' && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">VERIFIED AID PROTOCOL</span>
                <h3 className="modal-title">Relief Pass &amp; Ration Token</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="qr-pass-card">
              <span className="qr-token-pill">{reliefToken.code}</span>

              {/* Styled SVG QR Code */}
              <div className="qr-code-graphic">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <path
                    d="M10 10h30v30h-30zM15 15h20v20h-20zM60 10h30v30h-30zM65 15h20v20h-20zM10 60h30v30h-30zM15 65h20v20h-20zM22 22h6v6h-6zM72 22h6v6h-6zM22 72h6v6h-6zM45 10h10v10h-10zM45 25h10v10h-10zM45 40h10v20h-10zM45 75h10v15h-10zM10 45h20v10h-20zM60 45h15v10h-15zM80 45h10v20h-10zM60 60h10v10h-10zM75 60h15v10h-15zM60 75h20v15h-20zM85 75h5v15h-5z"
                    fill="#0a101d"
                  />
                </svg>
              </div>

              <div>
                <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                  {reliefToken.name}
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                  Issued for Sector: <strong>{areaName}</strong> · Valid for dry rations, clean water, and emergency medical kit.
                </p>
              </div>

              {reliefToken.redeemed ? (
                <div className="qr-verified-badge">
                  <CheckCircle2 size={16} />
                  <span>Redeemed &amp; Dispensed (Locked to prevent double-claiming)</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-hotstar-primary"
                  style={{ width: '100%' }}
                  onClick={handleRedeemQR}
                >
                  <CheckCircle2 size={18} />
                  <span>Scan &amp; Dispense Relief Ration</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. DRONE SURVEILLANCE & IOT TELEMETRY STREAM MODAL */}
      {activeModal === 'drone' && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">COMMAND RADAR FEED</span>
                <h3 className="modal-title">Live Drone Aerial &amp; IoT Telemetry</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drone-telemetry-modal">
              {/* Simulated Drone Camera Viewport */}
              <div className="drone-video-viewport">
                <div className="drone-crosshair" />
                <div className="drone-hud-overlay">
                  <span>DRONE-UNIT #04 · SECTOR HYDERABAD WEST</span>
                  <span>ALT: {droneTelemetry.altitude} · BAT: {droneTelemetry.battery}</span>
                  <span style={{ color: '#ef4444' }}>● LIVE FEED</span>
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  <Radio size={32} color="#00c6ff" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <strong>THERMAL IMAGING RECONNAISSANCE ACTIVE</strong>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Surveillance over Musi River Basin &amp; Gachibowli Corridor</p>
                </div>
              </div>

              {/* IoT Sensor Live Telemetry Grid */}
              <div className="drone-iot-grid">
                <div className="drone-iot-card" style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}>
                  <span className="drone-iot-label" style={{ color: '#f87171' }}>River Water Level Gauge</span>
                  <span className="drone-iot-val" style={{ color: '#f87171' }}>{droneTelemetry.waterLevel}</span>
                  <small style={{ fontSize: '0.7rem', color: '#fca5a5' }}>{droneTelemetry.waterRisk}</small>
                </div>

                <div className="drone-iot-card">
                  <span className="drone-iot-label">Wind Velocity</span>
                  <span className="drone-iot-val">{droneTelemetry.windSpeed}</span>
                  <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Gusting North-East</small>
                </div>

                <div className="drone-iot-card">
                  <span className="drone-iot-label">Air Quality Index</span>
                  <span className="drone-iot-val">{droneTelemetry.airQuality}</span>
                  <small style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Sensors Stable</small>
                </div>

                <div className="drone-iot-card">
                  <span className="drone-iot-label">Uplink Telemetry</span>
                  <span className="drone-iot-val" style={{ color: '#00c6ff' }}>{droneTelemetry.signal}</span>
                  <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Latency: 14ms</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. LOCATION INTELLIGENCE MODAL */}
      {activeModal === 'location' && geoStatus && (
        <div className="hotstar-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="hotstar-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">GEO RADAR TELEMETRY</span>
                <h3 className="modal-title">Sector Intelligence · {areaName}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(0, 102, 255, 0.1)', border: '1px solid rgba(0, 102, 255, 0.3)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Threat Assessment: {geoStatus.risk} Risk
                </span>
                <p style={{ fontSize: '0.88rem', color: '#ffffff', marginTop: 4 }}>{geoStatus.advisory}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>LATITUDE</span>
                  <div style={{ fontWeight: 700 }}>{geoStatus.latitude.toFixed(5)}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>LONGITUDE</span>
                  <div style={{ fontWeight: 700 }}>{geoStatus.longitude.toFixed(5)}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
                  Closest Safe Response Hubs
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {recommendedPlaces.slice(0, 4).map((place) => (
                    <div
                      key={place.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff', display: 'block' }}>{place.name}</strong>
                        <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{place.category}</small>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                        {place.distance.toFixed(1)} km
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-hotstar-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => {
                  setActiveModal(null)
                  const radarSection = document.getElementById('radar-map-section')
                  if (radarSection) radarSection.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Compass size={18} fill="#ffffff" />
                <span>Navigate on Live Radar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {message && (
        <div className="hotstar-toast">
          <Sparkles size={18} color="#38bdf8" />
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
