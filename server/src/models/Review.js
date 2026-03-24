const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    overallScore: {
      type: Number,
      min: 1,
      max: 10,
      required: [true, 'Overall score is required'],
    },
    technicalScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    originalityScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    presentationScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    comments: {
      type: String,
      required: [true, 'Comments are required'],
      minlength: 20,
      maxlength: 5000,
    },
    strengthsComments: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    weaknessComments: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    recommendation: {
      type: String,
      enum: ['accept', 'reject', 'revision', 'strong_accept', 'strong_reject'],
      required: [true, 'Recommendation is required'],
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One review per reviewer per paper
reviewSchema.index({ paper: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
