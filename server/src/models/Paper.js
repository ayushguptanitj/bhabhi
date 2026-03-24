const mongoose = require('mongoose');

const aiScoreSchema = new mongoose.Schema({
  // Legacy / core scores
  grammarScore:       { type: Number, default: 0 },
  clarityScore:       { type: Number, default: 0 },
  formattingScore:    { type: Number, default: 0 },
  overallScore:       { type: Number, default: 0 },
  grammarFeedback:    { type: String, default: '' },
  clarityFeedback:    { type: String, default: '' },
  formattingFeedback: { type: String, default: '' },

  // Extended ATS parameters
  structureScore:     { type: Number, default: 0 },
  structureFeedback:  { type: String, default: '' },
  foundSections:      [{ type: String }],
  missingSections:    [{ type: String }],

  lengthScore:        { type: Number, default: 0 },
  lengthFeedback:     { type: String, default: '' },
  wordCount:          { type: Number, default: 0 },

  referencesScore:    { type: Number, default: 0 },
  referencesFeedback: { type: String, default: '' },
  citationCount:      { type: Number, default: 0 },

  visualsScore:       { type: Number, default: 0 },
  visualsFeedback:    { type: String, default: '' },
  figureCount:        { type: Number, default: 0 },
  tableCount:         { type: Number, default: 0 },

  abstractScore:      { type: Number, default: 0 },
  abstractFeedback:   { type: String, default: '' },
  abstractWordCount:  { type: Number, default: 0 },

  avgSentenceLength:  { type: String, default: '0' },
  fleschScore:        { type: String, default: '0' },

  // Section presence flags
  hasAbstract:        { type: Boolean, default: false },
  hasIntroduction:    { type: Boolean, default: false },
  hasMethodology:     { type: Boolean, default: false },
  hasConclusion:      { type: Boolean, default: false },
  analyzedAt:         { type: Date },
});


const paperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Paper title is required'],
      trim: true,
      minlength: 5,
      maxlength: 300,
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
      trim: true,
      minlength: 50,
      maxlength: 3000,
    },
    keywords: [{ type: String, trim: true }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    extractedText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'accepted', 'rejected', 'revision_required'],
      default: 'pending',
    },
    aiScore: {
      type: aiScoreSchema,
      default: () => ({}),
    },
    aiAnalysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    assignedReviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    chairDecision: {
      decision: { type: String, enum: ['accept', 'reject', 'revision'] },
      comments: { type: String, default: '' },
      decidedAt: { type: Date },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    scheduledDate: { type: Date },
    scheduledRoom: { type: String },
    scheduledSession: { type: String },
    conferenceTrack: { type: String, default: 'General' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Paper', paperSchema);
