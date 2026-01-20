// COGNITIVE INSIGHT ENGINE - Multi-Stage Processing Engine
// Version 3.0 - Advanced Pattern Detection & Analysis

class CognitiveEngine {
  constructor(knowledgeBase) {
    this.kb = knowledgeBase;
    this.contextWindow = this.kb.context_config.window_size;
    this.temporalSegments = 3; // beginning/middle/end
    this.minConfidenceThreshold = 0.3;
  }

  // ========== STAGE 1: SEMANTIC PARSING ==========
  
  tokenize(text) {
    // Enhanced tokenization with punctuation handling
    return text.toLowerCase()
      .replace(/[.,!?;:"'()]/g, ' $& ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  extractContext(tokens, index) {
    const start = Math.max(0, index - this.contextWindow);
    const end = Math.min(tokens.length, index + this.contextWindow + 1);
    
    return {
      preceding: tokens.slice(start, index),
      following: tokens.slice(index + 1, end),
      fullWindow: tokens.slice(start, end),
      positionInWindow: index - start
    };
  }

  detectNegation(context) {
    const { preceding } = context;
    
    // Check for hard negation
    for (let word of preceding) {
      if (this.kb.negation_patterns.hard_negation.includes(word)) {
        // Check if negation is actually targeting our marker
        const distance = preceding.length - preceding.indexOf(word) - 1;
        if (distance <= 3) { // Negation likely applies
          return { 
            isNegated: true, 
            type: "hard", 
            strength: 1.0,
            negator: word,
            distance: distance
          };
        }
      }
    }
    
    // Check for soft negation
    for (let word of preceding) {
      if (this.kb.negation_patterns.soft_negation.includes(word)) {
        return { 
          isNegated: true, 
          type: "soft", 
          strength: 0.6,
          negator: word
        };
      }
    }
    
    return { isNegated: false, type: "none", strength: 0 };
  }

  analyzeModifiers(context) {
    let multiplier = 1.0;
    let modifierTypes = [];
    
    // Check preceding words for amplifiers/diminishers
    context.preceding.forEach((word, idx) => {
      const distance = context.preceding.length - idx;
      const distanceWeight = Math.max(0.5, 1.0 - (distance * 0.2));
      
      if (this.kb.amplifiers.extreme.includes(word)) {
        multiplier += 0.4 * distanceWeight;
        modifierTypes.push({ type: "extreme_amplifier", word, distance });
      } else if (this.kb.amplifiers.moderate.includes(word)) {
        multiplier += 0.2 * distanceWeight;
        modifierTypes.push({ type: "moderate_amplifier", word, distance });
      } else if (this.kb.amplifiers.emotional.includes(word)) {
        multiplier += 0.3 * distanceWeight;
        modifierTypes.push({ type: "emotional_amplifier", word, distance });
      } else if (this.kb.diminishers.uncertainty.includes(word)) {
        multiplier -= 0.3 * distanceWeight;
        modifierTypes.push({ type: "uncertainty_diminisher", word, distance });
      } else if (this.kb.diminishers.qualification.includes(word)) {
        multiplier -= 0.2 * distanceWeight;
        modifierTypes.push({ type: "qualification_diminisher", word, distance });
      }
    });
    
    // Floor at 0.1, ceiling at 3.0
    return {
      multiplier: Math.max(0.1, Math.min(3.0, multiplier)),
      modifiers: modifierTypes
    };
  }

  matchSemanticPattern(token, context) {
    const marker = this.kb.lexicon[token];
    if (!marker) return { match: false };
    
    // Check if marker requires specific context
    if (marker.context_required && marker.valid_contexts) {
      const fullContext = context.fullWindow.join('_');
      const precedingContext = context.preceding.join('_');
      
      // Check for specific context patterns
      for (const [pattern, config] of Object.entries(marker.valid_contexts)) {
        if (fullContext.includes(pattern) || precedingContext.includes(pattern)) {
          return {
            match: true,
            contextPattern: pattern,
            contextConfig: config,
            contextWeight: config.weight || marker.weight
          };
        }
      }
    }
    
    // Default context match
    return { 
      match: true,
      contextPattern: "general",
      contextWeight: marker.weight
    };
  }

  calculateAdjustedWeight(baseWeight, negationState, modifierEffect, semanticContext) {
    if (!semanticContext.match) return 0;
    
    let adjustedWeight = semanticContext.contextWeight || baseWeight;
    
    // Apply negation
    if (negationState.isNegated) {
      adjustedWeight *= (1 - negationState.strength);
    }
    
    // Apply modifiers
    adjustedWeight *= modifierEffect.multiplier;
    
    // Apply temporal weighting (later markers may be more significant)
    return Math.max(0.1, adjustedWeight);
  }

  getTemporalSegment(position, totalLength) {
    const segmentSize = totalLength / this.temporalSegments;
    if (position < segmentSize) return "early";
    if (position < segmentSize * 2) return "middle";
    return "late";
  }

  parseText(input) {
    const tokens = this.tokenize(input);
    const hits = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const marker = this.kb.lexicon[token];
      
      if (marker) {
        const context = this.extractContext(tokens, i);
        const negationState = this.detectNegation(context);
        const modifierEffect = this.analyzeModifiers(context);
        const semanticContext = this.matchSemanticPattern(token, context);
        
        const adjustedWeight = this.calculateAdjustedWeight(
          marker.weight,
          negationState,
          modifierEffect,
          semanticContext
        );
        
        // Only include hits with meaningful weight
        if (adjustedWeight > 0.3) {
          hits.push({
            word: token,
            originalWord: input.split(/\s+/)[i] || token,
            position: i,
            category: marker.category,
            subcategory: marker.subcategory,
            baseWeight: marker.weight,
            adjustedWeight: adjustedWeight,
            isNegated: negationState.isNegated,
            negationType: negationState.type,
            negationStrength: negationState.strength,
            modifierEffect: modifierEffect.multiplier,
            modifiers: modifierEffect.modifiers,
            context: {
              preceding: context.preceding,
              following: context.following
            },
            semanticContext: semanticContext.contextPattern,
            temporalSegment: this.getTemporalSegment(i, tokens.length),
            emotionalValence: marker.emotional_valence || 0,
            clinicalNote: marker.clinical_note
          });
        }
      }
    }
    
    return hits;
  }

  // ========== STAGE 2: PATTERN AGGREGATION ==========
  
  aggregatePatterns(hits) {
    const patternScores = {};
    const temporalDistribution = { early: {}, middle: {}, late: {} };
    const subpatternDistribution = {};
    
    // Initialize pattern scores
    hits.forEach(hit => {
      const category = hit.category;
      
      if (!patternScores[category]) {
        patternScores[category] = {
          score: 0,
          count: 0,
          weightedScore: 0,
          positions: [],
          subpatterns: {},
          emotionalValence: [],
          confidence: 0,
          temporalDistribution: { early: 0, middle: 0, late: 0 },
          markers: []
        };
      }
      
      // Update main scores
      patternScores[category].score += hit.adjustedWeight;
      patternScores[category].count += 1;
      patternScores[category].weightedScore += hit.adjustedWeight * (hit.isNegated ? 0.5 : 1.0);
      patternScores[category].positions.push(hit.position);
      patternScores[category].emotionalValence.push(hit.emotionalValence);
      patternScores[category].temporalDistribution[hit.temporalSegment] += hit.adjustedWeight;
      patternScores[category].markers.push({
        word: hit.word,
        weight: hit.adjustedWeight,
        negated: hit.isNegated
      });
      
      // Track subpatterns
      if (hit.subcategory) {
        if (!patternScores[category].subpatterns[hit.subcategory]) {
          patternScores[category].subpatterns[hit.subcategory] = {
            score: 0,
            count: 0
          };
        }
        patternScores[category].subpatterns[hit.subcategory].score += hit.adjustedWeight;
        patternScores[category].subpatterns[hit.subcategory].count += 1;
      }
      
      // Update temporal distribution
      if (!temporalDistribution[hit.temporalSegment][category]) {
        temporalDistribution[hit.temporalSegment][category] = 0;
      }
      temporalDistribution[hit.temporalSegment][category] += hit.adjustedWeight;
      
      // Track subpattern distribution
      if (hit.subcategory) {
        const subpatternKey = `${category}.${hit.subcategory}`;
        if (!subpatternDistribution[subpatternKey]) {
          subpatternDistribution[subpatternKey] = { score: 0, count: 0 };
        }
        subpatternDistribution[subpatternKey].score += hit.adjustedWeight;
        subpatternDistribution[subpatternKey].count += 1;
      }
    });
    
    // Calculate confidence scores
    Object.keys(patternScores).forEach(category => {
      const data = patternScores[category];
      
      // Average emotional valence
      data.avgValence = data.emotionalValence.length > 0 
        ? data.emotionalValence.reduce((a, b) => a + b) / data.emotionalValence.length 
        : 0;
      
      // Calculate confidence (Bayesian approach)
      const countFactor = Math.min(data.count / 5, 1); // Cap benefit at 5 markers
      const weightFactor = data.weightedScore / (data.count * 5); // Normalize to max weight
      const distributionFactor = this.calculateDistributionScore(data.positions, hits.length);
      const negationFactor = 1 - (data.markers.filter(m => m.negated).length / data.markers.length * 0.5);
      
      data.confidence = (
        countFactor * 0.3 +
        weightFactor * 0.3 +
        distributionFactor * 0.2 +
        negationFactor * 0.2
      );
      
      // Apply pattern-specific multipliers
      const pattern = this.kb.patterns[category];
      if (pattern) {
        data.confidence *= (pattern.weight_multiplier || 1.0);
        data.severity = data.weightedScore >= (pattern.severity_threshold || 2);
      }
    });
    
    return { 
      patternScores, 
      temporalDistribution, 
      subpatternDistribution 
    };
  }

  calculateDistributionScore(positions, totalLength) {
    if (positions.length < 2) return 0.5;
    
    // Calculate average gap between positions
    const gaps = [];
    for (let i = 1; i < positions.length; i++) {
      gaps.push(positions[i] - positions[i-1]);
    }
    
    const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
    const idealGap = totalLength / positions.length;
    
    // Score higher for even distribution, lower for clustering
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const normalizedVariance = variance / Math.pow(idealGap, 2);
    
    return Math.max(0.1, 1 - Math.min(1, normalizedVariance));
  }

  // ========== STAGE 3: DRIVER INFERENCE ==========
  
  inferDrivers(patternScores) {
    const driverScores = {};
    
    Object.keys(patternScores).forEach(category => {
      const pattern = this.kb.patterns[category];
      if (!pattern || !pattern.driver) return;
      
      const driver = pattern.driver;
      if (!driverScores[driver]) {
        driverScores[driver] = {
          score: 0,
          weightedScore: 0,
          contributingPatterns: [],
          confidence: 0,
          manifestations: [],
          conflicts: []
        };
      }
      
      const patternData = patternScores[category];
      const driverContribution = patternData.weightedScore * (pattern.weight_multiplier || 1.0);
      
      driverScores[driver].score += patternData.score;
      driverScores[driver].weightedScore += driverContribution;
      driverScores[driver].contributingPatterns.push({
        pattern: category,
        patternName: pattern.name,
        weight: patternData.weightedScore,
        contribution: driverContribution,
        confidence: patternData.confidence,
        markers: patternData.markers
      });
      
      // Update confidence (maximum of contributing patterns)
      driverScores[driver].confidence = Math.max(
        driverScores[driver].confidence,
        patternData.confidence
      );
      
      // Add pattern manifestations
      if (pattern.manifestations) {
        driverScores[driver].manifestations.push(...pattern.manifestations);
      }
    });
    
    // Normalize driver scores
    Object.keys(driverScores).forEach(driver => {
      const data = driverScores[driver];
      data.normalizedScore = Math.min(10, data.weightedScore / 5); // Scale to 0-10
      data.primary = data.normalizedScore >= 5;
      
      // Get driver info from knowledge base
      const driverInfo = this.kb.drivers[driver];
      if (driverInfo) {
        data.name = driverInfo.name;
        data.insight = driverInfo.insight;
        data.therapeuticDirection = driverInfo.therapeutic_direction;
        data.conflicts = driverInfo.conflicts_with || [];
      }
    });
    
    return driverScores;
  }

  // ========== STAGE 4: CONFLICT DETECTION ==========
  
  detectConflicts(driverScores, patternScores) {
    const conflicts = [];
    
    // Driver-level conflicts
    const drivers = Object.keys(driverScores);
    for (let i = 0; i < drivers.length; i++) {
      for (let j = i + 1; j < drivers.length; j++) {
        const d1 = drivers[i];
        const d2 = drivers[j];
        
        const d1Info = this.kb.drivers[d1];
        const d2Info = this.kb.drivers[d2];
        
        if (d1Info && d2Info && d1Info.conflicts_with && d1Info.conflicts_with.includes(d2)) {
          if (driverScores[d1].normalizedScore > 4 && driverScores[d2].normalizedScore > 4) {
            conflicts.push({
              type: "driver_conflict",
              drivers: [d1, d2],
              driverNames: [d1Info.name, d2Info.name],
              scores: [driverScores[d1].normalizedScore, driverScores[d2].normalizedScore],
              severity: Math.min(driverScores[d1].normalizedScore, driverScores[d2].normalizedScore),
              interpretation: `Strong need for both ${d1Info.name} (control/certainty) and ${d2Info.name} (acceptance/flexibility) suggests significant internal tension. This may manifest as approach-avoidance conflicts or decision paralysis.`,
              recommendation: "Explore integration through dialectical thinking or mindfulness practices that acknowledge both needs."
            });
          }
        }
      }
    }
    
    // Pattern-level conflicts
    Object.keys(patternScores).forEach(pattern => {
      const patternInfo = this.kb.patterns[pattern];
      if (patternInfo && patternInfo.contradicts) {
        const contradictingPatterns = patternScores[pattern].markers
          .flatMap(marker => {
            const markerInfo = this.kb.lexicon[marker.word];
            return markerInfo ? markerInfo.contradicts || [] : [];
          })
          .filter(contradiction => patternScores[contradiction]);
        
        if (contradictingPatterns.length > 0) {
          conflicts.push({
            type: "language_inconsistency",
            pattern: pattern,
            contradictingPatterns: contradictingPatterns,
            severity: patternScores[pattern].count / 10,
            interpretation: "Language contains contradictory patterns, suggesting uncertainty or ambivalence.",
            example: `Using both absolutist language ("always") and its contradiction ("sometimes")`
          });
        }
      }
    });
    
    // Negation conflicts (using negation but still strong emotion)
    Object.keys(patternScores).forEach(pattern => {
      const negatedMarkers = patternScores[pattern].markers.filter(m => m.negated);
      if (negatedMarkers.length > 0 && patternScores[pattern].avgValence < -0.5) {
        conflicts.push({
          type: "negation_paradox",
          pattern: pattern,
          severity: patternScores[pattern].confidence * 0.8,
          interpretation: "Negating a pattern while maintaining strong emotional charge suggests underlying belief or difficulty letting go.",
          example: "Saying 'I'm NOT a failure' with strong negative emotion may indicate underlying belief in being a failure."
        });
      }
    });
    
    return conflicts;
  }

  // ========== TEMPORAL ANALYSIS ==========
  
  analyzeTemporalShift(temporalDistribution) {
    const shifts = [];
    const segments = ["early", "middle", "late"];
    
    // Calculate overall trends
    segments.forEach((segment, index) => {
      const segmentPatterns = Object.keys(temporalDistribution[segment] || {});
      
      segmentPatterns.forEach(pattern => {
        const score = temporalDistribution[segment][pattern];
        
        // Compare with previous segment if exists
        if (index > 0) {
          const prevSegment = segments[index - 1];
          const prevScore = temporalDistribution[prevSegment][pattern] || 0;
          const change = score - prevScore;
          const percentChange = prevScore > 0 ? (change / prevScore) * 100 : 100;
          
          if (Math.abs(percentChange) > 50 && Math.abs(change) > 1) {
            shifts.push({
              pattern: pattern,
              from: prevSegment,
              to: segment,
              change: change,
              percentChange: percentChange,
              interpretation: percentChange > 0 ? "escalating" : "diminishing",
              intensity: Math.abs(percentChange) / 100
            });
          }
        }
      });
    });
    
    // Calculate narrative arc
    const arc = this.calculateNarrativeArc(temporalDistribution);
    
    return {
      shifts: shifts,
      arc: arc,
      summary: this.generateTemporalSummary(shifts, arc)
    };
  }

  calculateNarrativeArc(temporalDistribution) {
    const patterns = new Set();
    ["early", "middle", "late"].forEach(seg => {
      Object.keys(temporalDistribution[seg] || {}).forEach(p => patterns.add(p));
    });
    
    const arc = {};
    patterns.forEach(pattern => {
      const scores = ["early", "middle", "late"].map(
        seg => temporalDistribution[seg][pattern] || 0
      );
      
      // Determine arc type
      if (scores[0] > scores[1] && scores[1] > scores[2]) {
        arc[pattern] = "resolving";
      } else if (scores[0] < scores[1] && scores[1] < scores[2]) {
        arc[pattern] = "escalating";
      } else if (scores[1] > scores[0] && scores[1] > scores[2]) {
        arc[pattern] = "peaking_middle";
      } else {
        arc[pattern] = "fluctuating";
      }
    });
    
    return arc;
  }

  generateTemporalSummary(shifts, arc) {
    if (shifts.length === 0) return "Language patterns remain relatively stable throughout.";
    
    const escalating = shifts.filter(s => s.interpretation === "escalating");
    const diminishing = shifts.filter(s => s.interpretation === "diminishing");
    
    let summary = "Language shows notable shifts: ";
    
    if (escalating.length > 0) {
      summary += `${escalating.length} pattern(s) escalate (`;
      summary += escalating.map(s => `${s.pattern} from ${s.from} to ${s.to}`).join(', ');
      summary += "). ";
    }
    
    if (diminishing.length > 0) {
      summary += `${diminishing.length} pattern(s) diminish. `;
    }
    
    return summary;
  }

  // ========== MASTER ANALYSIS FUNCTION ==========
  
  analyze(text) {
    console.log("Starting analysis of text:", text.substring(0, 100) + "...");
    
    const hits = this.parseText(text);
    console.log("Found", hits.length, "cognitive markers");
    
    const { patternScores, temporalDistribution } = this.aggregatePatterns(hits);
    console.log("Patterns detected:", Object.keys(patternScores).length);
    
    const driverScores = this.inferDrivers(patternScores);
    console.log("Drivers inferred:", Object.keys(driverScores).length);
    
    const conflicts = this.detectConflicts(driverScores, patternScores);
    console.log("Conflicts detected:", conflicts.length);
    
    const temporalShift = this.analyzeTemporalShift(temporalDistribution);
    const coherenceScore = this.calculateCoherence(hits, conflicts);
    
    const metadata = {
      wordCount: text.split(/\s+/).length,
      markerCount: hits.length,
      markerDensity: hits.length / text.split(/\s+/).length,
      avgConfidence: this.calculateAvgConfidence(patternScores),
      analysisTimestamp: new Date().toISOString(),
      engineVersion: "3.0"
    };
    
    // Generate insights
    const insights = this.generateInsights(patternScores, driverScores, conflicts, temporalShift);
    
    return {
      hits: hits,
      patterns: patternScores,
      drivers: driverScores,
      conflicts: conflicts,
      temporalShift: temporalShift,
      coherence: coherenceScore,
      metadata: metadata,
      insights: insights
    };
  }

  calculateCoverageScore(hits) {
    if (hits.length === 0) return 0;
    
    const uniqueMarkers = new Set(hits.map(h => h.word));
    const uniqueCategories = new Set(hits.map(h => h.category));
    
    const markerDiversity = uniqueMarkers.size / hits.length;
    const categoryDiversity = uniqueCategories.size / Object.keys(this.kb.patterns).length;
    
    return (markerDiversity * 0.6 + categoryDiversity * 0.4);
  }

  calculateCoherence(hits, conflicts) {
    const baseCoherence = 0.7; // Assume some coherence
    
    // Reduce for contradictions
    const contradictionPenalty = conflicts.length * 0.1;
    
    // Increase for narrative flow (markers spread out)
    const positions = hits.map(h => h.position);
    const positionVariance = this.calculateVariance(positions);
    const flowBonus = positionVariance > 100 ? 0.1 : 0;
    
    return Math.max(0.1, Math.min(1, baseCoherence - contradictionPenalty + flowBonus));
  }

  calculateVariance(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  calculateAvgConfidence(patternScores) {
    const patterns = Object.keys(patternScores);
    if (patterns.length === 0) return 0;
    
    const totalConfidence = patterns.reduce((sum, pattern) => {
      return sum + (patternScores[pattern].confidence || 0);
    }, 0);
    
    return totalConfidence / patterns.length;
  }

  // ========== INSIGHT GENERATION ==========
  
  generateInsights(patternScores, driverScores, conflicts, temporalShift) {
    const insights = [];
    
    // Primary pattern insight
    const primaryPatterns = Object.keys(patternScores)
      .filter(p => patternScores[p].confidence > this.minConfidenceThreshold)
      .sort((a, b) => patternScores[b].weightedScore - patternScores[a].weightedScore);
    
    if (primaryPatterns.length > 0) {
      const primary = primaryPatterns[0];
      const patternInfo = this.kb.patterns[primary];
      
      insights.push({
        type: "primary_pattern",
        pattern: primary,
        name: patternInfo?.name || primary,
        confidence: patternScores[primary].confidence,
        description: patternInfo?.clinical_correlation || "No specific description available.",
        recommendation: patternInfo?.mitigation_strategy || "Consider awareness of this thinking pattern."
      });
    }
    
    // Primary driver insight
    const primaryDrivers = Object.keys(driverScores)
      .filter(d => driverScores[d].normalizedScore >= 5)
      .sort((a, b) => driverScores[b].normalizedScore - driverScores[a].normalizedScore);
    
    if (primaryDrivers.length > 0) {
      const primary = primaryDrivers[0];
      const driverInfo = this.kb.drivers[primary];
      
      insights.push({
        type: "primary_driver",
        driver: primary,
        name: driverInfo?.name || primary,
        score: driverScores[primary].normalizedScore,
        insight: driverInfo?.insight || "Core psychological need detected.",
        therapeuticDirection: driverInfo?.therapeutic_direction || "Explore this need in context."
      });
    }
    
    // Conflict insight
    if (conflicts.length > 0) {
      const primaryConflict = conflicts.sort((a, b) => b.severity - a.severity)[0];
      
      insights.push({
        type: "conflict_insight",
        conflictType: primaryConflict.type,
        severity: primaryConflict.severity,
        interpretation: primaryConflict.interpretation,
        recommendation: primaryConflict.recommendation || "Explore this tension through reflection or journaling."
      });
    }
    
    // Temporal insight
    if (temporalShift.shifts.length > 0) {
      const significantShift = temporalShift.shifts.sort((a, b) => b.intensity - a.intensity)[0];
      
      insights.push({
        type: "temporal_insight",
        pattern: significantShift.pattern,
        shift: significantShift.interpretation,
        fromTo: `${significantShift.from} → ${significantShift.to}`,
        interpretation: `This pattern ${significantShift.interpretation} as the narrative progresses, suggesting ${significantShift.interpretation === 'escalating' ? 'increasing concern' : 'resolution attempt'}.`
      });
    }
    
    return insights;
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CognitiveEngine;
}
