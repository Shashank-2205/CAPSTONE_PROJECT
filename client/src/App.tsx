import { useEffect, useState } from 'react'
import './App.css'

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

type User = {
  id: string
  email: string
  name: string
  role: string
}

type RoleKey = 'citizen' | 'volunteer' | 'ngo' | 'hospital' | 'admin'

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
  const [user, setUser] = useState<User | null>(null)
  const [activeRole, setActiveRole] = useState<RoleKey>('citizen')
  const [loginForm, setLoginForm] = useState({ email: 'citizen@resqnet.com', password: 'Citizen@123' })
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async (role: RoleKey) => {
    try {
      const [summaryRes, emergencyRes, volunteerRes, taskRes, resourceRes, allocationRes, hospitalRes, caseRes, shelterRes, disasterRes, notificationRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/dashboard/summary?role=${role}`),
        fetch(`http://localhost:5000/api/v1/emergencies?role=${role}`),
        fetch('http://localhost:5000/api/v1/volunteers'),
        fetch('http://localhost:5000/api/v1/tasks'),
        fetch('http://localhost:5000/api/v1/resources'),
        fetch('http://localhost:5000/api/v1/allocations'),
        fetch('http://localhost:5000/api/v1/hospital/capacity'),
        fetch('http://localhost:5000/api/v1/hospital/critical-cases'),
        fetch('http://localhost:5000/api/v1/shelters'),
        fetch('http://localhost:5000/api/v1/disasters'),
        fetch('http://localhost:5000/api/v1/notifications'),
      ])

      const summaryData = await summaryRes.json()
      const emergencyData = await emergencyRes.json()
      const volunteerData = await volunteerRes.json()
      const taskData = await taskRes.json()
      const resourceData = await resourceRes.json()
      const allocationData = await allocationRes.json()
      const hospitalData = await hospitalRes.json()
      const caseData = await caseRes.json()
      const shelterData = await shelterRes.json()
      const disasterData = await disasterRes.json()
      const notificationData = await notificationRes.json()

      setSummary(summaryData.data)
      setEmergencies(emergencyData.data)
      setVolunteers(volunteerData.data)
      setTasks(taskData.data)
      setResources(resourceData.data)
      setAllocations(allocationData.data)
      setHospitalCapacity(hospitalData.data)
      setCriticalCases(caseData.data)
      setShelters(shelterData.data)
      setDisasters(disasterData.data)
      setNotifications(notificationData.data)
    } catch (error) {
      console.error('Failed to load data', error)
    }
  }

  useEffect(() => {
    void loadData(activeRole)
  }, [activeRole])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Login failed')
      }

      setUser(result.data.user)
      setActiveRole(result.data.user.role)
      setMessage(`Welcome, ${result.data.user.name}`)
      localStorage.setItem('resqnet-token', result.data.token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

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
        <button type="button" className="primary-btn">Request Help</button>
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
            <button type="button" className="primary-btn">Report Emergency</button>
            <button type="button" className="secondary-btn">View Map</button>
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
          <h3>Login</h3>
          <form onSubmit={handleLogin} className="stack-form">
            <input
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              placeholder="Email"
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="Password"
            />
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {user && <p className="user-badge">Logged in as {user.role}</p>}
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
              <option>Missing Person</option>
            </select>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the emergency"
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
