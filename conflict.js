// COGNITIVE INSIGHT ENGINE - Conflict Detection Module
// Version 3.0 - Advanced Contradiction Analysis

class ConflictResolver {
  constructor(knowledgeBase) {
    this.kb = knowledgeBase;
  }

  analyzeConflicts(analysis) {
    const narrativeConflicts = this.detectNarrativeConflicts(analysis.hits);
    const driverConflicts = analysis.conflicts || [];
    const patternConflicts = this.detectPatternConflicts(analysis.patterns);
    const temporalConflicts = this.detectTemporalConflicts(analysis.temporalShift);
    
    const allConflicts = [
      ...narrativeConflicts,
      ...driverConflicts,
      ...patternConflicts,
      ...temporalConflicts
    ];
    
    return {
      narrative: narrativeConflicts,
      drivers: driverConflicts,
      patterns: patternConflicts,
      temporal: temporalConflicts,
      all: allConflicts,
      overall_coherence: this.calculateCoherence(narrativeConflicts, driverConflicts),
      conflict_density: allConflicts.length / Math.max(1, analysis.hits.length)
    };
  }

  detectNarrativeConflicts(hits) {
    const conflicts = [];
    
    // Check for direct contradictions in lexicon
    for (let i = 0; i < hits.length; i++) {
      const hit1 = hits[i];
      const marker1 = this.kb.lexicon[hit1.word];
      
      if (!marker1 || !marker1.contradicts) continue;
      
      for (let j = i + 1; j < hits.length; j++) {
        const hit2 = hits[j];
        
        if (marker1.contradicts.includes(hit2.word)) {
          const distance = Math.abs(hit2.position - hit1.position);
          const distanceFactor = Math.max(0, 1 - (distance / 20)); // Closer = more significant
          
          if (distanceFactor > 0.3) { // Only if reasonably close
            conflicts.push({
              type: "lexical_contradiction",
              words: [hit1.word, hit2.word],
              categories: [hit1.category, hit2.category],
              positions: [hit1.position, hit2.position],
              distance: distance,
              distanceFactor: distanceFactor,
              interpretation: `Contradictory language detected: "${hit1.word}" vs "${hit2.word}"`,
              severity: (hit1.adjustedWeight + hit2.adjustedWeight) * distanceFactor * 0.5
            });
          }
        }
      }
    }
    
    // Check for self-negation patterns
    hits.forEach(hit => {
      if (hit.isNegated && hit.adjustedWeight > 1.5) {
        conflicts.push({
          type: "self_negation",
          word: hit.word,
          position: hit.position,
          weight: hit.adjustedWeight,
          interpretation: "Strong negation of significant marker may indicate defensive response or underlying belief",
          recommendation: "Explore what emotions arise when considering the non-negated version",
          severity: hit.adjustedWeight * 0.3
        });
      }
    });
    
    // Check for amplifier-diminisher conflicts
    hits.forEach(hit => {
      if (hit.modifiers && hit.modifiers.length > 1) {
        const hasAmplifier = hit.modifiers.some(m => m.type.includes('amplifier'));
        const hasDiminisher = hit.modifiers.some(m => m.type.includes('diminisher'));
        
        if (hasAmplifier && hasDiminisher) {
          conflicts.push({
            type: "modifier_conflict",
            word: hit.word,
            modifiers: hit.modifiers.map(m => m.word),
            interpretation: "Conflicting modifiers suggest uncertainty about emotional intensity",
            severity: hit.adjustedWeight * 0.2
          });
        }
      }
    });
    
    return conflicts;
  }

  detectPatternConflicts(patternScores) {
    const conflicts = [];
    const patterns = Object.keys(patternScores);
    
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const p1 = patterns[i];
        const p2 = patterns[j];
        
        const p1Info = this.kb.pattern_relationships[p1];
        const p2Info = this.kb.pattern_relationships[p2];
        
        // Check if patterns conflict
        if (p1Info && p1Info.conflicts_with && p1Info.conflicts_with.includes(p2)) {
          if (patternScores[p1].confidence > 0.5 && patternScores[p2].confidence > 0.5) {
            conflicts.push({
              type: "pattern_conflict",
              patterns: [p1, p2],
              patternNames: [this.kb.patterns[p1]?.name || p1, this.kb.patterns[p2]?.name || p2],
              confidences: [patternScores[p1].confidence, patternScores[p2].confidence],
              interpretation: `Competing cognitive patterns: ${p1} vs ${p2}. May indicate cognitive dissonance or transition between thinking styles.`,
              severity: (patternScores[p1].confidence + patternScores[p2].confidence) / 2
            });
          }
        }
        
        // Check reinforcement patterns that would create tension
        if (p1Info && p1Info.reinforces && p1Info.reinforces.includes(p2)) {
          const pattern1 = this.kb.patterns[p1];
          const pattern2 = this.kb.patterns[p2];
          
          if (pattern1 && pattern2 && pattern1.driver !== pattern2.driver) {
            const driver1 = this.kb.drivers[pattern1.driver];
            const driver2 = this.kb.drivers[pattern2.driver];
            
            if (driver1 && driver2 && driver1.conflicts_with && driver1.conflicts_with.includes(pattern2.driver)) {
              conflicts.push({
                type: "reinforced_conflict",
                patterns: [p1, p2],
                drivers: [pattern1.driver, pattern2.driver],
                interpretation: `Pattern ${p1} reinforces ${p2}, but their underlying drivers (${pattern1.driver} and ${pattern2.driver}) are in conflict. This creates a self-reinforcing tension loop.`,
                severity: Math.max(patternScores[p1].confidence, patternScores[p2].confidence)
              });
            }
          }
        }
      }
    }
    
    return conflicts;
  }

  detectTemporalConflicts(temporalShift) {
    const conflicts = [];
    
    if (!temporalShift || !temporalShift.arc) return conflicts;
    
    // Check for resolution-escalation conflicts
    const arcs = Object.entries(temporalShift.arc);
    arcs.forEach(([pattern, arcType], i) => {
      arcs.forEach(([otherPattern, otherArcType], j) => {
        if (i < j) {
          const patternInfo = this.kb.patterns[pattern];
          const otherPatternInfo = this.kb.patterns[otherPattern];
          
          if (patternInfo && otherPatternInfo && patternInfo.driver === otherPatternInfo.driver) {
            if ((arcType === "resolving" && otherArcType === "escalating") ||
                (arcType === "escalating" && otherArcType === "resolving")) {
              conflicts.push({
                type: "temporal_conflict",
                patterns: [pattern, otherPattern],
                arcs: [arcType, otherArcType],
                driver: patternInfo.driver,
                interpretation: `Within the same psychological driver (${patternInfo.driver}), one pattern resolves while another escalates. This suggests mixed progress or compartmentalization.`,
                severity: 0.6
              });
            }
          }
        }
      });
    });
    
    return conflicts;
  }

  calculateCoherence(narrativeConflicts, driverConflicts) {
    const totalConflicts = narrativeConflicts.length + driverConflicts.length;
    
    if (totalConflicts === 0) return 0.9; // High coherence with no conflicts
    
    // Calculate weighted conflict score
    const narrativeSeverity = narrativeConflicts.reduce((sum, c) => sum + (c.severity || 0.5), 0);
    const driverSeverity = driverConflicts.reduce((sum, c) => sum + (c.severity || 0.5), 0);
    const totalSeverity = narrativeSeverity + driverSeverity;
    
    // Coherence inversely related to conflict severity
    const coherence = Math.max(0.1, 1 - (totalSeverity / (totalConflicts * 2)));
    
    return coherence;
  }

  generateConflictSummary(conflictAnalysis) {
    const { all, conflict_density, overall_coherence } = conflictAnalysis;
    
    if (all.length === 0) {
      return {
        summary: "No significant cognitive conflicts detected. Language shows good internal consistency.",
        coherence_level: "high",
        recommendation: "Continue current reflective practices."
      };
    }
    
    const conflictTypes = all.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1;
      return acc;
    }, {});
    
    const primaryConflictType = Object.keys(conflictTypes).sort((a, b) => 
      conflictTypes[b] - conflictTypes[a]
    )[0];
    
    let coherence_level = "low";
    if (overall_coherence > 0.7) coherence_level = "high";
    else if (overall_coherence > 0.4) coherence_level = "moderate";
    
    let summary = `Detected ${all.length} cognitive conflict${all.length !== 1 ? 's' : ''} `;
    summary += `(coherence: ${coherence_level}). `;
    
    if (primaryConflictType === "driver_conflict") {
      summary += "Primary tension between competing psychological needs. ";
    } else if (primaryConflictType === "lexical_contradiction") {
      summary += "Language contains contradictory terms, suggesting ambivalence. ";
    } else if (primaryConflictType === "pattern_conflict") {
      summary += "Competing cognitive patterns detected, indicating transitional thinking. ";
    }
    
    summary += `Conflict density: ${(conflict_density * 100).toFixed(1)}%`;
    
    let recommendation = "";
    if (conflict_density > 0.3) {
      recommendation = "Consider exploring these contradictions through journaling or dialogue to increase self-awareness.";
    } else if (overall_coherence < 0.4) {
      recommendation = "High level of contradiction suggests significant internal tension. Professional support may be beneficial.";
    } else {
      recommendation = "Awareness of these patterns is the first step toward cognitive flexibility.";
    }
    
    return {
      summary,
      coherence_level,
      conflict_density,
      conflict_types: conflictTypes,
      recommendation
    };
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConflictResolver;
}