// COGNITIVE INSIGHT ENGINE - Temporal Analysis Module
// Version 3.0 - Tracks language evolution across text segments

class TemporalAnalyzer {
    constructor(knowledgeBase) {
        this.kb = knowledgeBase;
        this.segments = 3; // beginning, middle, end
    }

    analyzeTemporalFlow(text, hits) {
        const tokens = text.toLowerCase().split(/\s+/);
        const segmentLength = Math.ceil(tokens.length / this.segments);
        
        // Initialize segment data
        const segments = {
            early: { tokens: 0, markers: [], patterns: {}, emotionalValence: [] },
            middle: { tokens: 0, markers: [], patterns: {}, emotionalValence: [] },
            late: { tokens: 0, markers: [], patterns: {}, emotionalValence: [] }
        };
        
        // Categorize hits by segment
        hits.forEach(hit => {
            const segment = this.getSegmentFromPosition(hit.position, tokens.length);
            segments[segment].markers.push(hit);
            
            // Track pattern by segment
            if (!segments[segment].patterns[hit.category]) {
                segments[segment].patterns[hit.category] = {
                    count: 0,
                    weight: 0,
                    markers: []
                };
            }
            
            segments[segment].patterns[hit.category].count++;
            segments[segment].patterns[hit.category].weight += hit.adjustedWeight;
            segments[segment].patterns[hit.category].markers.push(hit.word);
            
            // Track emotional valence
            if (hit.emotionalValence) {
                segments[segment].emotionalValence.push(hit.emotionalValence);
            }
        });
        
        // Calculate metrics per segment
        Object.keys(segments).forEach(segment => {
            const seg = segments[segment];
            seg.tokenCount = Math.ceil(tokens.length / this.segments);
            seg.markerCount = seg.markers.length;
            seg.markerDensity = seg.markerCount / seg.tokenCount;
            
            // Average emotional valence
            seg.avgValence = seg.emotionalValence.length > 0 
                ? seg.emotionalValence.reduce((a, b) => a + b) / seg.emotionalValence.length 
                : 0;
            
            // Dominant pattern
            const patternEntries = Object.entries(seg.patterns);
            if (patternEntries.length > 0) {
                patternEntries.sort((a, b) => b[1].weight - a[1].weight);
                seg.dominantPattern = {
                    pattern: patternEntries[0][0],
                    weight: patternEntries[0][1].weight,
                    count: patternEntries[0][1].count
                };
            }
        });
        
        // Analyze shifts between segments
        const shifts = this.analyzeSegmentShifts(segments);
        const narrativeArc = this.calculateNarrativeArc(segments);
        const coherence = this.calculateTemporalCoherence(segments);
        
        return {
            segments,
            shifts,
            narrativeArc,
            coherence,
            summary: this.generateTemporalSummary(segments, shifts)
        };
    }

    getSegmentFromPosition(position, totalLength) {
        const segmentSize = totalLength / this.segments;
        if (position < segmentSize) return "early";
        if (position < segmentSize * 2) return "middle";
        return "late";
    }

    analyzeSegmentShifts(segments) {
        const shifts = [];
        const segmentKeys = ["early", "middle", "late"];
        
        // Analyze pattern emergence and disappearance
        const allPatterns = new Set();
        segmentKeys.forEach(seg => {
            Object.keys(segments[seg].patterns).forEach(p => allPatterns.add(p));
        });
        
        // Track each pattern across segments
        allPatterns.forEach(pattern => {
            const patternFlow = segmentKeys.map(seg => ({
                segment: seg,
                weight: segments[seg].patterns[pattern]?.weight || 0,
                count: segments[seg].patterns[pattern]?.count || 0
            }));
            
            // Check for significant changes
            for (let i = 1; i < patternFlow.length; i++) {
                const prev = patternFlow[i - 1];
                const curr = patternFlow[i];
                
                if (prev.weight > 0 && curr.weight > 0) {
                    const change = curr.weight - prev.weight;
                    const percentChange = (change / prev.weight) * 100;
                    
                    if (Math.abs(percentChange) > 50) {
                        shifts.push({
                            pattern,
                            from: prev.segment,
                            to: curr.segment,
                            change,
                            percentChange,
                            type: percentChange > 0 ? "intensifying" : "diminishing",
                            significance: Math.abs(percentChange) / 100
                        });
                    }
                } else if (prev.weight === 0 && curr.weight > 1) {
                    // Pattern emerges
                    shifts.push({
                        pattern,
                        from: prev.segment,
                        to: curr.segment,
                        change: curr.weight,
                        percentChange: 100,
                        type: "emerging",
                        significance: 0.8
                    });
                } else if (prev.weight > 1 && curr.weight === 0) {
                    // Pattern disappears
                    shifts.push({
                        pattern,
                        from: prev.segment,
                        to: curr.segment,
                        change: -prev.weight,
                        percentChange: -100,
                        type: "disappearing",
                        significance: 0.7
                    });
                }
            }
        });
        
        return shifts.sort((a, b) => b.significance - a.significance);
    }

    calculateNarrativeArc(segments) {
        const arc = {};
        const segmentKeys = ["early", "middle", "late"];
        
        // For each pattern, determine its arc
        const allPatterns = new Set();
        segmentKeys.forEach(seg => {
            Object.keys(segments[seg].patterns).forEach(p => allPatterns.add(p));
        });
        
        allPatterns.forEach(pattern => {
            const weights = segmentKeys.map(seg => segments[seg].patterns[pattern]?.weight || 0);
            
            // Determine arc type
            if (weights[0] < weights[1] && weights[1] > weights[2]) {
                arc[pattern] = "climactic"; // Peaks in middle
            } else if (weights[0] > weights[1] && weights[1] > weights[2]) {
                arc[pattern] = "resolving"; // Decreases over time
            } else if (weights[0] < weights[1] && weights[1] < weights[2]) {
                arc[pattern] = "building"; // Increases over time
            } else if (weights[0] > weights[1] && weights[1] < weights[2]) {
                arc[pattern] = "dip_recovery"; // U-shaped
            } else if (weights[0] < weights[1] && weights[1] > weights[2] && weights[2] > 0) {
                arc[pattern] = "plateau"; // Peaks then maintains
            } else {
                arc[pattern] = "irregular";
            }
            
            // Calculate intensity trend
            const trend = weights[2] - weights[0];
            arc[`${pattern}_trend`] = trend > 0 ? "increasing" : trend < 0 ? "decreasing" : "stable";
        });
        
        return arc;
    }

    calculateTemporalCoherence(segments) {
        // Calculate how consistent patterns are across segments
        const allPatterns = new Set();
        ["early", "middle", "late"].forEach(seg => {
            Object.keys(segments[seg].patterns).forEach(p => allPatterns.add(p));
        });
        
        if (allPatterns.size === 0) return 1.0; // No patterns = perfect coherence?
        
        let consistencyScore = 0;
        
        allPatterns.forEach(pattern => {
            const presence = ["early", "middle", "late"].map(seg => 
                segments[seg].patterns[pattern] ? 1 : 0
            );
            
            // Score higher if pattern is consistently present or consistently absent
            const sum = presence.reduce((a, b) => a + b);
            if (sum === 3 || sum === 0) {
                consistencyScore += 1; // Perfect consistency
            } else if (sum === 2 || sum === 1) {
                consistencyScore += 0.3; // Some inconsistency
            }
        });
        
        const maxScore = allPatterns.size;
        return maxScore > 0 ? consistencyScore / maxScore : 1.0;
    }

    generateTemporalSummary(segments, shifts) {
        const segmentKeys = ["early", "middle", "late"];
        
        // Overall marker density
        const totalMarkers = segmentKeys.reduce((sum, seg) => sum + segments[seg].markerCount, 0);
        const totalTokens = segmentKeys.reduce((sum, seg) => sum + segments[seg].tokenCount, 0);
        const overallDensity = totalMarkers / totalTokens;
        
        let summary = `Overall cognitive marker density: ${(overallDensity * 100).toFixed(1)}%`;
        
        // Segment comparison
        const densities = segmentKeys.map(seg => ({
            segment: seg,
            density: segments[seg].markerDensity
        }));
        
        densities.sort((a, b) => b.density - a.density);
        const densestSegment = densities[0];
        const sparsestSegment = densities[densities.length - 1];
        
        summary += `\nDensest in ${densestSegment.segment} segment (${(densestSegment.density * 100).toFixed(1)}%), `;
        summary += `sparsest in ${sparsestSegment.segment} (${(sparsestSegment.density * 100).toFixed(1)}%).`;
        
        // Emotional valence trend
        const valenceTrend = segmentKeys.map(seg => segments[seg].avgValence);
        const valenceChange = valenceTrend[valenceTrend.length - 1] - valenceTrend[0];
        
        if (Math.abs(valenceChange) > 0.3) {
            summary += `\nEmotional tone ${valenceChange > 0 ? 'improves' : 'worsens'} from beginning to end.`;
        }
        
        // Pattern shifts
        if (shifts.length > 0) {
            const significantShifts = shifts.filter(s => s.significance > 0.6);
            if (significantShifts.length > 0) {
                summary += `\nNotable pattern shifts:`;
                significantShifts.slice(0, 3).forEach(shift => {
                    summary += `\n- ${shift.pattern} ${shift.type} from ${shift.from} to ${shift.to} segment`;
                });
            }
        }
        
        // Narrative arc summary
        const patternCounts = segmentKeys.map(seg => 
            Object.keys(segments[seg].patterns).length
        );
        
        if (patternCounts[1] > patternCounts[0] && patternCounts[1] > patternCounts[2]) {
            summary += `\nPattern complexity peaks in the middle segment.`;
        } else if (patternCounts[0] > patternCounts[1] && patternCounts[0] > patternCounts[2]) {
            summary += `\nMost patterns introduced early, then diminish.`;
        } else if (patternCounts[2] > patternCounts[0] && patternCounts[2] > patternCounts[1]) {
            summary += `\nPattern complexity builds toward the end.`;
        }
        
        return summary;
    }

    getPatternTrajectory(pattern, segments) {
        const weights = ["early", "middle", "late"].map(seg => 
            segments[seg].patterns[pattern]?.weight || 0
        );
        
        return {
            pattern,
            trajectory: weights,
            peakSegment: this.getPeakSegment(weights),
            stability: this.calculateTrajectoryStability(weights)
        };
    }

    getPeakSegment(weights) {
        const maxWeight = Math.max(...weights);
        const segments = ["early", "middle", "late"];
        return segments[weights.indexOf(maxWeight)];
    }

    calculateTrajectoryStability(weights) {
        if (weights.length < 2) return 1.0;
        
        const changes = [];
        for (let i = 1; i < weights.length; i++) {
            changes.push(Math.abs(weights[i] - weights[i-1]));
        }
        
        const avgChange = changes.reduce((a, b) => a + b) / changes.length;
        const maxPossibleChange = Math.max(...weights) - Math.min(...weights);
        
        return maxPossibleChange > 0 ? 1 - (avgChange / maxPossibleChange) : 1.0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemporalAnalyzer;
}