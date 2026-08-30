import { Router } from 'express';
import { Emergency, Task, Resource, Allocation, Notification, Disaster, Shelter, Hospital, User, Volunteer, NGO } from '../models/index.js';
import authRoutes from './auth.js';
const router = Router();
router.use('/auth', authRoutes);
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API health check passed',
        data: { status: 'ok' },
    });
});
// Dashboard Summary
router.get('/dashboard/summary', async (req, res) => {
    try {
        const role = String(req.query.role ?? 'admin').toLowerCase();
        const totalEmergencies = await Emergency.countDocuments();
        const criticalEmergencies = await Emergency.countDocuments({ priority: 'Critical' });
        const activeRescues = await Emergency.countDocuments({
            status: { $in: ['Assigned', 'In Progress', 'Verified'] },
        });
        const resourceShortages = await Resource.countDocuments({
            quantity: { $lt: 20 },
        });
        const roleDefaults = {
            citizen: { availableVolunteers: 42, resourceShortages },
            volunteer: { availableVolunteers: 18, resourceShortages },
            ngo: { availableVolunteers: 12, resourceShortages },
            hospital: { availableVolunteers: 16, resourceShortages },
            admin: { availableVolunteers: 28, resourceShortages },
        };
        const fallback = roleDefaults[role] ?? roleDefaults.admin;
        res.json({
            success: true,
            message: 'Dashboard summary loaded',
            data: {
                totalEmergencies,
                criticalEmergencies,
                activeRescues,
                availableVolunteers: fallback.availableVolunteers,
                resourceShortages: fallback.resourceShortages,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard summary',
            code: 'SUMMARY_ERROR',
        });
    }
});
// Emergencies
router.get('/emergencies', async (_req, res) => {
    try {
        const emergencies = await Emergency.find().sort({ createdAt: -1 }).limit(50);
        const mapped = emergencies.map((e) => ({
            id: e.emergencyId,
            type: e.type,
            priority: e.priority,
            status: e.status,
            location: e.location,
            description: e.description,
            createdAt: e.createdAt.toISOString(),
        }));
        res.json({
            success: true,
            message: 'Emergencies loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load emergencies',
            code: 'EMERGENCIES_ERROR',
        });
    }
});
router.post('/emergencies', async (req, res) => {
    try {
        const { type, description, priority, location } = req.body ?? {};
        if (!type || !description || !priority || !location) {
            return res.status(400).json({
                success: false,
                message: 'Missing required emergency fields',
                code: 'VALIDATION_ERROR',
            });
        }
        const emergencyId = `RESQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const emergency = new Emergency({
            emergencyId,
            type,
            description,
            priority,
            status: 'Pending',
            location,
            createdBy: new User()._id,
        });
        await emergency.save();
        res.status(201).json({
            success: true,
            message: 'Emergency created',
            data: {
                id: emergency.emergencyId,
                type: emergency.type,
                priority: emergency.priority,
                status: emergency.status,
                location: emergency.location,
                description: emergency.description,
                createdAt: emergency.createdAt.toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create emergency',
            code: 'CREATE_ERROR',
        });
    }
});
router.patch('/emergencies/:id/status', async (req, res) => {
    try {
        const { status } = req.body ?? {};
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
                code: 'VALIDATION_ERROR',
            });
        }
        const emergency = await Emergency.findOneAndUpdate({ emergencyId: req.params.id }, { status }, { new: true });
        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found',
                code: 'NOT_FOUND',
            });
        }
        res.json({
            success: true,
            message: 'Emergency status updated',
            data: { status: emergency.status },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update emergency',
            code: 'UPDATE_ERROR',
        });
    }
});
// Volunteers
router.get('/volunteers', async (_req, res) => {
    try {
        const volunteers = await Volunteer.find().limit(50);
        const mapped = volunteers.map((v) => ({
            id: v._id.toString(),
            name: 'Volunteer',
            availability: v.availabilityStatus,
            area: v.location,
        }));
        res.json({
            success: true,
            message: 'Volunteer list loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load volunteers',
            code: 'VOLUNTEERS_ERROR',
        });
    }
});
// Tasks
router.get('/tasks', async (_req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 }).limit(50);
        const mapped = tasks.map((t) => ({
            id: t.taskId,
            emergencyId: t.emergency?.toString(),
            volunteerId: t.volunteer?.toString(),
            volunteerName: 'Volunteer',
            status: t.status,
            notes: t.notes || '',
        }));
        res.json({
            success: true,
            message: 'Rescue tasks loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load tasks',
            code: 'TASKS_ERROR',
        });
    }
});
router.post('/tasks', async (req, res) => {
    try {
        const { emergencyId, volunteerId, volunteerName, notes } = req.body ?? {};
        if (!emergencyId || !volunteerId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required task fields',
                code: 'VALIDATION_ERROR',
            });
        }
        const taskId = `TASK-${String(Date.now()).slice(-6)}`;
        const task = new Task({
            taskId,
            emergency: emergencyId,
            volunteer: volunteerId,
            status: 'Assigned',
            notes,
        });
        await task.save();
        res.status(201).json({
            success: true,
            message: 'Task created',
            data: {
                id: task.taskId,
                emergencyId,
                volunteerId,
                volunteerName,
                status: task.status,
                notes: task.notes,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create task',
            code: 'CREATE_ERROR',
        });
    }
});
router.patch('/tasks/:id/status', async (req, res) => {
    try {
        const { status } = req.body ?? {};
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
                code: 'VALIDATION_ERROR',
            });
        }
        const task = await Task.findOneAndUpdate({ taskId: req.params.id }, { status }, { new: true });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
                code: 'NOT_FOUND',
            });
        }
        res.json({
            success: true,
            message: 'Task status updated',
            data: { status: task.status },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update task',
            code: 'UPDATE_ERROR',
        });
    }
});
// Resources
router.get('/resources', async (_req, res) => {
    try {
        const resources = await Resource.find().limit(50);
        const mapped = resources.map((r) => ({
            id: r.resourceId,
            name: r.name,
            category: r.category,
            quantity: r.quantity,
            unit: r.unit,
            location: r.location,
            status: r.status,
        }));
        res.json({
            success: true,
            message: 'Resource inventory loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load resources',
            code: 'RESOURCES_ERROR',
        });
    }
});
router.post('/resources', async (req, res) => {
    try {
        const { name, category, quantity, unit, location } = req.body ?? {};
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: 'Resource name and category are required',
                code: 'VALIDATION_ERROR',
            });
        }
        const resourceId = `res_${String(Date.now()).slice(-6)}`;
        const resource = new Resource({
            resourceId,
            name,
            category,
            quantity: Number(quantity) || 0,
            unit: unit || 'units',
            location: location || 'Warehouse',
            status: 'Healthy',
            ngo: new NGO()._id,
        });
        await resource.save();
        res.status(201).json({
            success: true,
            message: 'Resource created',
            data: {
                id: resource.resourceId,
                name: resource.name,
                category: resource.category,
                quantity: resource.quantity,
                unit: resource.unit,
                location: resource.location,
                status: resource.status,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create resource',
            code: 'CREATE_ERROR',
        });
    }
});
// Allocations
router.get('/allocations', async (_req, res) => {
    try {
        const allocations = await Allocation.find().sort({ createdAt: -1 }).limit(50);
        const mapped = allocations.map((a) => ({
            id: a.allocationId,
            resourceId: a.resource?.toString(),
            resourceName: 'Resource',
            emergencyId: a.emergency?.toString(),
            quantity: a.quantity,
            recipient: a.recipient,
            status: a.status,
        }));
        res.json({
            success: true,
            message: 'Resource allocations loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load allocations',
            code: 'ALLOCATIONS_ERROR',
        });
    }
});
router.post('/allocations', async (req, res) => {
    try {
        const { resourceId, emergencyId, quantity, recipient } = req.body ?? {};
        if (!resourceId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Resource ID and quantity are required',
                code: 'VALIDATION_ERROR',
            });
        }
        const allocationId = `ALLOC-${String(Date.now()).slice(-6)}`;
        const allocation = new Allocation({
            allocationId,
            resource: resourceId,
            emergency: emergencyId,
            quantity: Number(quantity),
            recipient: recipient || 'Relief Zone',
            status: 'Queued',
        });
        await allocation.save();
        res.status(201).json({
            success: true,
            message: 'Allocation created',
            data: {
                id: allocation.allocationId,
                resourceId,
                quantity: allocation.quantity,
                recipient: allocation.recipient,
                status: allocation.status,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create allocation',
            code: 'CREATE_ERROR',
        });
    }
});
// Hospital Capacity
router.get('/hospital/capacity', async (_req, res) => {
    try {
        const hospitals = await Hospital.find().limit(50);
        const mapped = hospitals.map((h) => ({
            id: h._id.toString(),
            ward: h.name,
            available: h.availableBeds,
            occupied: h.bedCapacity - h.availableBeds,
            icu: h.availableICUBeds,
            status: h.availableBeds < 5 ? 'Critical' : h.availableBeds < 10 ? 'High load' : 'Stable',
        }));
        res.json({
            success: true,
            message: 'Hospital capacity loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load hospital capacity',
            code: 'HOSPITAL_ERROR',
        });
    }
});
// Critical Cases
router.get('/hospital/critical-cases', async (_req, res) => {
    try {
        res.json({
            success: true,
            message: 'Critical patient cases loaded',
            data: [
                { id: 'case_101', patient: 'R. Nair', severity: 'Critical', hospital: 'City General', eta: '05 min', action: 'Priority transfer' },
                { id: 'case_102', patient: 'S. Babu', severity: 'Severe', hospital: 'City General', eta: '12 min', action: 'Observational care' },
            ],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load critical cases',
            code: 'ERROR',
        });
    }
});
// Shelters
router.get('/shelters', async (_req, res) => {
    try {
        const shelters = await Shelter.find().limit(50);
        const mapped = shelters.map((s) => ({
            id: s.shelterId,
            name: s.name,
            capacity: s.capacity,
            occupants: s.occupants,
            facilities: s.facilities,
            status: s.status,
        }));
        res.json({
            success: true,
            message: 'Shelter list loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load shelters',
            code: 'SHELTERS_ERROR',
        });
    }
});
router.post('/shelters', async (req, res) => {
    try {
        const { name, capacity, occupants, facilities, status } = req.body ?? {};
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Shelter name is required',
                code: 'VALIDATION_ERROR',
            });
        }
        const shelterId = `shelter_${String(Date.now()).slice(-6)}`;
        const shelter = new Shelter({
            shelterId,
            name,
            capacity: Number(capacity) || 0,
            occupants: Number(occupants) || 0,
            facilities: facilities || [],
            status: status || 'Open',
            location: 'TBD',
            ngo: new NGO()._id,
        });
        await shelter.save();
        res.status(201).json({
            success: true,
            message: 'Shelter created successfully',
            data: {
                id: shelter.shelterId,
                name: shelter.name,
                capacity: shelter.capacity,
                occupants: shelter.occupants,
                facilities: shelter.facilities,
                status: shelter.status,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create shelter',
            code: 'CREATE_ERROR',
        });
    }
});
// Disasters
router.get('/disasters', async (_req, res) => {
    try {
        const disasters = await Disaster.find().limit(50);
        const mapped = disasters.map((d) => ({
            id: d.disasterId,
            name: d.name,
            region: d.region,
            severity: d.severity,
            status: d.status,
            affectedAreas: d.affectedAreas,
        }));
        res.json({
            success: true,
            message: 'Disaster events loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load disasters',
            code: 'DISASTERS_ERROR',
        });
    }
});
router.post('/disasters', async (req, res) => {
    try {
        const { name, region, severity, status, affectedAreas } = req.body ?? {};
        if (!name || !region) {
            return res.status(400).json({
                success: false,
                message: 'Disaster name and region are required',
                code: 'VALIDATION_ERROR',
            });
        }
        const disasterId = `disaster_${String(Date.now()).slice(-6)}`;
        const disaster = new Disaster({
            disasterId,
            name,
            region,
            severity: severity || 'Moderate',
            status: status || 'Active',
            affectedAreas: Number(affectedAreas) || 1,
        });
        await disaster.save();
        res.status(201).json({
            success: true,
            message: 'Disaster event created',
            data: {
                id: disaster.disasterId,
                name: disaster.name,
                region: disaster.region,
                severity: disaster.severity,
                status: disaster.status,
                affectedAreas: disaster.affectedAreas,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create disaster',
            code: 'CREATE_ERROR',
        });
    }
});
// Notifications
router.get('/notifications', async (_req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
        const mapped = notifications.map((n) => ({
            id: n.notificationId,
            title: n.title,
            message: n.message,
            type: n.type,
            createdAt: n.createdAt.toISOString(),
        }));
        res.json({
            success: true,
            message: 'Notifications loaded',
            data: mapped,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load notifications',
            code: 'NOTIFICATIONS_ERROR',
        });
    }
});
router.post('/notifications', async (req, res) => {
    try {
        const { title, message, type } = req.body ?? {};
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required',
                code: 'VALIDATION_ERROR',
            });
        }
        const notificationId = `notif_${String(Date.now()).slice(-6)}`;
        const notification = new Notification({
            notificationId,
            title,
            message,
            type: type || 'info',
        });
        await notification.save();
        res.status(201).json({
            success: true,
            message: 'Notification created',
            data: {
                id: notification.notificationId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                createdAt: notification.createdAt.toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            code: 'CREATE_ERROR',
        });
    }
});
export { router };
