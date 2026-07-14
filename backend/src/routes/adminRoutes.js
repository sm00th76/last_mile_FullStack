import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import {
  getZones, createZone, updateZone, deleteZone,
  getAreas, createArea, updateArea, deleteArea,
  getRateCards, createRateCard, updateRateCard, deleteRateCard,
  getAgents, createAgent, updateAgent, updateAgentStatus, deleteAgent,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

// ─── Zones ─────────────────────────────────────────────────────────────

router.get('/zones', getZones);

router.post(
  '/zones',
  [
    body('name').trim().notEmpty().withMessage('Zone name is required'),
    body('code').trim().notEmpty().withMessage('Zone code is required'),
  ],
  validate,
  createZone
);

router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);

// ─── Areas ─────────────────────────────────────────────────────────────

router.get('/areas', getAreas);

router.post(
  '/areas',
  [
    body('pincode').trim().notEmpty().withMessage('Pincode is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('zoneId').notEmpty().withMessage('Zone ID is required'),
  ],
  validate,
  createArea
);

router.put('/areas/:id', updateArea);
router.delete('/areas/:id', deleteArea);

// ─── Rate Cards ────────────────────────────────────────────────────────

router.get('/rate-cards', getRateCards);

router.post(
  '/rate-cards',
  [
    body('orderType').isIn(['B2B', 'B2C']).withMessage('Order type must be B2B or B2C'),
    body('rateType').isIn(['intra-zone', 'inter-zone']).withMessage('Rate type must be intra-zone or inter-zone'),
    body('baseRate').isFloat({ gt: 0 }).withMessage('Base rate must be positive'),
    body('perKgRate').isFloat({ gt: 0 }).withMessage('Per kg rate must be positive'),
    body('minCharge').isFloat({ gt: 0 }).withMessage('Min charge must be positive'),
  ],
  validate,
  createRateCard
);

router.put('/rate-cards/:id', updateRateCard);
router.delete('/rate-cards/:id', deleteRateCard);

// ─── Agents ────────────────────────────────────────────────────────────

router.get('/agents', getAgents);

router.post(
  '/agents',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('currentZoneId').notEmpty().withMessage('Zone ID is required'),
  ],
  validate,
  createAgent
);

router.put('/agents/:id', updateAgent);

router.patch(
  '/agents/:id/status',
  [
    body('status')
      .isIn(['available', 'busy', 'offline'])
      .withMessage('Status must be available, busy, or offline'),
  ],
  validate,
  updateAgentStatus
);

router.delete('/agents/:id', deleteAgent);

export default router;
