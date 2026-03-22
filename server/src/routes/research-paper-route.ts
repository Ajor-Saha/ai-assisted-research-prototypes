import { Router } from 'express';
import { IncomingForm } from 'formidable';
import { Request, Response, NextFunction } from 'express';
import {
  uploadResearchPaper,
  getUserResearchPapers,
  getResearchPaperById,
  deleteResearchPaper,
  getParsingStatus,
} from '../controllers/research-paper-controller';
import { 
  streamResearchChatResponse,
  getResearchChatMessages,
} from '../controllers/research-chat-controller';
import { verifyJWT } from '../middleware/auth-middleware';

const router = Router();

// Upload middleware for research papers using formidable
const uploadResearchPaperMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const form = new IncomingForm({
    maxFileSize: 50 * 1024 * 1024, // 50MB max file size
  });
  
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(400).json({
        success: false,
        message: 'File parsing error',
        error: err.message
      });
    }
    
    // Convert fields to proper format
    const processedFields: Record<string, string> = {};
    Object.keys(fields).forEach(key => {
      const value = fields[key];
      if (Array.isArray(value)) {
        processedFields[key] = value[0] as string;
      } else if (value !== undefined) {
        processedFields[key] = value as string;
      }
    });
    
    // Attach processed fields to req.body
    req.body = { ...req.body, ...processedFields };
    
    // Handle the 'file' field
    const researchFile = files.file;
    if (researchFile) {
      const file = Array.isArray(researchFile) ? researchFile[0] : researchFile;
      (req as any).researchFile = file;
    }
    
    next();
  });
};

// All routes require authentication
router.use(verifyJWT);

/**
 * @route   POST /api/research-papers/upload
 * @desc    Upload a new research paper
 * @access  Private
 */
router.post('/upload', uploadResearchPaperMiddleware, uploadResearchPaper);

/**
 * @route   GET /api/research-papers
 * @desc    Get all research papers for the current user
 * @access  Private
 */
router.get('/', getUserResearchPapers);

/**
 * @route   POST /api/research-papers/chat
 * @desc    Stream AI chat response based on uploaded research papers
 * @access  Private
 */
router.post('/chat', streamResearchChatResponse);

/**
 * @route   GET /api/research-papers/messages
 * @desc    Get all chat messages for the user's research chat
 * @access  Private
 */
router.get('/messages', getResearchChatMessages);

/**
 * @route   GET /api/research-papers/:paperId/status
 * @desc    Get parsing status for a research paper
 * @access  Private
 */
router.get('/:paperId/status', getParsingStatus);

/**
 * @route   GET /api/research-papers/:paperId
 * @desc    Get single research paper by ID
 * @access  Private
 */
router.get('/:paperId', getResearchPaperById);

/**
 * @route   DELETE /api/research-papers/:paperId
 * @desc    Delete a research paper
 * @access  Private
 */
router.delete('/:paperId', deleteResearchPaper);


export default router;
