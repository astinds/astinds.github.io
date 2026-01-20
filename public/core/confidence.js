// COGNITIVE INSIGHT ENGINE - Confidence Scoring Module
// Version 3.0 - Bayesian certainty scoring for patterns and insights

class ConfidenceScorer {
    constructor(knowledgeBase) {
        this.kb = knowledgeBase;
        this.baseProbabilities = this.initializeBaseProbabilities();
    }

    initializeBaseProbabilities() {
        // Base probabilities based on general population (would be calibrated with real data)
        return {
            patterns: {
                absolutist: 0.15,      // 15% of people show this pattern in typical text
                imperative: 0.25,      // 25%
                catastrophizing: 0.10,  // 10%
                self_critic: 0.20,     // 20%
                personalization: 0.08,  // 8%
                mind_reading: 0.12,     // 12%
                emotional_reasoning: 0.18 // 18%
            },
            drivers: {
                control: 0.30,
                validation: 0.35,
                safety: 0.25,
                responsibility: 0.15,
                autonomy: 0.20
            },
            modifiers: {
                amplifier_effect: 0.7,    // When amplifier present, 70% chance of intensification
                diminisher_effect: 0.6,   // When diminisher present, 60% chance of reduction
                negation_effect: 0.8      // When negated, 80% chance of true negation
            }
        };
    }

    calculatePatternConfidence(patternData, totalMarkers) {
        if (!patternData || patternData.count === 0) return 0;
        
        const baseProb = this.baseProbabilities.patterns[patternData.category] || 0.1;
        
        // Factors influencing confidence:
        const factors = {
            countFactor: this.calculateCountFactor(patternData.count),
            weightFactor: this.calculateWeightFactor(patternData.weightedScore),
            distributionFactor: this.calculateDistributionFactor(patternData.positions, totalMarkers),
            consistencyFactor: this.calculateConsistencyFactor(patternData.markers),
            contextFactor: this.calculateContextFactor(patternData.markers)
        };
        
        // Bayesian updating: P(pattern|evidence) ∝ P(evidence|pattern) * P(pattern)
        let confidence = baseProb;
        
        // Update with each factor (simplified Bayesian update)
        Object.values(factors).forEach(factor => {
            confidence = confidence * factor;
        });
        
        // Normalize and apply sigmoid function for better scaling
        confidence = this.sigmoid(confidence * 10 - 5);
        
        // Cap at 0.95 to avoid absolute certainty
        return Math.min(0.95, Math.max(0.05, confidence));
    }

    calculateCountFactor(count) {
        // More markers = higher confidence, but diminishing returns
        if (count === 0) return 0.1;
        if (count === 1) return 0.3;
        if (count === 2) return 0.6;
        if (count === 3) return 0.8;
        if (count === 4) return 0.9;
        return 0.95; // 5+ markers
    }

    calculateWeightFactor(weightedScore) {
        // Higher weights = higher confidence
        const normalized = Math.min(1, weightedScore / 15);
        return 0.3 + (normalized * 0.7); // Range: 0.3 to 1.0
    }

    calculateDistributionFactor(positions, totalMarkers) {
        if (positions.length < 2) return 0.5;
        
        // Check if markers are clustered or evenly distributed
        const avgPosition = positions.reduce((a, b) => a + b) / positions.length;
        const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - avgPosition, 2), 0) / positions.length;
        
        const maxVariance = Math.pow(totalMarkers / 2, 2);
        const normalizedVariance = variance / maxVariance;
        
        // Both clustered and evenly distributed can be valid, but extreme clustering might be noise
        if (normalizedVariance < 0.1) {
            return 0.4; // Very clustered - might be repetitive phrase
        } else if (normalizedVariance > 0.9) {
            return 0.7; // Very spread out - consistent pattern
        } else {
            return 0.6; // Moderate distribution
        }
    }

    calculateConsistencyFactor(markers) {
        if (markers.length < 2) return 0.5;
        
        // Check consistency of weights and negation
        const weights = markers.map(m => m.weight);
        const avgWeight = weights.reduce((a, b) => a + b) / weights.length;
        const weightVariance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length;
        
        const negatedCount = markers.filter(m => m.negated).length;
        const negationConsistency = Math.abs(negatedCount / markers.length - 0.5) > 0.4 ? 0.7 : 0.5;
        
        // Lower variance = more consistent = higher confidence
        const weightConsistency = Math.max(0.3, 1 - (weightVariance / avgWeight));
        
        return (weightConsistency * 0.7) + (negationConsistency * 0.3);
    }

    calculateContextFactor(markers) {
        // Check if markers appear in appropriate contexts
        let contextScore = 0;
        
        markers.forEach(marker => {
            const markerInfo = this.kb.lexicon[marker.word];
            if (markerInfo && markerInfo.context_required) {
                // Would need actual context analysis - simplified for now
                contextScore += 0.6;
            } else {
                contextScore += 0.8; // No context requirement = higher base score
            }
        });
        
        return markers.length > 0 ? contextScore / markers.length : 0.5;
    }

    calculateDriverConfidence(driverData, contributingPatterns) {
        if (!driverData || contributingPatterns.length === 0) return 0;
        
        const baseProb = this.baseProbabilities.drivers[driverData.driver] || 0.2;
        
        // Factors for driver confidence:
        const patternConfidences = contributingPatterns.map(p => p.confidence || 0.5);
        const avgPatternConfidence = patternConfidences.reduce((a, b) => a + b) / patternConfidences.length;
        
        const patternCountFactor = Math.min(1, contributingPatterns.length / 3);
        const weightFactor = Math.min(1, driverData.weightedScore / 20);
        
        // Combine factors
        let confidence = baseProb;
        confidence *= (0.3 + avgPatternConfidence * 0.7); // Weighted by pattern confidence
        confidence *= (0.5 + patternCountFactor * 0.5);   // More patterns = more evidence
        confidence *= (0.4 + weightFactor * 0.6);         // Higher weights = stronger driver
        
        // Apply sigmoid
        confidence = this.sigmoid(confidence * 8 - 4);
        
        return Math.min(0.95, Math.max(0.05, confidence));
    }

    calculateConflictConfidence(conflict) {
        if (!conflict) return 0;
        
        const baseProb = 0.5; // Base probability of conflict being meaningful
        
        const factors = {
            severityFactor: Math.min(1, conflict.severity / 10),
            clarityFactor: this.calculateConflictClarity(conflict),
            evidenceFactor: this.calculateConflictEvidence(conflict)
        };
        
        let confidence = baseProb;
        confidence *= (0.3 + factors.severityFactor * 0.7);
        confidence *= (0.4 + factors.clarityFactor * 0.6);
        confidence *= (0.5 + factors.evidenceFactor * 0.5);
        
        return Math.min(0.95, confidence);
    }

    calculateConflictClarity(conflict) {
        // How clearly defined is the conflict?
        if (conflict.type === 'lexical_contradiction') {
            return conflict.distance < 10 ? 0.8 : 0.5;
        } else if (conflict.type === 'driver_conflict') {
            return 0.7;
        } else if (conflict.type === 'pattern_conflict') {
            return 0.6;
        } else if (conflict.type === 'self_negation') {
            return conflict.weight > 2 ? 0.8 : 0.4;
        }
        return 0.5;
    }

    calculateConflictEvidence(conflict) {
        // Amount of evidence supporting the conflict
        let evidenceScore = 0;
        
        if (conflict.drivers && conflict.drivers.length === 2) {
            evidenceScore += 0.4;
        }
        
        if (conflict.interpretation && conflict.interpretation.length > 20) {
            evidenceScore += 0.3;
        }
        
        if (conflict.severity && conflict.severity > 3) {
            evidenceScore += 0.3;
        }
        
        return evidenceScore;
    }

    calculateOverallConfidence(analysis) {
        const { patterns, drivers, conflicts } = analysis;
        
        // Calculate average pattern confidence
        const patternConfs = Object.values(patterns).map(p => p.confidence || 0);
        const avgPatternConf = patternConfs.length > 0 
            ? patternConfs.reduce((a, b) => a + b) / patternConfs.length 
            : 0;
        
        // Calculate average driver confidence
        const driverConfs = Object.values(drivers).map(d => d.confidence || 0);
        const avgDriverConf = driverConfs.length > 0
            ? driverConfs.reduce((a, b) => a + b) / driverConfs.length
            : 0;
        
        // Calculate conflict confidence
        const conflictConfs = (conflicts || []).map(c => this.calculateConflictConfidence(c));
        const avgConflictConf = conflictConfs.length > 0
            ? conflictConfs.reduce((a, b) => a + b) / conflictConfs.length
            : 0.5; // Neutral if no conflicts
        
        // Weighted average
        const overallConf = (
            avgPatternConf * 0.4 +
            avgDriverConf * 0.3 +
            avgConflictConf * 0.2 +
            (analysis.coherence || 0.5) * 0.1
        );
        
        return {
            overall: Math.round(overallConf * 100),
            components: {
                patterns: Math.round(avgPatternConf * 100),
                drivers: Math.round(avgDriverConf * 100),
                conflicts: Math.round(avgConflictConf * 100),
                coherence: Math.round((analysis.coherence || 0.5) * 100)
            },
            interpretation: this.interpretConfidenceLevel(overallConf)
        };
    }

    interpretConfidenceLevel(confidence) {
        if (confidence >= 0.8) {
            return {
                level: "high",
                description: "Analysis shows strong evidence with consistent patterns",
                recommendation: "Results are highly reliable for self-reflection"
            };
        } else if (confidence >= 0.6) {
            return {
                level: "moderate",
                description: "Analysis shows reasonable evidence with some patterns",
                recommendation: "Results are useful for general insight"
            };
        } else if (confidence >= 0.4) {
            return {
                level: "low",
                description: "Analysis shows weak evidence with limited patterns",
                recommendation: "Consider providing more text or different phrasing"
            };
        } else {
            return {
                level: "very low",
                description: "Insufficient evidence for meaningful analysis",
                recommendation: "Try writing more about your thoughts and feelings"
            };
        }
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    calibrateWithEvidence(pattern, evidenceCount, totalObservations) {
        // Bayesian calibration with new evidence
        const prior = this.baseProbabilities.patterns[pattern] || 0.1;
        const likelihood = evidenceCount / totalObservations;
        
        // Simplified Bayesian update
        const posterior = (prior * likelihood) / 
            ((prior * likelihood) + ((1 - prior) * (1 - likelihood)));
        
        return Math.max(0.05, Math.min(0.95, posterior));
    }

    getConfidenceBands(confidence) {
        // Calculate confidence intervals
        const marginOfError = (1 - confidence) * 0.5;
        
        return {
            lower: Math.max(0, confidence - marginOfError),
            upper: Math.min(1, confidence + marginOfError),
            margin: marginOfError
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfidenceScorer;
}
