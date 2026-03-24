const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const Paper = require('../models/Paper');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { analyzePaper } = require('../services/aiAnalysis');

const router = express.Router();

// Helper to run ATS analysis asynchronously (no API — fully rule-based)
const runAIAnalysis = async (paper, filePath, abstractText = '') => {
  try {
    await Paper.findByIdAndUpdate(paper._id, { aiAnalysisStatus: 'processing' });
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text || '';

    // Pass both full text and the submitted abstract for quality scoring
    const scores = await analyzePaper(text, abstractText);

    await Paper.findByIdAndUpdate(paper._id, {
      extractedText: text.substring(0, 20000),
      aiScore: scores,
      aiAnalysisStatus: 'completed',
    });
    console.log(`✅ ATS analysis completed for paper: ${paper._id}`);
  } catch (err) {
    console.error(`❌ ATS analysis failed for paper ${paper._id}:`, err.message);
    await Paper.findByIdAndUpdate(paper._id, { aiAnalysisStatus: 'failed' });
  }
};

// ----- AUTHOR ROUTES -----

// @POST /api/papers  — Submit paper
router.post(
  '/',
  protect,
  authorize('author'),
  upload.single('pdf'),
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('abstract').trim().isLength({ min: 50 }).withMessage('Abstract must be at least 50 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'PDF file is required' });
      }

      const { title, abstract, keywords, conferenceTrack } = req.body;
      const keywordsArr = keywords
        ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];

      const paper = await Paper.create({
        title,
        abstract,
        keywords: keywordsArr,
        author: req.user._id,
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        conferenceTrack: conferenceTrack || 'General',
        aiAnalysisStatus: 'pending',
      });

      // Run ATS analysis in background — pass abstract for quality scoring
      runAIAnalysis(paper, req.file.path, abstract);

      res.status(201).json({ message: 'Paper submitted successfully', paper });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      next(err);
    }
  }
);

// @GET /api/papers/my  — Author's own papers
router.get('/my', protect, authorize('author'), async (req, res, next) => {
  try {
    const papers = await Paper.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .select('-extractedText');

    const papersWithReviews = await Promise.all(
      papers.map(async (paper) => {
        const reviews = await Review.find({ paper: paper._id })
          .populate('reviewer', 'name email')
          .select('-paper');
        return { ...paper.toObject(), reviews };
      })
    );

    res.json({ papers: papersWithReviews });
  } catch (err) {
    next(err);
  }
});

// ----- CHAIR ROUTES -----

// @GET /api/papers  — All papers (chair only)
router.get('/', protect, authorize('chairperson'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};

    const papers = await Paper.find(filter)
      .populate('author', 'name email affiliation')
      .populate('assignedReviewers', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-extractedText');

    const total = await Paper.countDocuments(filter);

    res.json({ papers, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// @GET /api/papers/stats  — Dashboard stats (chair)
router.get('/stats', protect, authorize('chairperson'), async (req, res, next) => {
  try {
    const [total, pending, under_review, accepted, rejected] = await Promise.all([
      Paper.countDocuments(),
      Paper.countDocuments({ status: 'pending' }),
      Paper.countDocuments({ status: 'under_review' }),
      Paper.countDocuments({ status: 'accepted' }),
      Paper.countDocuments({ status: 'rejected' }),
    ]);

    const reviews = await Review.countDocuments();

    res.json({ total, pending, under_review, accepted, rejected, reviews });
  } catch (err) {
    next(err);
  }
});

// @GET /api/papers/:id/ats-score  — Lightweight polling endpoint for ATS score
router.get('/:id/ats-score', protect, async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id)
      .select('aiScore aiAnalysisStatus title status author assignedReviewers');
    if (!paper) return res.status(404).json({ message: 'Paper not found' });

    // Access control
    if (req.user.role === 'author' && paper.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'reviewer') {
      const isAssigned = paper.assignedReviewers.some(
        (r) => r.toString() === req.user._id.toString()
      );
      if (!isAssigned) return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      aiScore: paper.aiScore,
      aiAnalysisStatus: paper.aiAnalysisStatus,
    });
  } catch (err) {
    next(err);
  }
});

// @GET /api/papers/:id  — Single paper
router.get('/:id', protect, async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id)
      .populate('author', 'name email affiliation')
      .populate('assignedReviewers', 'name email expertise')
      .populate('chairDecision.decidedBy', 'name');

    if (!paper) return res.status(404).json({ message: 'Paper not found' });

    // Authors can only see their own papers
    if (req.user.role === 'author' && paper.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Reviewers can only see assigned papers
    if (req.user.role === 'reviewer') {
      const isAssigned = paper.assignedReviewers.some(
        (r) => r._id.toString() === req.user._id.toString()
      );
      if (!isAssigned) return res.status(403).json({ message: 'Access denied' });
    }

    const reviews = await Review.find({ paper: paper._id })
      .populate('reviewer', 'name email');

    res.json({ paper, reviews });
  } catch (err) {
    next(err);
  }
});

// @PATCH /api/papers/:id/assign  — Assign reviewers (chair)
router.patch(
  '/:id/assign',
  protect,
  authorize('chairperson'),
  async (req, res, next) => {
    try {
      const { reviewerIds } = req.body;
      if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
        return res.status(400).json({ message: 'reviewerIds array is required' });
      }

      const paper = await Paper.findByIdAndUpdate(
        req.params.id,
        { assignedReviewers: reviewerIds, status: 'under_review' },
        { new: true }
      ).populate('assignedReviewers', 'name email');

      if (!paper) return res.status(404).json({ message: 'Paper not found' });

      res.json({ message: 'Reviewers assigned successfully', paper });
    } catch (err) {
      next(err);
    }
  }
);

// @PATCH /api/papers/:id/decision  — Chair decision (accept/reject)
router.patch(
  '/:id/decision',
  protect,
  authorize('chairperson'),
  [
    body('decision').isIn(['accept', 'reject', 'revision']),
    body('comments').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { decision, comments } = req.body;
      const statusMap = { accept: 'accepted', reject: 'rejected', revision: 'revision_required' };

      const paper = await Paper.findByIdAndUpdate(
        req.params.id,
        {
          status: statusMap[decision],
          chairDecision: {
            decision,
            comments: comments || '',
            decidedAt: new Date(),
            decidedBy: req.user._id,
          },
        },
        { new: true }
      );

      if (!paper) return res.status(404).json({ message: 'Paper not found' });

      res.json({ message: 'Decision recorded', paper });
    } catch (err) {
      next(err);
    }
  }
);

// @PATCH /api/papers/:id/schedule  — Schedule accepted paper (chair)
router.patch(
  '/:id/schedule',
  protect,
  authorize('chairperson'),
  async (req, res, next) => {
    try {
      const { scheduledDate, scheduledRoom, scheduledSession } = req.body;

      const paper = await Paper.findById(req.params.id);
      if (!paper) return res.status(404).json({ message: 'Paper not found' });
      if (paper.status !== 'accepted') {
        return res.status(400).json({ message: 'Only accepted papers can be scheduled' });
      }

      paper.scheduledDate = scheduledDate;
      paper.scheduledRoom = scheduledRoom;
      paper.scheduledSession = scheduledSession;
      await paper.save();

      res.json({ message: 'Paper scheduled successfully', paper });
    } catch (err) {
      next(err);
    }
  }
);

// ----- REVIEWER ROUTES -----

// @GET /api/papers/assigned/me  — Reviewer's assigned papers
router.get('/assigned/me', protect, authorize('reviewer'), async (req, res, next) => {
  try {
    const papers = await Paper.find({ assignedReviewers: req.user._id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .select('-extractedText');

    const papersWithMyReview = await Promise.all(
      papers.map(async (paper) => {
        const myReview = await Review.findOne({ paper: paper._id, reviewer: req.user._id });
        return { ...paper.toObject(), myReview };
      })
    );

    res.json({ papers: papersWithMyReview });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
