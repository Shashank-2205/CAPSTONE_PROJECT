import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const defaultMapCenter: [number, number] = [12.9716, 77.5946]
const responderIcon = L.divIcon({ className: 'responder-marker', html: '<span>+</span>', iconSize: [34, 34], iconAnchor: [17, 17] })
const locationIcon = L.divIcon({ className: 'location-marker', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

const distanceBetween = (firstLat: number, firstLon: number, secondLat: number, secondLon: number) => {
  const earthRadius = 6371
  const latitudeDelta = (secondLat - firstLat) * Math.PI / 180
  const longitudeDelta = (secondLon - firstLon) * Math.PI / 180
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(firstLat * Math.PI / 180) * Math.cos(secondLat * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.setView(center) }, [center, map])
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

const recommendedCategories: Record<string, string[]> = {
  Medical: ['Hospital', 'Police station', 'Emergency shelter'],
  Fire: ['Fire station', 'Open ground / high-ground candidate', 'Police station', 'Emergency shelter'],
  Evacuation: ['Emergency shelter', 'Open ground / high-ground candidate', 'School', 'Police station'],
  Flood: ['Emergency shelter', 'Open ground / high-ground candidate', 'Hospital', 'Police station'],
}

const emergencyGuidance: Record<string, string> = {
  Medical: 'Showing hospitals and urgent care support closest to you.',
  Fire: 'Move away from smoke and fire. Showing fire stations and open assembly areas.',
  Evacuation: 'Showing shelters and open/high-ground areas for evacuation.',
  Flood: 'Avoid floodwater. Showing shelters and open/high-ground areas first.',
}

const roleLabels: Record<RoleKey, string> = {
  citizen: 'Citizen',
  volunteer: 'Volunteer',
  ngo: 'NGO',
  hospital: 'Hospital',
  admin: 'Admin',
}

const initialForm = {
  type: 'Flood',
  description: '',
  priority: 'High',
  location: 'Bengaluru East',
}

const dashboardByRole: Record<
  RoleKey,
  {
    heading: string
    subtitle: string
    points: string[]
    actions: Array<{ title: string; detail: string }>
  }
> = {
  citizen: {
    heading: 'Citizen Response Center',
    subtitle: 'Track emergency requests, shelters, and local support quickly.',
    points: ['Active emergencies', 'Nearby shelter visibility', 'Fast status updates'],
    actions: [
      { title: 'Report incident', detail: 'Submit an emergency with precise location and priority.' },
      { title: 'Check status', detail: 'Track resolution progress and field updates.' },
      { title: 'Find safe shelter', detail: 'View nearby evacuation and support options.' },
    ],
  },
  volunteer: {
    heading: 'Volunteer Operations',
    subtitle: 'Accept assignments and monitor your active rescue tasks.',
    points: ['Assigned missions', 'Nearby incidents', 'Task completion tracking'],
    actions: [
      { title: 'Review queue', detail: 'See the next emergency requests requiring attention.' },
      { title: 'Accept mission', detail: 'Pick up nearby incidents and start rescue work.' },
      { title: 'Close task', detail: 'Update incident status to resolved once complete.' },
    ],
  },
  ngo: {
    heading: 'NGO Resource Hub',
    subtitle: 'Manage inventory, requests, and aid distribution with live updates.',
    points: ['Inventory health', 'Allocation requests', 'Distribution history'],
    actions: [
      { title: 'Inventory review', detail: 'Check shelter kits, food, and medical supply levels.' },
      { title: 'Dispatch aid', detail: 'Approve urgent allocations to affected areas.' },
      { title: 'Track delivery', detail: 'Monitor resource movement and remaining stock.' },
    ],
  },
  hospital: {
    heading: 'Hospital Capacity Dashboard',
    subtitle: 'Monitor beds, emergency capacity, and critical patient coordination.',
    points: ['Available beds', 'ICU status', 'Critical case view'],
    actions: [
      { title: 'Bed availability', detail: 'Review critical capacity and patient load.' },
      { title: 'Incoming patients', detail: 'Coordinate treatment for urgent medical emergencies.' },
      { title: 'Capacity alert', detail: 'Flag surges and request additional support.' },
    ],
  },
  admin: {
    heading: 'Admin Command Center',
    subtitle: 'Monitor emergencies, resources, and system-wide coordination in real time.',
    points: ['Live incident overview', 'Priority management', 'Audit visibility'],
    actions: [
      { title: 'Verify request', detail: 'Inspect incoming incidents and confirm priority routing.' },
      { title: 'Coordinate teams', detail: 'Assign rescue resources and mobilize local units.' },
      { title: 'Observe analytics', detail: 'Review current readiness and operational bottlenecks.' },
    ],
  },
}

function App() {
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
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeModal, setActiveModal] = useState<'report' | 'help' | 'location' | 'map' | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultMapCenter)
  const [tracking, setTracking] = useState(false)
  const [responderPosition, setResponderPosition] = useState<[number, number]>(defaultMapCenter)
  const [plannerDestination, setPlannerDestination] = useState('Nearest safe place')
  const [plannerMode, setPlannerMode] = useState('Fastest safe route')
  const [plannerStarted, setPlannerStarted] = useState(false)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [areaName, setAreaName] = useState('your current area')

  const recommendedPlaces = nearbyPlaces
    .filter((place) => (recommendedCategories[form.type] || []).includes(place.category))
    .sort((first, second) => (recommendedCategories[form.type].indexOf(first.category) - recommendedCategories[form.type].indexOf(second.category)) || first.distance - second.distance)

  const apiFetch = async (path: string) => {
    const response = await fetch(`http://localhost:5000/api/v1${path}`)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    return response.json()
  }

  const loadData = async (role: RoleKey) => {
    try {
      const endpoints = await Promise.allSettled([
        apiFetch(`/dashboard/summary?role=${role}`), apiFetch('/emergencies'), apiFetch('/volunteers'), apiFetch('/tasks'),
        apiFetch('/resources'), apiFetch('/allocations'), apiFetch('/hospital/capacity'), apiFetch('/hospital/critical-cases'),
        apiFetch('/shelters'), apiFetch('/disasters'), apiFetch('/notifications'),
      ])
      const data = endpoints.map((result) => result.status === 'fulfilled' ? result.value.data : [])
      setSummary(data[0] as Summary)
      setEmergencies(data[1] as Emergency[])
      setVolunteers(data[2] as Volunteer[])
      setTasks(data[3] as Task[])
      setResources(data[4] as Resource[])
      setAllocations(data[5] as Allocation[])
      setHospitalCapacity(data[6] as HospitalCapacity[])
      setCriticalCases(data[7] as CriticalCase[])
      setShelters(data[8] as Shelter[])
      setDisasters(data[9] as Disaster[])
      setNotifications(data[10] as NotificationItem[])
    } catch (error) {
      console.error('Failed to load data', error)
      setMessage('Live data is unavailable. You can still report an emergency and use location tools.')
    }
  }

  useEffect(() => {
    void loadData(activeRole)
  }, [activeRole])

  useEffect(() => {
    if (!tracking || !navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextPosition: [number, number] = [coords.latitude, coords.longitude]
        setMapCenter(nextPosition)
        setGeoStatus((current) => ({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, risk: current?.risk ?? 'Moderate', advisory: current?.advisory ?? 'Stay alert for local advisories.' }))
      },
      () => setMessage('Live tracking needs location permission in your browser.'),
      { enableHighAccuracy: true, maximumAge: 10000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [tracking])

  const findNearbyPlaces = async (latitude: number, longitude: number) => {
    setPlaceLoading(true)
    const query = `[out:json][timeout:12];(nwr(around:6000,${latitude},${longitude})[amenity~"shelter|hospital|fire_station|police|school"];nwr(around:6000,${latitude},${longitude})[leisure~"park|pitch|sports_centre"];);out center tags;`
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
      if (!response.ok) throw new Error('Nearby places unavailable')
      const result = await response.json() as { elements: Array<{ id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> }
      const places = result.elements.map((element) => {
        const placeLatitude = element.lat ?? element.center?.lat
        const placeLongitude = element.lon ?? element.center?.lon
        if (placeLatitude === undefined || placeLongitude === undefined) return null
        const amenity = element.tags?.amenity
        const leisure = element.tags?.leisure
        const category = amenity === 'hospital' ? 'Hospital' : amenity === 'shelter' ? 'Emergency shelter' : amenity === 'fire_station' ? 'Fire station' : amenity === 'police' ? 'Police station' : leisure === 'park' || leisure === 'pitch' || leisure === 'sports_centre' ? 'Open ground / high-ground candidate' : element.tags?.amenity === 'school' ? 'School' : 'Public support'
        const phone = element.tags?.phone || element.tags?.['contact:phone']
        return { id: String(element.id), name: element.tags?.name || category, category, latitude: placeLatitude, longitude: placeLongitude, distance: distanceBetween(latitude, longitude, placeLatitude, placeLongitude), highGroundCandidate: Boolean(leisure), ...(phone ? { phone } : {}) }
      }).filter((place): place is NearbyPlace => place !== null).sort((first, second) => first.distance - second.distance).slice(0, 12)
      setNearbyPlaces(places)
      const firstSafePlace = places.filter((place) => (recommendedCategories[form.type] || []).includes(place.category)).sort((first, second) => (recommendedCategories[form.type].indexOf(first.category) - recommendedCategories[form.type].indexOf(second.category)) || first.distance - second.distance)[0] || places[0]
      if (firstSafePlace) {
        setPlannerDestination(firstSafePlace.name)
        setResponderPosition([firstSafePlace.latitude, firstSafePlace.longitude])
      }
    } catch {
      setMessage('Nearby places could not be loaded. Check your connection or use a local landmark.')
    } finally {
      setPlaceLoading(false)
    }
  }

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
      if (response.ok) {
        const result = await response.json() as { address?: { city?: string; town?: string; county?: string } }
        setAreaName(result.address?.city || result.address?.town || result.address?.county || 'your current area')
      }
    } catch { setAreaName('your current area') }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by this browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const risk: GeoStatus['risk'] = coords.latitude > 12.9 && coords.latitude < 13.1 ? 'Moderate' : 'Low'
        const advisory = risk === 'Moderate' ? 'Moderate flood watch. Avoid underpasses and keep an evacuation route ready.' : 'No active flood signal in the local demo feed. Continue monitoring official alerts.'
        setMapCenter([coords.latitude, coords.longitude])
        setGeoStatus({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, risk, advisory })
        setForm((current) => ({ ...current, location: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` }))
        void findNearbyPlaces(coords.latitude, coords.longitude)
        void reverseGeocode(coords.latitude, coords.longitude)
        setActiveModal('location')
        setLoading(false)
      },
      () => { setMessage('Location permission was not granted. Enter a landmark manually instead.'); setLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const openReport = () => setActiveModal('report')
  const openHelp = () => { setActiveModal('help'); setMessage('') }
  const startTracking = () => { setTracking(true); setActiveModal('map') }

  const handleEmergencySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

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
      setMessage(`Emergency ${result.data.id} created successfully`)
      void loadData(activeRole)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Emergency submission failed')
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

      if (!response.ok) {
        throw new Error(result.message || 'Status update failed')
      }

      setEmergencies((current) =>
        current.map((item) => (item.id === id ? { ...item, status: result.data.status } : item)),
      )
      setMessage(`Emergency marked as ${nextStatus}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Status update failed')
    }
  }

  const handleTaskAssignment = async (emergencyId: string) => {
    const selectedVolunteer = volunteers[0]

    if (!selectedVolunteer) {
      setMessage('No volunteers available for dispatch')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify({
          emergencyId,
          volunteerId: selectedVolunteer.id,
          volunteerName: selectedVolunteer.name,
          notes: 'Assigned by command center',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Assignment failed')
      }

      setTasks((current) => [result.data, ...current])
      setMessage(`Task assigned to ${selectedVolunteer.name}`)
      void loadData(activeRole)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Assignment failed')
    }
  }

  const handleTaskStatusUpdate = async (taskId: string, nextStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Task update failed')

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, status: result.data.status } : task)),
      )
      setMessage(`Task updated to ${nextStatus}`)
      void loadData(activeRole)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Task update failed')
    }
  }

  const handleResourceAllocation = async (resourceId: string) => {
    const resource = resources.find((item) => item.id === resourceId)
    if (!resource) {
      setMessage('Resource not available for allocation')
      return
    }

    const allocationQuantity = Math.min(5, resource.quantity)

    try {
      const response = await fetch('http://localhost:5000/api/v1/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify({
          resourceId,
          emergencyId: emergencies[0]?.id ?? 'RESQ-2026-0001',
          quantity: allocationQuantity,
          recipient: 'Emergency relief zone',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Allocation failed')
      }

      setAllocations((current) => [result.data, ...current])
      setMessage(`Allocated ${allocationQuantity} ${resource.unit} of ${resource.name}`)
      void loadData(activeRole)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Allocation failed')
    }
  }

  const handleBedUpdate = async (ward: string, nextAvailable: number) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/hospital/capacity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify({
          ward,
          available: nextAvailable,
          occupied: Math.max(0, 20 - nextAvailable),
          icu: Math.max(0, Math.ceil(nextAvailable / 4)),
          status: nextAvailable < 5 ? 'Critical' : nextAvailable < 10 ? 'High load' : 'Stable',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Bed update failed')
      }

      setHospitalCapacity((current) => [result.data, ...current])
      setMessage(`Capacity updated for ${ward}`)
      void loadData(activeRole)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bed update failed')
    }
  }

  const handleNotificationCreate = async () => {
    const notificationBody = {
      title: 'Admin alert issued',
      message: 'Priority response team mobilized for active flood zones.',
      type: 'warning',
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('resqnet-token') || ''}`,
        },
        body: JSON.stringify(notificationBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Notification failed')
      }

      setNotifications((current) => [result.data, ...current])
      setMessage('New alert sent to response channels')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Notification failed')
    }
  }

  const roleInfo = dashboardByRole[activeRole]

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ResQNet</p>
          <h1>Emergency Response &amp; Resource Management</h1>
        </div>
        <button type="button" className="primary-btn" onClick={openHelp}>Request Help</button>
      </header>

      <nav className="role-bar" aria-label="Role switcher">
        {(Object.keys(roleLabels) as RoleKey[]).map((role) => (
          <button
            key={role}
            type="button"
            className={role === activeRole ? 'role-btn active' : 'role-btn'}
            onClick={() => setActiveRole(role)}
          >
            {roleLabels[role]}
          </button>
        ))}
      </nav>

      <section className="hero-grid">
        <div className="panel hero-panel">
          <span className="status-pill">Live Disaster Coordination</span>
          <h2>{roleInfo.heading}</h2>
          <p>{roleInfo.subtitle}</p>
          <ul className="feature-list">
            {roleInfo.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="cta-row">
            <button type="button" className="primary-btn" onClick={openReport}>Report Emergency</button>
            <button type="button" className="secondary-btn" onClick={startTracking}>View Map</button>
          </div>
        </div>

        <div className="panel stats-panel">
          <div className="stat-box">
            <strong>{summary?.totalEmergencies ?? 0}</strong>
            <span>Total emergencies</span>
          </div>
          <div className="stat-box">
            <strong>{summary?.criticalEmergencies ?? 0}</strong>
            <span>Critical incidents</span>
          </div>
          <div className="stat-box">
            <strong>{summary?.activeRescues ?? 0}</strong>
            <span>Active rescues</span>
          </div>
          <div className="stat-box">
            <strong>{summary?.availableVolunteers ?? 0}</strong>
            <span>Available volunteers</span>
          </div>
        </div>
      </section>

      <section className="panel dashboard-grid">
        {roleInfo.actions.map((action) => (
          <div className="card" key={action.title}>
            <h3>{action.title}</h3>
            <ul>
              <li>{action.detail}</li>
            </ul>
          </div>
        ))}
      </section>

      <section className="two-column">
        <div className="panel form-panel">
          <h3>Open citizen access</h3>
          <p className="form-intro">No account is needed to report an emergency or find safety support. Staff can still sign in for role-specific operations.</p>
          <div className="access-state"><span className="live-dot" /> Citizen reporting is available</div>
          <p className="form-intro">Response teams can switch roles above to monitor dispatch, hospitals, resources, and alerts.</p>
        </div>

        <div className="panel form-panel">
          <h3>Create Emergency</h3>
          <form onSubmit={handleEmergencySubmit} className="stack-form">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Flood</option>
              <option>Medical</option>
              <option>Fire</option>
              <option>Evacuation</option>
            </select>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
            />
            <button type="button" className="location-btn" onClick={detectLocation} disabled={loading}>
              {loading ? 'Locating...' : 'Detect my location'}
            </button>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the emergency"
              required
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Emergency'}
            </button>
          </form>
        </div>
      </section>

      {message && <p className="system-message">{message}</p>}

      {activeModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setActiveModal(null)}>
          <section className="modal panel" role="dialog" aria-modal="true" aria-label={activeModal === 'map' ? 'Rescue planner' : 'ResQNet action'} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">ResQNet field tools</span>
                <h3>{activeModal === 'map' ? 'Rescue planner' : activeModal === 'location' ? 'Location intelligence' : activeModal === 'help' ? 'Request help' : 'Report emergency'}</h3>
              </div>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setActiveModal(null)}>×</button>
            </div>

            {activeModal === 'report' && (
              <form onSubmit={(event) => { void handleEmergencySubmit(event); setActiveModal(null) }} className="stack-form">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Flood</option><option>Medical</option><option>Fire</option><option>Evacuation</option></select>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location or landmark" required />
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is happening? Include people affected and access conditions." required />
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
                <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Sending...' : 'Send emergency request'}</button>
                <button type="button" className="location-btn" onClick={detectLocation}>Use my live location</button>
              </form>
            )}

            {activeModal === 'help' && (
              <div className="help-options">
                <p>Choose the fastest response channel for your situation.</p>
                <button type="button" className="primary-btn" onClick={openReport}>Report an emergency</button>
                <a className="help-link" href="tel:112">Call emergency services · 112</a>
                <button type="button" className="secondary-btn" onClick={detectLocation}>Check my area first</button>
              </div>
            )}

            {activeModal === 'location' && geoStatus && (
              <div className="location-report">
                <div className="risk-header"><span className={`risk-badge ${geoStatus.risk.toLowerCase()}`}>{geoStatus.risk} risk</span><strong>Location signal received near {areaName}</strong></div>
                <p>{geoStatus.advisory}</p>
                <div className="detail-grid"><span>Latitude<strong>{geoStatus.latitude.toFixed(5)}</strong></span><span>Longitude<strong>{geoStatus.longitude.toFixed(5)}</strong></span><span>Accuracy<strong>Within {Math.round(geoStatus.accuracy)}m</strong></span><span>Nearby support<strong>{nearbyPlaces.length} places found</strong></span></div>
                <div className="nearby-list">
                  <div className="nearby-heading"><strong>{form.type} response destinations near you</strong><span>{placeLoading ? 'Searching map data...' : 'OpenStreetMap live data'}</span></div>
                  <p className="planner-context">{emergencyGuidance[form.type]}</p>
                  {recommendedPlaces.slice(0, 5).map((place) => <div className="nearby-place-row" key={place.id}><button type="button" className="nearby-place" onClick={() => { setPlannerDestination(place.name); setResponderPosition([place.latitude, place.longitude]); setActiveModal('map') }}><span><strong>{place.name}</strong><small>{place.category}{place.highGroundCandidate ? ' · open/high-ground candidate' : ''}</small>{form.type === 'Fire' && place.category === 'Fire station' && <small className="station-phone">{place.phone ? `Phone: ${place.phone}` : 'Phone number not listed'}</small>}</span><b>{place.distance.toFixed(1)} km</b></button>{form.type === 'Fire' && place.category === 'Fire station' && place.phone && <a className="call-station" href={`tel:${place.phone.replace(/[^\d+]/g, '')}`}>Call station</a>}</div>)}
                  {!placeLoading && recommendedPlaces.length === 0 && <p className="empty-state">No {form.type.toLowerCase()}-specific places were found within 6 km. Follow local emergency instructions and choose the safest visible public area.</p>}
                </div>
                <button type="button" className="primary-btn" onClick={() => setActiveModal('map')}>Plan a safe route</button>
              </div>
            )}

            {activeModal === 'map' && (
              <div className="planner-layout">
                <div className="planner-controls">
                  <label>Destination<select value={plannerDestination} onChange={(e) => { setPlannerDestination(e.target.value); const place = recommendedPlaces.find((item) => item.name === e.target.value); if (place) setResponderPosition([place.latitude, place.longitude]) }}><option>Nearest safe place</option>{recommendedPlaces.map((place) => <option key={place.id}>{place.name}</option>)}</select></label>
                  <label>Route priority<select value={plannerMode} onChange={(e) => setPlannerMode(e.target.value)}><option>Fastest safe route</option><option>Avoid flood zones</option><option>Nearest medical support</option></select></label>
                  <p className="planner-context">Planning a <strong>{form.type.toLowerCase()}</strong> response from <strong>{areaName}</strong>. Destinations are filtered for this emergency.</p>
                  <button type="button" className="primary-btn" onClick={() => setPlannerStarted(true)}>{plannerStarted ? 'Route recalculated' : 'Build rescue plan'}</button>
                  <button type="button" className={tracking ? 'tracking-btn active' : 'tracking-btn'} onClick={() => setTracking((current) => !current)}>{tracking ? 'Live tracking on' : 'Start live tracking'}</button>
                  <div className="route-summary"><strong>{plannerStarted ? 'Recommended route ready' : 'Planner ready'}</strong><span>{plannerStarted ? `18 min · ${plannerMode}` : 'Set a destination to coordinate a response'}</span></div>
                </div>
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="map-view">
                  <MapRecenter center={mapCenter} />
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapCenter} icon={locationIcon}><Popup>Your location</Popup></Marker>
                  {recommendedPlaces.map((place) => <Marker key={place.id} position={[place.latitude, place.longitude]} icon={responderIcon}><Popup>{place.name}<br />{place.category} · {place.distance.toFixed(1)} km away</Popup></Marker>)}
                  <Circle center={mapCenter} radius={650} pathOptions={{ color: '#fb7185', fillColor: '#fb7185', fillOpacity: 0.12 }} />
                  {plannerStarted && <Polyline positions={[mapCenter, responderPosition]} pathOptions={{ color: '#38bdf8', weight: 5, dashArray: '10 8' }} />}
                </MapContainer>
              </div>
            )}
          </section>
        </div>
      )}

      {activeRole === 'ngo' && (
        <section className="panel list-panel">
          <h3>NGO Resource Inventory</h3>
          <div className="resource-list">
            {resources.map((resource) => (
              <div key={resource.id} className="resource-item">
                <div>
                  <strong>{resource.name}</strong>
                  <small>{resource.category}</small>
                </div>
                <div>
                  <small>{resource.quantity} {resource.unit}</small>
                  <small>{resource.status}</small>
                </div>
                <div>
                  <small>{resource.location}</small>
                  <button type="button" className="primary-btn" onClick={() => handleResourceAllocation(resource.id)}>
                    Allocate
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="allocation-list">
            <h4>Allocation History</h4>
            {allocations.map((allocation) => (
              <div key={allocation.id} className="allocation-item">
                <span>{allocation.resourceName}</span>
                <span>{allocation.quantity}</span>
                <span>{allocation.recipient}</span>
                <span>{allocation.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeRole === 'hospital' && (
        <section className="panel list-panel">
          <h3>Hospital Capacity Management</h3>
          <div className="capacity-list">
            {hospitalCapacity.map((ward) => (
              <div key={ward.id} className="capacity-item">
                <div>
                  <strong>{ward.ward}</strong>
                  <small>{ward.status}</small>
                </div>
                <div>
                  <small>Available: {ward.available}</small>
                  <small>Occupied: {ward.occupied}</small>
                </div>
                <div>
                  <small>ICU: {ward.icu}</small>
                  <button type="button" className="secondary-btn" onClick={() => handleBedUpdate(ward.ward, Math.max(0, ward.available - 2))}>
                    Update capacity
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="case-list">
            <h4>Critical Patient Queue</h4>
            {criticalCases.map((caseItem) => (
              <div key={caseItem.id} className="case-item">
                <span>{caseItem.patient}</span>
                <span>{caseItem.severity}</span>
                <span>{caseItem.eta}</span>
                <span>{caseItem.action}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeRole === 'admin' && (
        <section className="panel list-panel">
          <h3>Shelter & Disaster Overview</h3>
          <div className="shelter-grid">
            <div className="sub-panel">
              <h4>Active Shelters</h4>
              <div className="shelter-list">
                {shelters.map((shelter) => (
                  <div key={shelter.id} className="shelter-item">
                    <strong>{shelter.name}</strong>
                    <small>{shelter.occupants}/{shelter.capacity} occupants</small>
                    <small>{shelter.status}</small>
                    <small>{shelter.facilities.join(', ')}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="sub-panel">
              <h4>Disaster Events</h4>
              <div className="disaster-list">
                {disasters.map((disaster) => (
                  <div key={disaster.id} className="disaster-item">
                    <strong>{disaster.name}</strong>
                    <small>{disaster.region}</small>
                    <small>{disaster.severity} · {disaster.status}</small>
                    <small>{disaster.affectedAreas} affected areas</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="notification-panel">
            <div className="notification-header">
              <h4>Alert Center</h4>
              <button type="button" className="primary-btn" onClick={handleNotificationCreate}>Send alert</button>
            </div>
            <div className="notification-list">
              {notifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.type}`}>
                  <strong>{notification.title}</strong>
                  <small>{notification.message}</small>
                  <span>{notification.type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="panel list-panel">
        <h3>Volunteer Dispatch Board</h3>
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div>
                <strong>{task.id}</strong>
                <span>{task.emergencyId}</span>
              </div>
              <div>
                <small>{task.volunteerName}</small>
                <small>{task.status}</small>
              </div>
              <div>
                <small>{task.notes}</small>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    handleTaskStatusUpdate(
                      task.id,
                      task.status === 'Assigned' ? 'Accepted' : task.status === 'Accepted' ? 'In Progress' : 'Completed',
                    )
                  }
                >
                  {task.status === 'Assigned'
                    ? 'Accept'
                    : task.status === 'Accepted'
                      ? 'Start'
                      : 'Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel list-panel">
        <h3>Recent Emergencies</h3>
        <div className="emergency-list">
          {emergencies.map((item) => (
            <div key={item.id} className="emergency-item">
              <div>
                <strong>{item.id}</strong>
                <span>{item.type}</span>
              </div>
              <div>
                <span className="priority-tag">{item.priority}</span>
              </div>
              <div>
                <small>{item.status}</small>
                <small>{item.location}</small>
                {item.description && <small>{item.description}</small>}
                <div className="inline-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      handleStatusUpdate(
                        item.id,
                        activeRole === 'admin'
                          ? 'Verified'
                          : activeRole === 'volunteer'
                            ? 'In Progress'
                            : 'Assigned',
                      )
                    }
                  >
                    {activeRole === 'admin'
                      ? 'Verify'
                      : activeRole === 'volunteer'
                        ? 'Start response'
                        : 'Review'}
                  </button>
                  {activeRole === 'admin' && (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleTaskAssignment(item.id)}
                    >
                      Assign volunteer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
