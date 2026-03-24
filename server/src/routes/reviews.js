const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Paper = require('../models/Paper');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @POST /api/reviews/:paperId  — Submit review (reviewer)
router.post(
  '/:paperId',
  protect,
  authorize('reviewer'),
  [
    body('overallScore').isInt({ min: 1, max: 10 }).withMessage('Overall score must be 1-10'),
    body('technicalScore').optional().isInt({ min: 1, max: 10 }),
    body('originalityScore').optional().isInt({ min: 1, max: 10 }),
    body('presentationScore').optional().isInt({ min: 1, max: 10 }),
    body('comments').trim().isLength({ min: 20 }).withMessage('Comments must be at least 20 characters'),
    body('recommendation')
      .isIn(['accept', 'reject', 'revision', 'strong_accept', 'strong_reject'])
      .withMessage('Invalid recommendation'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const paper = await Paper.findById(req.params.paperId);
      if (!paper) return res.status(404).json({ message: 'Paper not found' });

      // Check reviewer is assigned to this paper
      const isAssigned = paper.assignedReviewers.some(
        (r) => r.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to review this paper' });
      }

      // Check if already reviewed
      const existing = await Review.findOne({ paper: paper._id, reviewer: req.user._id });
      if (existing) {
        return res.status(409).json({ message: 'You have already submitted a review for this paper' });
      }

      const {
        overallScore, technicalScore, originalityScore, presentationScore,
        comments, strengthsComments, weaknessComments, recommendation, isConfidential,
      } = req.body;

      const review = await Review.create({
        paper: paper._id,
        reviewer: req.user._id,
        overallScore,
        technicalScore: technicalScore || 5,
        originalityScore: originalityScore || 5,
        presentationScore: presentationScore || 5,
        comments,
        strengthsComments,
        weaknessComments,
        recommendation,
        isConfidential: isConfidential || false,
      });

      res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (err) {
      next(err);
    }
  }
);

// @GET /api/reviews/paper/:paperId  — Get reviews for a paper (chair)
router.get('/paper/:paperId', protect, authorize('chairperson'), async (req, res, next) => {
  try {
    const reviews = await Review.find({ paper: req.params.paperId })
      .populate('reviewer', 'name email expertise');
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// @GET /api/reviews/my  — Reviewer's submitted reviews
router.get('/my', protect, authorize('reviewer'), async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('paper', 'title status author')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/reviews/:reviewId  — Update a review (reviewer, before chair decision)
router.put(
  '/:reviewId',
  protect,
  authorize('reviewer'),
  async (req, res, next) => {
    try {
      const review = await Review.findOne({
        _id: req.params.reviewId,
        reviewer: req.user._id,
      });
      if (!review) return res.status(404).json({ message: 'Review not found' });

      // Check paper doesn't already have a decision
      const paper = await Paper.findById(review.paper);
      if (['accepted', 'rejected'].includes(paper?.status)) {
        return res.status(400).json({ message: 'Cannot edit review after chair decision' });
      }

      const allowedFields = [
        'overallScore', 'technicalScore', 'originalityScore', 'presentationScore',
        'comments', 'strengthsComments', 'weaknessComments', 'recommendation',
      ];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) review[field] = req.body[field];
      });

      await review.save();
      res.json({ message: 'Review updated successfully', review });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
