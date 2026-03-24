/**
 * Rule-based ATS (Academic Paper Readiness Score) System
 * No external API required — fully local analysis.
 *
 * Parameters modelled after IEEE / ACM / Elsevier submission guidelines
 * and common academic quality checks used by top conferences.
 */

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

const countSentences = (text) =>
  (text.match(/[^.!?]+[.!?]+/g) || []).length || 1;

const countSyllables = (word) => {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

const avgSyllablesPerWord = (words) => {
  const total = words.reduce((sum, w) => sum + countSyllables(w), 0);
  return total / (words.length || 1);
};

/* Flesch Reading Ease: higher = easier (60-70 ideal for academic) */
const fleschReadingEase = (text) => {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = countSentences(text);
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const score =
    206.835 -
    1.015 * (words.length / sentences) -
    84.6 * (syllables / (words.length || 1));
  return Math.max(0, Math.min(100, score));
};

const sectionPresent = (text, patterns) =>
  patterns.some((p) => new RegExp(p, 'i').test(text));

/* ─── Individual Scorers ────────────────────────────────────────────────────── */

/**
 * 1. STRUCTURE SCORE (0-100)
 * IEEE/ACM require: Abstract, Keywords, Introduction,
 * Related Work, Methodology, Results, Conclusion, References
 */
const scoreStructure = (text) => {
  const checks = [
    { label: 'Abstract', weight: 15, patterns: ['\\babstract\\b'] },
    { label: 'Keywords', weight: 8, patterns: ['\\bkeywords\\b', '\\bindex terms\\b'] },
    { label: 'Introduction', weight: 12, patterns: ['\\bintroduction\\b', '\\b1\\.\\s*introduction\\b'] },
    { label: 'Related Work', weight: 10, patterns: ['\\brelated work\\b', '\\bliterature review\\b', '\\bbackground\\b'] },
    { label: 'Methodology', weight: 15, patterns: ['\\bmethodology\\b', '\\bmethod\\b', '\\bproposed approach\\b', '\\bsystem design\\b'] },
    { label: 'Results', weight: 15, patterns: ['\\bresults\\b', '\\bexperiments\\b', '\\bevaluation\\b', '\\banalysis\\b'] },
    { label: 'Conclusion', weight: 15, patterns: ['\\bconclusion\\b', '\\bsummary\\b', '\\bfuture work\\b'] },
    { label: 'References', weight: 10, patterns: ['\\breferences\\b', '\\bbibliography\\b'] },
  ];

  let score = 0;
  const found = [];
  const missing = [];

  checks.forEach(({ label, weight, patterns }) => {
    if (sectionPresent(text, patterns)) {
      score += weight;
      found.push(label);
    } else {
      missing.push(label);
    }
  });

  const feedback =
    missing.length === 0
      ? 'All required sections detected.'
      : `Missing sections: ${missing.join(', ')}.`;

  return { score: Math.min(100, score), feedback, found, missing };
};

/**
 * 2. LENGTH & WORD COUNT SCORE (0-100)
 * IEEE conference papers: 4–8 pages ≈ 2500–6000 words
 * Workshop/short papers: 2–4 pages ≈ 1200–2500 words
 */
const scoreLengthCompliance = (text) => {
  const wordCount = countWords(text);
  let score = 0;
  let feedback = '';

  if (wordCount >= 3000 && wordCount <= 8000) {
    score = 100;
    feedback = `Word count (${wordCount}) is within the optimal range (3000–8000 words).`;
  } else if (wordCount >= 2000 && wordCount < 3000) {
    score = 75;
    feedback = `Word count (${wordCount}) is slightly below the recommended minimum of 3000.`;
  } else if (wordCount > 8000 && wordCount <= 12000) {
    score = 70;
    feedback = `Word count (${wordCount}) exceeds the typical limit. Consider condensing.`;
  } else if (wordCount >= 1000 && wordCount < 2000) {
    score = 40;
    feedback = `Word count (${wordCount}) is too low for a full conference paper. Minimum 2000 words.`;
  } else if (wordCount > 12000) {
    score = 50;
    feedback = `Word count (${wordCount}) is very high. Most conferences cap at 8000–12000 words.`;
  } else {
    score = 10;
    feedback = `Word count (${wordCount}) is insufficient. A minimum of 1000 words is expected.`;
  }

  return { score, feedback, wordCount };
};

/**
 * 3. CLARITY SCORE (0-100)
 * Based on Flesch Reading Ease + average sentence length.
 * Academic papers should be readable but not overly complex.
 */
const scoreClarity = (text) => {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = countSentences(text);
  const avgSentLen = words.length / sentences;
  const fre = fleschReadingEase(text);

  // Academic ideal: Flesch 30-60 (harder texts are expected but too hard = bad)
  let freScore = 0;
  if (fre >= 30 && fre <= 60) freScore = 100;
  else if (fre >= 20 && fre < 30) freScore = 80;
  else if (fre >= 60 && fre <= 70) freScore = 85;
  else if (fre < 20) freScore = 50;
  else freScore = 65;

  // Sentence length: 15-25 words per sentence is ideal for academic writing
  let sentScore = 0;
  if (avgSentLen >= 15 && avgSentLen <= 25) sentScore = 100;
  else if (avgSentLen >= 10 && avgSentLen < 15) sentScore = 75;
  else if (avgSentLen > 25 && avgSentLen <= 35) sentScore = 70;
  else if (avgSentLen > 35) sentScore = 40;
  else sentScore = 60;

  const score = Math.round(freScore * 0.5 + sentScore * 0.5);
  const feedback =
    avgSentLen > 30
      ? `Average sentence length is ${avgSentLen.toFixed(1)} words — consider breaking up long sentences.`
      : avgSentLen < 10
      ? `Sentences are very short (avg ${avgSentLen.toFixed(1)} words) — may lack technical depth.`
      : `Readability is good (avg sentence: ${avgSentLen.toFixed(1)} words, Flesch score: ${fre.toFixed(0)}).`;

  return { score, feedback, avgSentenceLength: avgSentLen.toFixed(1), fleschScore: fre.toFixed(0) };
};

/**
 * 4. GRAMMAR & LANGUAGE QUALITY (0-100)
 * Rule-based checks: passive overuse, weak phrases, repetition, transition words.
 */
const scoreGrammar = (text) => {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  let deductions = 0;
  const issues = [];

  // Passive voice overuse (>40% sentences with "was/were/been/is/are being")
  const passiveMatches = sentences.filter((s) =>
    /\b(was|were|been|is|are|being)\s+\w+ed\b/.test(s.toLowerCase())
  );
  const passiveRatio = passiveMatches.length / (sentences.length || 1);
  if (passiveRatio > 0.5) {
    deductions += 20;
    issues.push('Excessive passive voice detected — use active voice more.');
  } else if (passiveRatio > 0.35) {
    deductions += 10;
    issues.push('High passive voice usage — consider reducing.');
  }

  // Weak filler phrases
  const weakPhrases = [
    'it is important to note', 'it should be noted', 'needless to say',
    'as a matter of fact', 'in order to', 'due to the fact',
    'at the end of the day', 'very unique', 'very important'
  ];
  const weakCount = weakPhrases.filter((p) => lower.includes(p)).length;
  if (weakCount >= 3) { deductions += 15; issues.push(`${weakCount} weak/filler phrases detected.`); }
  else if (weakCount > 0) { deductions += 5; }

  // First-person overuse in formal paper (limit to 5%)
  const firstPerson = (lower.match(/\b(i |we |my |our )\b/g) || []).length;
  const firstPersonRatio = firstPerson / (words.length || 1);
  if (firstPersonRatio > 0.05) {
    deductions += 10;
    issues.push('High first-person usage — use third-person for formal academic writing.');
  }

  // Check for transition words (good signal)
  const transitions = ['however', 'therefore', 'furthermore', 'moreover', 'consequently',
    'additionally', 'in contrast', 'on the other hand', 'as a result', 'in conclusion'];
  const transitionCount = transitions.filter((t) => lower.includes(t)).length;
  if (transitionCount < 2) {
    deductions += 10;
    issues.push('Few transition words detected — improves flow and coherence.');
  }

  const score = Math.max(0, 100 - deductions);
  const feedback = issues.length > 0 ? issues.join(' ') : 'Language quality looks good — clear and professional.';
  return { score, feedback };
};

/**
 * 5. REFERENCES & CITATIONS SCORE (0-100)
 * IEEE/ACM require ≥10 references for full papers.
 */
const scoreReferences = (text) => {
  // Count reference patterns like [1], [2,3], (Author, 2020)
  const bracketRefs = (text.match(/\[\d+[\d,\s]*\]/g) || []).length;
  const authorRefs = (text.match(/\([A-Z][a-z]+,?\s+\d{4}\)/g) || []).length;
  const refListEntries = (text.match(/^\s*\[\d+\]/gm) || []).length;

  const totalRefs = Math.max(bracketRefs, refListEntries, authorRefs);

  let score = 0;
  let feedback = '';

  if (totalRefs >= 15) {
    score = 100;
    feedback = `Strong reference coverage (${totalRefs} citations detected).`;
  } else if (totalRefs >= 10) {
    score = 85;
    feedback = `Good citation count (${totalRefs}). IEEE/ACM recommend ≥10 references.`;
  } else if (totalRefs >= 5) {
    score = 60;
    feedback = `Citation count (${totalRefs}) is below the recommended minimum of 10.`;
  } else if (totalRefs > 0) {
    score = 30;
    feedback = `Very few citations detected (${totalRefs}). Academic papers need robust referencing.`;
  } else {
    score = 0;
    feedback = 'No citations detected. Ensure references are properly formatted (e.g., [1] or (Author, 2020)).';
  }

  return { score, feedback, citationCount: totalRefs };
};

/**
 * 6. FIGURES & TABLES SCORE (0-100)
 * Good papers include visual aids (charts, tables, diagrams).
 */
const scoreFiguresAndTables = (text) => {
  const lower = text.toLowerCase();
  const figureCount = (lower.match(/\bfig(?:ure)?\.?\s*\d+/g) || []).length;
  const tableCount = (lower.match(/\btable\s*\d+/g) || []).length;
  const algorithmCount = (lower.match(/\balgorithm\s*\d+/g) || []).length;
  const equationCount = (lower.match(/\bequation\s*\d+/g) || []).length;

  const total = figureCount + tableCount + algorithmCount + equationCount;

  let score = 0;
  let feedback = '';

  if (total >= 5) {
    score = 100;
    feedback = `Good use of visual aids (${figureCount} figures, ${tableCount} tables, ${algorithmCount} algorithms).`;
  } else if (total >= 3) {
    score = 75;
    feedback = `Moderate visual aids (${total} items). Consider adding more figures/tables.`;
  } else if (total >= 1) {
    score = 40;
    feedback = `Few visual elements (${total}). Papers benefit greatly from figures and tables.`;
  } else {
    score = 10;
    feedback = 'No figures or tables detected. Visual aids significantly improve paper quality.';
  }

  return { score, feedback, figureCount, tableCount };
};

/**
 * 7. ABSTRACT QUALITY SCORE (0-100)
 * IEEE abstracts: 150-250 words, must mention problem, approach, results.
 */
const scoreAbstractQuality = (abstractText) => {
  if (!abstractText || abstractText.length < 20) {
    return { score: 0, feedback: 'No abstract provided.' };
  }

  const wordCount = countWords(abstractText);
  const lower = abstractText.toLowerCase();
  let score = 0;
  const issues = [];

  // Word count (IEEE: 150-250)
  if (wordCount >= 150 && wordCount <= 250) score += 40;
  else if (wordCount >= 100 && wordCount < 150) { score += 25; issues.push('Abstract is slightly short (<150 words).'); }
  else if (wordCount > 250 && wordCount <= 350) { score += 30; issues.push('Abstract is slightly long (>250 words).'); }
  else { score += 10; issues.push(`Abstract word count (${wordCount}) is outside the recommended 150–250 word range.`); }

  // Contains problem statement
  if (/\b(problem|challenge|issue|motivation|propose|present)\b/.test(lower)) score += 20;
  else issues.push('Abstract should state the problem/motivation.');

  // Contains approach/method
  if (/\b(approach|method|algorithm|technique|model|framework|system)\b/.test(lower)) score += 20;
  else issues.push('Abstract should describe the approach/method.');

  // Contains results/contribution
  if (/\b(result|achieve|show|demonstrate|improve|outperform|accuracy|performance)\b/.test(lower)) score += 20;
  else issues.push('Abstract should mention results or contributions.');

  const feedback = issues.length === 0
    ? 'Abstract covers problem, method, and results — well structured.'
    : issues.join(' ');

  return { score, feedback, abstractWordCount: wordCount };
};

/* ─── Master Scorer ─────────────────────────────────────────────────────────── */

/**
 * analyzePaper — runs all checks and returns unified ATS score object
 */
const analyzePaper = async (text, abstractText = '') => {
  const structure = scoreStructure(text);
  const length = scoreLengthCompliance(text);
  const clarity = scoreClarity(text);
  const grammar = scoreGrammar(text);
  const references = scoreReferences(text);
  const visuals = scoreFiguresAndTables(text);
  const abstract = scoreAbstractQuality(abstractText || text.substring(0, 1500));

  /*
   * Weighted overall — mirrors weights used by IEEE/Elsevier ATE systems:
   * Structure     20%
   * Grammar       18%
   * Clarity       15%
   * References    15%
   * Abstract       12%
   * Length        12%
   * Visuals        8%
   */
  const overallScore = Math.round(
    structure.score   * 0.20 +
    grammar.score     * 0.18 +
    clarity.score     * 0.15 +
    references.score  * 0.15 +
    abstract.score    * 0.12 +
    length.score      * 0.12 +
    visuals.score     * 0.08
  );

  return {
    // Legacy fields (kept for backward compat with existing UI)
    grammarScore:       grammar.score,
    grammarFeedback:    grammar.feedback,
    clarityScore:       clarity.score,
    clarityFeedback:    clarity.feedback,
    formattingScore:    structure.score,
    formattingFeedback: structure.feedback,
    overallScore,

    // Extended fields
    structureScore:     structure.score,
    structureFeedback:  structure.feedback,
    foundSections:      structure.found,
    missingSections:    structure.missing,

    lengthScore:        length.score,
    lengthFeedback:     length.feedback,
    wordCount:          length.wordCount,

    referencesScore:    references.score,
    referencesFeedback: references.feedback,
    citationCount:      references.citationCount,

    visualsScore:       visuals.score,
    visualsFeedback:    visuals.feedback,
    figureCount:        visuals.figureCount,
    tableCount:         visuals.tableCount,

    abstractScore:      abstract.score,
    abstractFeedback:   abstract.feedback,
    abstractWordCount:  abstract.abstractWordCount,

    avgSentenceLength:  clarity.avgSentenceLength,
    fleschScore:        clarity.fleschScore,

    // Section flags (backward compat)
    hasAbstract:        structure.found.includes('Abstract'),
    hasIntroduction:    structure.found.includes('Introduction'),
    hasMethodology:     structure.found.includes('Methodology'),
    hasConclusion:      structure.found.includes('Conclusion'),

    analyzedAt: new Date(),
  };
};

module.exports = { analyzePaper };
