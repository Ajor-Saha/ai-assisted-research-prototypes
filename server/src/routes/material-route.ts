import { Router } from 'express';
import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  getCourseMaterials,
  getTopicMaterials,
  updateMaterial,
  viewMaterial,
} from '../controllers/material-controllers';
import {
  parseMaterialContent,
  getParsingStatus,
} from '../controllers/material-parsing-controller';
import { verifyJWT } from '../middleware/auth-middleware';
import { uploadMaterialMiddleware } from '../middleware/upload-middleware';

const material_router = Router();

// All material routes require authentication
material_router.use(verifyJWT);

// Material CRUD routes - POST uses upload middleware
material_router.route('/').post(uploadMaterialMiddleware, createMaterial);

// Get all materials for a specific course
material_router.route('/course/:courseId').get(getCourseMaterials);

// Get all materials for a specific topic
material_router.route('/topic/:topicId').get(getTopicMaterials);

// Parsing routes - must come before /:materialId to avoid conflicts
material_router.route('/parse/:materialId').post(parseMaterialContent);
material_router.route('/parse/:materialId/status').get(getParsingStatus);

// View/download material file - must come before /:materialId
material_router.route('/:materialId/view').get(viewMaterial);

// Material operations by ID
material_router
  .route('/:materialId')
  .get(getMaterialById)
  .put(updateMaterial)
  .delete(deleteMaterial);

export default material_router;
