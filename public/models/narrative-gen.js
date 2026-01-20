// COGNITIVE INSIGHT ENGINE - Narrative Generation Module
// Version 3.0 - Context-aware insight generation

class NarrativeGenerator {
    constructor(knowledgeBase) {
        this.kb = knowledgeBase;
        this.templates = this.initializeTemplates();
        this.insightLevels = ['basic', 'intermediate', 'advanced', 'integrated'];
    }

    initializeTemplates() {
        return {
            pattern_insights: {
                absolutist: [
                    "Your language contains absolute terms like 'always' or 'never', which suggests a tendency toward all-or-nothing thinking.",
                    "The use of absolute language indicates a desire for certainty in situations that may naturally involve some ambiguity.",
                    "Black-and-white thinking patterns are evident, which can sometimes oversimplify complex situations."
                ],
                imperative: [
                    "You use 'should' and 'must' statements, which often reflect internalized expectations or pressures.",
                    "The presence of imperative language suggests you may be holding yourself to high or rigid standards.",
                    "'Should' statements can create unnecessary pressure; consider whether these expectations are truly yours or come from external sources."
                ],
                catastrophizing: [
                    "Language indicating catastrophic thinking suggests a tendency to anticipate the worst possible outcomes.",
                    "You describe situations in extreme terms, which might amplify anxiety about potential negative events.",
                    "Catastrophic thinking patterns can make challenges feel overwhelming; reality is often less severe than our fears."
                ],
                self_critic: [
                    "Self-critical language indicates you may be judging yourself harshly or holding yourself to perfectionistic standards.",
                    "The presence of negative self-evaluations suggests challenges with self-compassion or self-acceptance.",
                    "Harsh self-judgment can undermine confidence; consider whether you would speak this way to a friend in a similar situation."
                ],
                personalization: [
                    "You tend to take personal responsibility for events or outcomes, which might indicate a pattern of personalization.",
                    "Language suggesting things are 'your fault' may reflect an excessive sense of responsibility.",
                    "While taking responsibility is valuable, personalization can lead to unnecessary guilt when factors beyond your control are involved."
                ]
            },
            
            driver_insights: {
                control: [
                    "Your language suggests a strong need for control and predictability in your experiences.",
                    "The desire for certainty and order appears to be a significant psychological driver.",
                    "While structure can be helpful, excessive need for control can create tension when faced with life's inherent uncertainties."
                ],
                validation: [
                    "Patterns in your language indicate a significant concern with validation and acceptance from others.",
                    "You seem highly attuned to social evaluation and may derive self-worth from external approval.",
                    "The search for validation is natural, but building internal self-worth can provide more stable foundation."
                ],
                safety: [
                    "Your language reflects concerns with safety and threat avoidance as a primary psychological driver.",
                    "There appears to be a strong need for security and protection from potential harm.",
                    "While safety is important, excessive focus on threat detection can limit growth and new experiences."
                ]
            },
            
            conflict_insights: {
                driver_conflict: [
                    "You show strong needs for both {driver1} and {driver2}, which creates internal tension.",
                    "Conflicting psychological drivers suggest competing values or needs that may be difficult to reconcile simultaneously.",
                    "The tension between {driver1} and {driver2} is common and reflects the complexity of human motivation."
                ],
                lexical_contradiction: [
                    "Your language contains contradictory terms, suggesting mixed feelings or uncertainty about the situation.",
                    "The presence of opposing descriptors indicates ambivalence or complexity in your perspective.",
                    "Contradictory language often reflects nuanced thinking rather than confusion."
                ]
            },
            
            temporal_insights: {
                escalating: [
                    "This pattern intensifies as your narrative progresses, suggesting increasing concern or focus.",
                    "The escalation of {pattern} toward the end indicates this may be a primary concern.",
                    "Patterns that build over time often represent core issues or growing realizations."
                ],
                diminishing: [
                    "This pattern decreases as your narrative continues, suggesting resolution or perspective shift.",
                    "The diminishing of {pattern} may indicate processing or coming to terms with the issue.",
                    "Patterns that fade often represent issues being worked through or put in perspective."
                ],
                emerging: [
                    "This pattern appears later in your narrative, suggesting it emerged during reflection.",
                    "The emergence of {pattern} indicates developing awareness or realization.",
                    "New patterns that appear often represent insights gained through the process of expression."
                ]
            },
            
            recommendations: {
                absolutist: [
                    "Practice using more flexible language: replace 'always' with 'sometimes', 'never' with 'rarely'.",
                    "Notice when you're thinking in extremes and ask: 'What are the exceptions to this absolute statement?'",
                    "Experiment with thinking in percentages instead of absolutes: 'About 70% of the time...'"
                ],
                imperative: [
                    "Try replacing 'should' with 'could' or 'prefer' to reduce pressure.",
                    "Ask yourself: 'Whose expectations are these really? Are they reasonable?'",
                    "Practice self-compassion by considering what you would say to a friend in your situation."
                ],
                catastrophizing: [
                    "Ask: 'What's the actual probability of this worst-case scenario?'",
                    "Consider: 'What's a more realistic outcome that's still challenging but manageable?'",
                    "Practice: 'Even if the worst happened, what resources would I have to cope?'"
                ],
                self_critic: [
                    "Try writing a compassionate letter to yourself as if you were a supportive friend.",
                    "Notice your self-talk and ask: 'Would I speak this way to someone I care about?'",
                    "Practice balanced self-assessment: acknowledge both strengths and areas for growth."
                ]
            }
        };
    }

    generatePatternInsight(pattern, data, context = {}) {
        const patternInfo = this.kb.patterns[pattern];
        if (!patternInfo) return null;
        
        const templates = this.templates.pattern_insights[pattern] || 
                         [`Pattern '${pattern}' detected with weight ${data.weightedScore.toFixed(1)}.`];
        
        // Select template based on confidence
        const templateIndex = Math.min(Math.floor(data.confidence * templates.length), templates.length - 1);
        let insight = templates[templateIndex];
        
        // Add specific details
        if (data.count > 1) {
            insight += ` (appears ${data.count} times)`;
        }
        
        if (context.isNegated) {
            insight += " Note that some instances are negated, which may indicate awareness of or resistance to this pattern.";
        }
        
        return {
            type: 'pattern',
            pattern: pattern,
            name: patternInfo.name,
            insight: insight,
            confidence: data.confidence,
            recommendation: this.getRecommendation(pattern, data.weightedScore),
            clinical_correlation: patternInfo.clinical_correlation
        };
    }

    generateDriverInsight(driver, data) {
        const driverInfo = this.kb.drivers[driver];
        if (!driverInfo) return null;
        
        const templates = this.templates.driver_insights[driver] || 
                         [`Strong evidence for '${driver}' as a psychological driver.`];
        
        // Select template based on normalized score
        const score = data.normalizedScore || 0;
        const templateIndex = Math.min(Math.floor(score / 10 * templates.length), templates.length - 1);
        let insight = templates[templateIndex];
        
        // Add contributing patterns
        if (data.contributingPatterns && data.contributingPatterns.length > 0) {
            const patternNames = data.contributingPatterns
                .slice(0, 3)
                .map(p => p.patternName || p.pattern)
                .join(', ');
            insight += ` This is supported by patterns of ${patternNames}.`;
        }
        
        return {
            type: 'driver',
            driver: driver,
            name: driverInfo.name,
            insight: insight,
            score: score,
            root_need: driverInfo.root,
            healthy_expression: driverInfo.healthy_expression,
            unhealthy_expression: driverInfo.unhealthy_expression,
            therapeutic_direction: driverInfo.therapeutic_direction
        };
    }

    generateConflictInsight(conflict) {
        const templates = this.templates.conflict_insights[conflict.type] || 
                         [`Conflict detected: ${conflict.interpretation}`];
        
        let insight = templates[Math.floor(Math.random() * templates.length)];
        
        // Replace placeholders
        if (conflict.drivers) {
            insight = insight.replace('{driver1}', conflict.drivers[0])
                            .replace('{driver2}', conflict.drivers[1]);
        } else if (conflict.patterns) {
            insight = insight.replace('{pattern1}', conflict.patterns[0])
                            .replace('{pattern2}', conflict.patterns[1]);
        }
        
        return {
            type: 'conflict',
            conflict_type: conflict.type,
            insight: insight,
            severity: conflict.severity,
            recommendation: conflict.recommendation || "Explore this tension through reflective writing or discussion."
        };
    }

    generateTemporalInsight(shift) {
        const templates = this.templates.temporal_insights[shift.type] || 
                         [`Pattern '${shift.pattern}' shows temporal shift.`];
        
        let insight = templates[Math.floor(Math.random() * templates.length)];
        insight = insight.replace('{pattern}', shift.pattern);
        
        return {
            type: 'temporal',
            pattern: shift.pattern,
            insight: insight,
            change: shift.percentChange > 0 ? `+${shift.percentChange.toFixed(0)}%` : `${shift.percentChange.toFixed(0)}%`,
            from_to: `${shift.from} → ${shift.to}`,
            interpretation: shift.type
        };
    }

    generateIntegratedNarrative(analysis, level = 'intermediate') {
        const { patterns, drivers, conflicts, temporalShift, coherence } = analysis;
        
        let narrative = "";
        
        // Introduction
        narrative += this.generateIntroduction(analysis);
        narrative += "\n\n";
        
        // Primary patterns
        const primaryPatterns = Object.entries(patterns)
            .filter(([_, data]) => data.confidence > 0.5)
            .sort((a, b) => b[1].weightedScore - a[1].weightedScore)
            .slice(0, 3);
        
        if (primaryPatterns.length > 0) {
            narrative += "## Primary Cognitive Patterns\n\n";
            primaryPatterns.forEach(([pattern, data]) => {
                const insight = this.generatePatternInsight(pattern, data);
                if (insight) {
                    narrative += `- **${insight.name}**: ${insight.insight}\n`;
                }
            });
            narrative += "\n";
        }
        
        // Core drivers
        const primaryDrivers = Object.entries(drivers)
            .filter(([_, data]) => data.normalizedScore > 4)
            .sort((a, b) => b[1].normalizedScore - a[1].normalizedScore)
            .slice(0, 2);
        
        if (primaryDrivers.length > 0) {
            narrative += "## Underlying Psychological Drivers\n\n";
            primaryDrivers.forEach(([driver, data]) => {
                const insight = this.generateDriverInsight(driver, data);
                if (insight) {
                    narrative += `- **${insight.name}**: ${insight.insight}\n`;
                }
            });
            narrative += "\n";
        }
        
        // Conflicts and tensions
        if (conflicts && conflicts.length > 0) {
            const significantConflicts = conflicts
                .filter(c => c.severity > 3)
                .slice(0, 2);
            
            if (significantConflicts.length > 0) {
                narrative += "## Internal Tensions\n\n";
                significantConflicts.forEach(conflict => {
                    const insight = this.generateConflictInsight(conflict);
                    narrative += `- ${insight.insight}\n`;
                });
                narrative += "\n";
            }
        }
        
        // Temporal patterns
        if (temporalShift && temporalShift.shifts && temporalShift.shifts.length > 0) {
            const significantShifts = temporalShift.shifts
                .filter(s => s.significance > 0.6)
                .slice(0, 2);
            
            if (significantShifts.length > 0) {
                narrative += "## How Your Thinking Evolves\n\n";
                significantShifts.forEach(shift => {
                    const insight = this.generateTemporalInsight(shift);
                    narrative += `- ${insight.insight}\n`;
                });
                narrative += "\n";
            }
        }
        
        // Coherence assessment
        narrative += "## Internal Consistency\n\n";
        narrative += this.generateCoherenceInsight(coherence);
        narrative += "\n\n";
        
        // Recommendations
        narrative += "## Suggestions for Reflection\n\n";
        narrative += this.generateRecommendations(analysis);
        
        return narrative;
    }

    generateIntroduction(analysis) {
        const wordCount = analysis.metadata?.wordCount || 0;
        const markerCount = analysis.hits?.length || 0;
        const density = markerCount / Math.max(1, wordCount);
        
        let intro = `Analysis of your ${wordCount}-word text revealed ${markerCount} cognitive markers `;
        intro += `(${(density * 100).toFixed(1)}% marker density). `;
        
        if (density > 0.3) {
            intro += "Your language shows high cognitive pattern density, suggesting rich material for reflection. ";
        } else if (density > 0.1) {
            intro += "Your language shows moderate cognitive pattern density. ";
        } else {
            intro += "Your language shows relatively few cognitive markers. ";
        }
        
        const patternCount = Object.keys(analysis.patterns || {}).length;
        intro += `Overall, ${patternCount} distinct thinking patterns were identified.`;
        
        return intro;
    }

    generateCoherenceInsight(coherence) {
        if (coherence >= 0.8) {
            return "Your thinking shows high internal consistency with minimal contradictions. This suggests clarity or well-integrated perspective on the topic.";
        } else if (coherence >= 0.6) {
            return "Your thinking shows moderate consistency with some contradictions. This is common when exploring complex or emotionally charged topics.";
        } else if (coherence >= 0.4) {
            return "Your thinking shows some inconsistency with notable contradictions. This may indicate mixed feelings, uncertainty, or transitional thinking.";
        } else {
            return "Your thinking shows low internal consistency with significant contradictions. This often occurs during times of confusion, ambivalence, or cognitive dissonance.";
        }
    }

    generateRecommendations(analysis) {
        let recommendations = "";
        const { patterns, drivers } = analysis;
        
        // Get top 3 patterns by weight
        const topPatterns = Object.entries(patterns)
            .sort((a, b) => b[1].weightedScore - a[1].weightedScore)
            .slice(0, 3);
        
        topPatterns.forEach(([pattern, data], index) => {
            const rec = this.getRecommendation(pattern, data.weightedScore);
            if (rec) {
                recommendations += `${index + 1}. ${rec}\n`;
            }
        });
        
        // Add driver-specific recommendations
        const topDriver = Object.entries(drivers)
            .sort((a, b) => b[1].normalizedScore - a[1].normalizedScore)[0];
        
        if (topDriver) {
            const driverInfo = this.kb.drivers[topDriver[0]];
            if (driverInfo && driverInfo.therapeutic_direction) {
                recommendations += `\nGiven your strong need for ${driverInfo.name.toLowerCase()}, consider: ${driverInfo.therapeutic_direction}`;
            }
        }
        
        if (!recommendations) {
            recommendations = "Practice mindful awareness of your thinking patterns. Notice when cognitive distortions arise and gently challenge them with more balanced perspectives.";
        }
        
        return recommendations;
    }

    getRecommendation(pattern, weight) {
        const templates = this.templates.recommendations[pattern];
        if (!templates || templates.length === 0) {
            return `Notice when ${pattern} patterns arise and consider more balanced alternatives.`;
        }
        
        // Select based on weight
        const index = Math.min(Math.floor(weight / 5 * templates.length), templates.length - 1);
        return templates[index];
    }

    generateSummary(analysis, maxLength = 500) {
        const narrative = this.generateIntegratedNarrative(analysis, 'basic');
        if (narrative.length <= maxLength) return narrative;
        
        // Truncate intelligently
        const sentences = narrative.split(/[.!?]+/);
        let summary = "";
        let length = 0;
        
        for (const sentence of sentences) {
            if (length + sentence.length > maxLength) break;
            summary += sentence + ".";
            length += sentence.length + 1;
        }
        
        return summary.trim() + " [Summary truncated for length]";
    }

    generateForExport(analysis) {
        return {
            timestamp: new Date().toISOString(),
            version: "3.0",
            overview: this.generateIntroduction(analysis),
            detailed_analysis: this.generateIntegratedNarrative(analysis, 'advanced'),
            summary: this.generateSummary(analysis, 300),
            key_insights: this.extractKeyInsights(analysis),
            recommendations: this.generateRecommendations(analysis)
        };
    }

    extractKeyInsights(analysis) {
        const insights = [];
        const { patterns, drivers, conflicts } = analysis;
        
        // Top pattern
        const topPattern = Object.entries(patterns)
            .sort((a, b) => b[1].weightedScore - a[1].weightedScore)[0];
        
        if (topPattern) {
            insights.push({
                type: "dominant_pattern",
                pattern: topPattern[0],
                weight: topPattern[1].weightedScore,
                insight: `Most prominent thinking pattern: ${this.kb.patterns[topPattern[0]]?.name || topPattern[0]}`
            });
        }
        
        // Top driver
        const topDriver = Object.entries(drivers)
            .sort((a, b) => b[1].normalizedScore - a[1].normalizedScore)[0];
        
        if (topDriver && topDriver[1].normalizedScore > 5) {
            insights.push({
                type: "core_driver",
                driver: topDriver[0],
                score: topDriver[1].normalizedScore,
                insight: `Primary psychological need: ${this.kb.drivers[topDriver[0]]?.name || topDriver[0]}`
            });
        }
        
        // Most significant conflict
        if (conflicts && conflicts.length > 0) {
            const topConflict = conflicts.sort((a, b) => b.severity - a.severity)[0];
            insights.push({
                type: "key_tension",
                conflict_type: topConflict.type,
                severity: topConflict.severity,
                insight: `Main internal tension: ${topConflict.interpretation?.substring(0, 100)}...`
            });
        }
        
        return insights;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NarrativeGenerator;
}
