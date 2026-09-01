import { Router } from 'express';
import authRoutes from './auth.js';
const router = Router();
const emergencyStore = [
    {
        id: 'RESQ-2026-0001',
        type: 'Flood',
        description: 'Floodwater entering lower residential blocks and blocking road access.',
        priority: 'Critical',
        status: 'Verified',
        location: 'Hyderabad West (Gachibowli)',
        createdAt: new Date('2026-01-12T07:20:00.000Z').toISOString(),
        createdBy: 'citizen_1',
    },
    {
        id: 'RESQ-2026-0002',
        type: 'Medical',
        description: 'Critical patient transfer request with oxygen support needed.',
        priority: 'High',
        status: 'Assigned',
        location: 'Banjara Hills',
        createdAt: new Date('2026-01-12T09:30:00.000Z').toISOString(),
        createdBy: 'citizen_1',
    },
    {
        id: 'RESQ-2026-0003',
        type: 'Fire',
        description: 'Warehouse fire reported near bus stand; nearby evacuation advised.',
        priority: 'High',
        status: 'Pending',
        location: 'Hitec City',
        createdAt: new Date('2026-01-13T11:10:00.000Z').toISOString(),
        createdBy: 'citizen_1',
    },
];
const volunteerStore = [
    { id: 'vol_101', name: 'Aisha Kumar', availability: 'Available', area: 'Banjara Hills' },
    { id: 'vol_102', name: 'Rohan Singh', availability: 'On route', area: 'Hitec City' },
    { id: 'vol_103', name: 'Meera Iyer', availability: 'Available', area: 'Gachibowli' },
    { id: 'vol_104', name: 'Arjun Das', availability: 'Available', area: 'Secunderabad' },
];
const rescueTasks = [
    {
        id: 'TASK-001',
        emergencyId: 'RESQ-2026-0002',
        volunteerId: 'vol_101',
        volunteerName: 'Aisha Kumar',
        status: 'Accepted',
        notes: 'Medical transfer support and oxygen delivery',
    },
    {
        id: 'TASK-002',
        emergencyId: 'RESQ-2026-0001',
        volunteerId: 'vol_103',
        volunteerName: 'Meera Iyer',
        status: 'In Progress',
        notes: 'Flood water rescue and safe evacuation support',
    },
];
const resourceStore = [
    { id: 'res_101', name: 'Medical Kits', category: 'Medical', quantity: 42, unit: 'kits', location: 'Hyderabad Central Depot', status: 'Healthy' },
    { id: 'res_102', name: 'Water Packs', category: 'Food & Water', quantity: 18, unit: 'packs', location: 'Hitec City Depot', status: 'Low stock' },
    { id: 'res_103', name: 'Shelter Kits', category: 'Shelter', quantity: 33, unit: 'kits', location: 'Gachibowli Relief Camp', status: 'Healthy' },
    { id: 'res_104', name: 'Blankets', category: 'Relief', quantity: 11, unit: 'packs', location: 'Secunderabad Depot', status: 'Critical' },
];
const allocationStore = [
    {
        id: 'ALLOC-001',
        resourceId: 'res_101',
        resourceName: 'Medical Kits',
        emergencyId: 'RESQ-2026-0002',
        quantity: 8,
        recipient: 'Banjara Hills Health Camp',
        status: 'Dispatched',
    },
    {
        id: 'ALLOC-002',
        resourceId: 'res_103',
        resourceName: 'Shelter Kits',
        emergencyId: 'RESQ-2026-0001',
        quantity: 6,
        recipient: 'Gachibowli Relief Zone',
        status: 'Queued',
    },
];
const hospitalCapacity = [
    { id: 'bed_01', ward: 'Emergency', available: 12, occupied: 18, icu: 4, status: 'Stable' },
    { id: 'bed_02', ward: 'Trauma', available: 8, occupied: 14, icu: 3, status: 'High load' },
    { id: 'bed_03', ward: 'ICU', available: 3, occupied: 11, icu: 11, status: 'Critical' },
];
const criticalCases = [
    { id: 'case_101', patient: 'R. Nair', severity: 'Critical', hospital: 'NIMS Hyderabad', eta: '05 min', action: 'Priority transfer' },
    { id: 'case_102', patient: 'S. Babu', severity: 'Severe', hospital: 'Apollo Jubilee Hills', eta: '12 min', action: 'Observational care' },
];
const shelters = [
    { id: 'shelter_01', name: 'Gachibowli Indoor Stadium Camp', capacity: 1500, occupants: 480, facilities: ['Food', 'Water', 'Medical'], status: 'Open' },
    { id: 'shelter_02', name: 'Kotla Vijaya Bhaskara Reddy Stadium', capacity: 800, occupants: 320, facilities: ['Water', 'Sanitation'], status: 'Open' },
    { id: 'shelter_03', name: 'Secunderabad Railway Hall', capacity: 400, occupants: 310, facilities: ['Food', 'Water', 'Power'], status: 'Near Full' },
];
const disasterEvents = [
    { id: 'disaster_01', name: 'Musi River Flash Flood Surge', region: 'Hyderabad Central & Old City', severity: 'High', status: 'Active', affectedAreas: 5 },
    { id: 'disaster_02', name: 'Substation Electrical Fire', region: 'Hitec City', severity: 'Moderate', status: 'Contained', affectedAreas: 2 },
];
const notifications = [
    { id: 'notif_01', title: 'Flood alert escalation', message: 'Musi River lowlands shelter capacity is above 80%.', type: 'warning', createdAt: new Date().toISOString() },
    { id: 'notif_02', title: 'Volunteer dispatched', message: 'Aisha Kumar accepted the medical transfer task.', type: 'info', createdAt: new Date().toISOString() },
    { id: 'notif_03', title: 'Hospital capacity alert', message: 'ICU occupancy reached critical threshold.', type: 'critical', createdAt: new Date().toISOString() },
];
const buildSummary = (role) => {
    const totalEmergencies = emergencyStore.length;
    const criticalEmergencies = emergencyStore.filter((item) => item.priority === 'Critical').length;
    const activeRescues = emergencyStore.filter((item) => ['Assigned', 'In Progress', 'Verified'].includes(item.status)).length;
    const resourceShortages = resourceStore.filter((item) => item.quantity < 20).length;
    const roleDefaults = {
        citizen: { availableVolunteers: 42, resourceShortages: resourceShortages },
        volunteer: { availableVolunteers: 18, resourceShortages: resourceShortages },
        ngo: { availableVolunteers: 12, resourceShortages: resourceShortages },
        hospital: { availableVolunteers: 16, resourceShortages: resourceShortages },
        admin: { availableVolunteers: 28, resourceShortages: resourceShortages },
    };
    const fallback = roleDefaults[role] ?? roleDefaults.admin;
    return {
        totalEmergencies,
        criticalEmergencies,
        activeRescues,
        availableVolunteers: fallback.availableVolunteers,
        resourceShortages: fallback.resourceShortages,
    };
};
router.use('/auth', authRoutes);
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API health check passed',
        data: { status: 'ok' },
    });
});
router.get('/dashboard/summary', (req, res) => {
    const role = String(req.query.role ?? 'admin').toLowerCase();
    res.json({
        success: true,
        message: 'Dashboard summary loaded',
        data: buildSummary(role),
    });
});
router.get('/volunteers', (_req, res) => {
    res.json({
        success: true,
        message: 'Volunteer list loaded',
        data: volunteerStore,
    });
});
router.get('/tasks', (_req, res) => {
    res.json({
        success: true,
        message: 'Rescue tasks loaded',
        data: rescueTasks,
    });
});
router.get('/resources', (_req, res) => {
    res.json({
        success: true,
        message: 'Resource inventory loaded',
        data: resourceStore,
    });
});
router.get('/allocations', (_req, res) => {
    res.json({
        success: true,
        message: 'Resource allocations loaded',
        data: allocationStore,
    });
});
router.get('/hospital/capacity', (_req, res) => {
    res.json({
        success: true,
        message: 'Hospital capacity loaded',
        data: hospitalCapacity,
    });
});
router.get('/hospital/critical-cases', (_req, res) => {
    res.json({
        success: true,
        message: 'Critical patient cases loaded',
        data: criticalCases,
    });
});
router.get('/shelters', (_req, res) => {
    res.json({
        success: true,
        message: 'Shelter list loaded',
        data: shelters,
    });
});
router.get('/disasters', (_req, res) => {
    res.json({
        success: true,
        message: 'Disaster events loaded',
        data: disasterEvents,
    });
});
router.get('/notifications', (_req, res) => {
    res.json({
        success: true,
        message: 'Notifications loaded',
        data: notifications,
    });
});
router.post('/notifications', (req, res) => {
    const { title, message, type = 'info' } = req.body ?? {};
    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: 'Title and message are required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const nextNotification = {
        id: `notif_${String(notifications.length + 1).padStart(2, '0')}`,
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
    };
    notifications.unshift(nextNotification);
    return res.status(201).json({
        success: true,
        message: 'Notification created',
        data: nextNotification,
    });
});
router.post('/shelters', (req, res) => {
    const { name, capacity = 0, occupants = 0, facilities = [], status = 'Open' } = req.body ?? {};
    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Shelter name is required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const nextShelter = {
        id: `shelter_${String(shelters.length + 1).padStart(2, '0')}`,
        name,
        capacity: Number(capacity),
        occupants: Number(occupants),
        facilities,
        status,
    };
    shelters.unshift(nextShelter);
    return res.status(201).json({
        success: true,
        message: 'Shelter created successfully',
        data: nextShelter,
    });
});
router.post('/disasters', (req, res) => {
    const { name, region, severity = 'Moderate', status = 'Active', affectedAreas = 1 } = req.body ?? {};
    if (!name || !region) {
        return res.status(400).json({
            success: false,
            message: 'Disaster name and region are required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const nextDisaster = {
        id: `disaster_${String(disasterEvents.length + 1).padStart(2, '0')}`,
        name,
        region,
        severity,
        status,
        affectedAreas: Number(affectedAreas),
    };
    disasterEvents.unshift(nextDisaster);
    return res.status(201).json({
        success: true,
        message: 'Disaster event created',
        data: nextDisaster,
    });
});
router.post('/hospital/capacity', (req, res) => {
    const { ward, available, occupied, icu, status } = req.body ?? {};
    if (!ward) {
        return res.status(400).json({
            success: false,
            message: 'Ward name is required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const nextCapacity = {
        id: `bed_${String(hospitalCapacity.length + 1).padStart(2, '0')}`,
        ward,
        available: Number(available) || 0,
        occupied: Number(occupied) || 0,
        icu: Number(icu) || 0,
        status: status || 'Stable',
    };
    hospitalCapacity.unshift(nextCapacity);
    return res.status(201).json({
        success: true,
        message: 'Hospital capacity updated',
        data: nextCapacity,
    });
});
router.post('/resources', (req, res) => {
    const { name, category, quantity = 0, unit = 'units', location = 'Warehouse', status = 'Healthy' } = req.body ?? {};
    if (!name || !category) {
        return res.status(400).json({
            success: false,
            message: 'Resource name and category are required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const nextResource = {
        id: `res_${String(resourceStore.length + 101)}`,
        name,
        category,
        quantity,
        unit,
        location,
        status,
    };
    resourceStore.unshift(nextResource);
    return res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        data: nextResource,
    });
});
router.post('/allocations', (req, res) => {
    const { resourceId, emergencyId, quantity = 0, recipient = 'Relief camp', status = 'Queued' } = req.body ?? {};
    const resource = resourceStore.find((item) => item.id === resourceId);
    if (!resource) {
        return res.status(404).json({
            success: false,
            message: 'Resource not found',
            code: 'NOT_FOUND',
            details: null,
        });
    }
    if (quantity <= 0 || quantity > resource.quantity) {
        return res.status(400).json({
            success: false,
            message: 'Requested quantity exceeds available stock',
            code: 'INSUFFICIENT_STOCK',
            details: null,
        });
    }
    resource.quantity -= quantity;
    resource.status = resource.quantity < 20 ? 'Low stock' : 'Healthy';
    const nextAllocation = {
        id: `ALLOC-${String(allocationStore.length + 1).padStart(3, '0')}`,
        resourceId: resource.id,
        resourceName: resource.name,
        emergencyId,
        quantity,
        recipient,
        status,
    };
    allocationStore.unshift(nextAllocation);
    return res.status(201).json({
        success: true,
        message: 'Resource allocation created',
        data: nextAllocation,
    });
});
router.post('/tasks', (req, res) => {
    const { emergencyId, volunteerId, volunteerName, notes } = req.body ?? {};
    if (!emergencyId || !volunteerId || !volunteerName) {
        return res.status(400).json({
            success: false,
            message: 'Emergency ID, volunteer ID, and volunteer name are required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const nextTask = {
        id: `TASK-${String(rescueTasks.length + 1).padStart(3, '0')}`,
        emergencyId,
        volunteerId,
        volunteerName,
        status: 'Assigned',
        notes: notes ?? 'Dispatch assigned to volunteer team',
    };
    rescueTasks.unshift(nextTask);
    const emergency = emergencyStore.find((item) => item.id === emergencyId);
    if (emergency) {
        emergency.status = 'Assigned';
    }
    return res.status(201).json({
        success: true,
        message: 'Rescue task created',
        data: nextTask,
    });
});
router.patch('/tasks/:id/status', (req, res) => {
    const { status } = req.body ?? {};
    const task = rescueTasks.find((item) => item.id === req.params.id);
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found',
            code: 'NOT_FOUND',
            details: null,
        });
    }
    if (!status || !['Assigned', 'Accepted', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Task status is invalid',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    task.status = status;
    const emergency = emergencyStore.find((item) => item.id === task.emergencyId);
    if (emergency) {
        emergency.status = status === 'Completed' ? 'Resolved' : status;
    }
    return res.json({
        success: true,
        message: 'Task status updated',
        data: task,
    });
});
router.get('/emergencies', (req, res) => {
    const role = String(req.query.role ?? 'citizen').toLowerCase();
    const visibleEmergencies = role === 'admin' || role === 'volunteer' || role === 'ngo' || role === 'hospital'
        ? emergencyStore
        : emergencyStore.filter((item) => item.createdBy === 'citizen_1');
    res.json({
        success: true,
        message: 'Emergency list loaded',
        data: visibleEmergencies,
    });
});
router.post('/emergencies', (req, res) => {
    const { type, description, priority = 'Medium', location = 'Unknown', createdBy = 'citizen_1' } = req.body ?? {};
    if (!type || !description) {
        return res.status(400).json({
            success: false,
            message: 'Type and description are required',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    const newEmergency = {
        id: `RESQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`,
        type,
        description,
        priority,
        status: 'Pending',
        location,
        createdAt: new Date().toISOString(),
        createdBy,
    };
    emergencyStore.unshift(newEmergency);
    return res.status(201).json({
        success: true,
        message: 'Emergency created successfully',
        data: newEmergency,
    });
});
router.patch('/emergencies/:id/status', (req, res) => {
    const { status } = req.body ?? {};
    const emergency = emergencyStore.find((item) => item.id === req.params.id);
    if (!emergency) {
        return res.status(404).json({
            success: false,
            message: 'Emergency not found',
            code: 'NOT_FOUND',
            details: null,
        });
    }
    if (!status || !['Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status update is invalid',
            code: 'VALIDATION_ERROR',
            details: null,
        });
    }
    emergency.status = status;
    return res.json({
        success: true,
        message: 'Emergency status updated',
        data: emergency,
    });
});
export { router };
