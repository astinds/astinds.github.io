// COGNITIVE INSIGHT ENGINE - Enhanced Processing Engine
// Version 3.2 - Advanced Pattern Detection & Analysis

const fs = require('fs');
const path = require('path');

class CognitiveEngine {
    constructor(knowledgeBase, options = {}) {
        this.kb = knowledgeBase;
        this.contextWindow = options.contextWindow || this.kb.context_config?.window_size || 5;
        this.temporalSegments = options.temporalSegments || 3;
        this.minConfidenceThreshold = options.minConfidence || 0.3;
        this.enableAdvancedFeatures = options.advancedFeatures !== false;
        this.cache = new Map();
        this.stats = {
            analyses: 0,
            totalMarkers: 0,
            totalWords: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        // Load sentiment analysis if available
        this.sentimentLexicon = this.loadSentimentLexicon();
        
        // Initialize advanced features
        this.initializeAdvancedFeatures();
        
        console.log(`🧠 Cognitive Engine v3.2 initialized with ${Object.keys(this.kb.lexicon).length} markers`);
    }

    // ========== INITIALIZATION ==========
    
    initializeAdvancedFeatures() {
        // Pre-process patterns for faster lookup
        this.patternLookup = new Map();
        Object.entries(this.kb.patterns).forEach(([name, pattern]) => {
            this.patternLookup.set(name, {
                ...pattern,
                markerRegex: this.createPatternRegex(pattern)
            });
        });

        // Create optimized word lookup
        this.wordLookup = new Map();
        Object.entries(this.kb.lexicon).forEach(([word, data]) => {
            this.wordLookup.set(word, data);
        });

        // Compile regex patterns for faster matching
        this.compileRegexPatterns();
    }

    compileRegexPatterns() {
        // Negation patterns
        this.negationRegex = new RegExp(
            `\\b(${this.kb.negation_patterns?.hard_negation?.join('|') || 'not|never|no|don\\'t|won\\'t|can\\'t'})\\b`,
            'gi'
        );

        // Amplifier patterns
        this.amplifierRegex = new RegExp(
            `\\b(${[
                ...(this.kb.amplifiers?.extreme || []),
                ...(this.kb.amplifiers?.moderate || []),
                ...(this.kb.amplifiers?.emotional || [])
            ].join('|')})\\b`,
            'gi'
        );

        // Diminisher patterns
        this.diminisherRegex = new RegExp(
            `\\b(${[
                ...(this.kb.diminishers?.uncertainty || []),
                ...(this.kb.diminishers?.qualification || []),
                ...(this.kb.diminishers?.minimization || [])
            ].join('|')})\\b`,
            'gi'
        );

        // Temporal patterns
        this.temporalRegex = {};
        Object.entries(this.kb.temporal_markers || {}).forEach(([type, data]) => {
            this.temporalRegex[type] = new RegExp(
                `\\b(${data.words.join('|')})\\b`,
                'gi'
            );
        });
    }

    loadSentimentLexicon() {
        try {
            // Try to load from external file, or use built-in
            const sentimentPath = path.join(__dirname, '../data/sentiment-lexicon.json');
            if (fs.existsSync(sentimentPath)) {
                const data = JSON.parse(fs.readFileSync(sentimentPath, 'utf8'));
                console.log(`📊 Loaded sentiment lexicon with ${Object.keys(data).length} words`);
                return data;
            }
        } catch (error) {
            console.log('⚠️ Could not load sentiment lexicon, using built-in');
        }

        // Built-in basic sentiment lexicon
        return {
            // Positive words
            'good': 0.7, 'great': 0.8, 'excellent': 0.9, 'happy': 0.8, 'joy': 0.9,
            'love': 0.9, 'like': 0.6, 'enjoy': 0.7, 'wonderful': 0.8, 'fantastic': 0.9,
            'amazing': 0.9, 'awesome': 0.9, 'perfect': 0.8, 'beautiful': 0.7,
            
            // Negative words
            'bad': -0.7, 'terrible': -0.9, 'horrible': -0.9, 'awful': -0.8, 'sad': -0.8,
            'angry': -0.7, 'hate': -0.9, 'dislike': -0.6, 'pain': -0.8, 'hurt': -0.7,
            'failure': -0.8, 'stupid': -0.6, 'useless': -0.7, 'worst': -0.9,
            'disaster': -0.9, 'ruined': -0.8, 'hopeless': -0.7, 'worthless': -0.7
        };
    }

    createPatternRegex(pattern) {
        const markers = pattern.markers || [];
        const subPatternMarkers = Object.values(pattern.sub_patterns || {}).flat();
        const allMarkers = [...new Set([...markers, ...subPatternMarkers])];
        
        if (allMarkers.length === 0) return null;
        
        return new RegExp(
            `\\b(${allMarkers.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
            'gi'
        );
    }

    // ========== ENHANCED TOKENIZATION ==========
    
    tokenize(text, options = {}) {
        if (!text || typeof text !== 'string') return [];
        
        const tokens = [];
        const words = text.toLowerCase()
            .replace(/[.,!?;:"'()\[\]{}<>]/g, ' $& ')
            .split(/\s+/)
            .filter(token => token.length > 0);
        
        let position = 0;
        words.forEach(word => {
            tokens.push({
                word: word,
                original: text.substring(position, position + word.length),
                position: tokens.length,
                charPosition: position,
                isPunctuation: /^[.,!?;:"'()\[\]{}<>]+$/.test(word)
            });
            position += word.length + 1; // +1 for space
        });
        
        // Add sentence boundary detection
        if (options.detectSentences) {
            this.addSentenceBoundaries(tokens, text);
        }
        
        return tokens;
    }

    addSentenceBoundaries(tokens, originalText) {
        let inSentence = false;
        let sentenceStart = 0;
        let sentenceIndex = 0;
        
        tokens.forEach((token, index) => {
            if (!inSentence) {
                inSentence = true;
                sentenceStart = index;
            }
            
            // Check for sentence end
            if (/[.!?]/.test(token.word)) {
                // Mark this and previous tokens as part of sentence
                for (let i = sentenceStart; i <= index; i++) {
                    tokens[i].sentenceIndex = sentenceIndex;
                    tokens[i].sentencePosition = i - sentenceStart;
                }
                
                // Mark next token as new sentence start
                if (index + 1 < tokens.length) {
                    sentenceStart = index + 1;
                    sentenceIndex++;
                }
                inSentence = false;
            }
        });
        
        // Handle remaining tokens
        if (inSentence) {
            for (let i = sentenceStart; i < tokens.length; i++) {
                tokens[i].sentenceIndex = sentenceIndex;
                tokens[i].sentencePosition = i - sentenceStart;
            }
        }
    }

    // ========== ADVANCED NEGATION DETECTION ==========
    
    detectNegationAdvanced(context, tokenIndex, tokens) {
        const negationTypes = {
            hard: { words: this.kb.negation_patterns?.hard_negation || [], strength: 1.0 },
            soft: { words: this.kb.negation_patterns?.soft_negation || [], strength: 0.6 },
            conditional: { words: this.kb.negation_patterns?.conditional_negation || [], strength: 0.3 }
        };
        
        let bestNegation = { isNegated: false, type: "none", strength: 0, negator: null, distance: Infinity };
        
        // Check context window
        for (let i = Math.max(0, tokenIndex - 5); i < tokenIndex; i++) {
            const word = tokens[i]?.word.toLowerCase();
            
            for (const [type, data] of Object.entries(negationTypes)) {
                if (data.words.includes(word)) {
                    const distance = tokenIndex - i;
                    const effectiveness = data.strength * (1 - (distance / 6)); // Decay over distance
                    
                    if (effectiveness > bestNegation.strength) {
                        bestNegation = {
                            isNegated: true,
                            type: type,
                            strength: effectiveness,
                            negator: word,
                            distance: distance
                        };
                    }
                }
            }
        }
        
        // Check for double negatives
        if (bestNegation.isNegated) {
            let doubleNegationCount = 0;
            for (let i = Math.max(0, tokenIndex - 3); i < tokenIndex; i++) {
                const word = tokens[i]?.word.toLowerCase();
                if (negationTypes.hard.words.includes(word)) {
                    doubleNegationCount++;
                }
            }
            
            if (doubleNegationCount > 1 && doubleNegationCount % 2 === 0) {
                // Even number of negatives cancels out
                bestNegation.isNegated = false;
                bestNegation.strength = 0;
                bestNegation.type = "double_negative";
            }
        }
        
        return bestNegation;
    }

    // ========== ENHANCED MODIFIER ANALYSIS ==========
    
    analyzeModifiersAdvanced(context, tokenIndex, tokens) {
        let multiplier = 1.0;
        const modifiers = [];
        const intensifiers = [];
        const diminishers = [];
        
        // Check preceding context for modifiers
        for (let i = Math.max(0, tokenIndex - 3); i < tokenIndex; i++) {
            const word = tokens[i]?.word.toLowerCase();
            const distance = tokenIndex - i;
            const distanceWeight = Math.max(0.5, 1.0 - (distance * 0.2));
            
            // Check amplifiers
            if (this.kb.amplifiers?.extreme?.includes(word)) {
                multiplier += 0.5 * distanceWeight;
                intensifiers.push({ word, type: 'extreme', distance });
            } else if (this.kb.amplifiers?.moderate?.includes(word)) {
                multiplier += 0.3 * distanceWeight;
                intensifiers.push({ word, type: 'moderate', distance });
            } else if (this.kb.amplifiers?.emotional?.includes(word)) {
                multiplier += 0.4 * distanceWeight;
                intensifiers.push({ word, type: 'emotional', distance });
            }
            
            // Check diminishers
            if (this.kb.diminishers?.uncertainty?.includes(word)) {
                multiplier -= 0.4 * distanceWeight;
                diminishers.push({ word, type: 'uncertainty', distance });
            } else if (this.kb.diminishers?.qualification?.includes(word)) {
                multiplier -= 0.3 * distanceWeight;
                diminishers.push({ word, type: 'qualification', distance });
            } else if (this.kb.diminishers?.minimization?.includes(word)) {
                multiplier -= 0.2 * distanceWeight;
                diminishers.push({ word, type: 'minimization', distance });
            }
        }
        
        // Handle conflicting modifiers
        if (intensifiers.length > 0 && diminishers.length > 0) {
            // Reduce effect when conflicting modifiers present
            const conflictFactor = Math.min(intensifiers.length, diminishers.length) * 0.2;
            multiplier *= (1 - conflictFactor);
            modifiers.push({ type: 'conflict', factor: conflictFactor });
        }
        
        // Clamp multiplier
        multiplier = Math.max(0.1, Math.min(3.0, multiplier));
        
        return {
            multiplier,
            intensifiers,
            diminishers,
            modifiers,
            hasIntensifiers: intensifiers.length > 0,
            hasDiminishers: diminishers.length > 0,
            hasConflict: intensifiers.length > 0 && diminishers.length > 0
        };
    }

    // ========== SENTIMENT ANALYSIS ==========
    
    analyzeSentiment(text, hits) {
        const words = text.toLowerCase().split(/\s+/);
        let totalSentiment = 0;
        let sentimentWords = 0;
        const wordSentiments = [];
        
        words.forEach((word, index) => {
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            const sentiment = this.sentimentLexicon[cleanWord];
            
            if (sentiment !== undefined) {
                totalSentiment += sentiment;
                sentimentWords++;
                wordSentiments.push({
                    word: word,
                    sentiment: sentiment,
                    position: index,
                    category: sentiment > 0 ? 'positive' : 'negative'
                });
            }
        });
        
        const averageSentiment = sentimentWords > 0 ? totalSentiment / sentimentWords : 0;
        
        // Calculate sentiment density
        const sentimentDensity = sentimentWords / words.length;
        
        // Determine overall sentiment
        let overallSentiment = 'neutral';
        if (averageSentiment > 0.3) overallSentiment = 'positive';
        else if (averageSentiment < -0.3) overallSentiment = 'negative';
        else if (Math.abs(averageSentiment) > 0.1) overallSentiment = 'mixed';
        
        // Combine with cognitive markers sentiment
        const markerSentiment = this.calculateMarkerSentiment(hits);
        const combinedSentiment = this.combineSentiments(averageSentiment, markerSentiment);
        
        return {
            average: averageSentiment,
            overall: overallSentiment,
            combined: combinedSentiment,
            density: sentimentDensity,
            wordCount: words.length,
            sentimentWordCount: sentimentWords,
            wordSentiments: wordSentiments,
            markerSentiment: markerSentiment,
            intensity: Math.abs(combinedSentiment)
        };
    }

    calculateMarkerSentiment(hits) {
        if (!hits || hits.length === 0) return 0;
        
        const total = hits.reduce((sum, hit) => {
            const weight = hit.adjustedWeight || hit.baseWeight || 1;
            const valence = hit.emotionalValence || 0;
            return sum + (valence * weight);
        }, 0);
        
        const totalWeight = hits.reduce((sum, hit) => {
            return sum + (hit.adjustedWeight || hit.baseWeight || 1);
        }, 0);
        
        return totalWeight > 0 ? total / totalWeight : 0;
    }

    combineSentiments(textSentiment, markerSentiment) {
        // Weight marker sentiment higher as it's more specific
        const markerWeight = 0.7;
        const textWeight = 0.3;
        
        return (markerSentiment * markerWeight) + (textSentiment * textWeight);
    }

    // ========== ENHANCED PATTERN DETECTION ==========
    
    detectPatternClusters(hits) {
        if (!hits || hits.length < 2) return [];
        
        const clusters = [];
        let currentCluster = [];
        const clusterThreshold = 5; // Max distance between markers in a cluster
        
        // Sort hits by position
        const sortedHits = [...hits].sort((a, b) => a.position - b.position);
        
        for (let i = 0; i < sortedHits.length; i++) {
            if (currentCluster.length === 0) {
                currentCluster.push(sortedHits[i]);
            } else {
                const lastHit = currentCluster[currentCluster.length - 1];
                const distance = sortedHits[i].position - lastHit.position;
                
                if (distance <= clusterThreshold) {
                    currentCluster.push(sortedHits[i]);
                } else {
                    if (currentCluster.length >= 2) {
                        clusters.push([...currentCluster]);
                    }
                    currentCluster = [sortedHits[i]];
                }
            }
        }
        
        // Add final cluster
        if (currentCluster.length >= 2) {
            clusters.push(currentCluster);
        }
        
        return clusters.map((cluster, index) => ({
            id: `cluster-${index}`,
            markers: cluster,
            size: cluster.length,
            patterns: this.analyzeClusterPatterns(cluster),
            density: cluster.length / (cluster[cluster.length - 1].position - cluster[0].position + 1),
            startPosition: cluster[0].position,
            endPosition: cluster[cluster.length - 1].position
        }));
    }

    analyzeClusterPatterns(cluster) {
        const patternCounts = {};
        cluster.forEach(hit => {
            if (hit.category) {
                patternCounts[hit.category] = (patternCounts[hit.category] || 0) + 1;
            }
        });
        
        const dominantPattern = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])[0];
        
        return {
            counts: patternCounts,
            dominant: dominantPattern ? { pattern: dominantPattern[0], count: dominantPattern[1] } : null,
            diversity: Object.keys(patternCounts).length
        };
    }

    // ========== ENHANCED CONTEXT EXTRACTION ==========
    
    extractEnhancedContext(tokens, index) {
        const windowSize = this.contextWindow;
        const start = Math.max(0, index - windowSize);
        const end = Math.min(tokens.length, index + windowSize + 1);
        
        const contextTokens = tokens.slice(start, end);
        
        // Extract sentence context if available
        let sentenceContext = null;
        if (tokens[index]?.sentenceIndex !== undefined) {
            const sentenceTokens = tokens.filter(t => 
                t.sentenceIndex === tokens[index].sentenceIndex
            );
            sentenceContext = {
                sentenceIndex: tokens[index].sentenceIndex,
                positionInSentence: tokens[index].sentencePosition,
                tokens: sentenceTokens.map(t => t.word),
                fullSentence: sentenceTokens.map(t => t.original).join(' ')
            };
        }
        
        // Analyze context sentiment
        const contextText = contextTokens.map(t => t.word).join(' ');
        const contextSentiment = this.quickSentimentAnalysis(contextText);
        
        return {
            preceding: tokens.slice(start, index).map(t => t.word),
            following: tokens.slice(index + 1, end).map(t => t.word),
            fullWindow: contextTokens.map(t => t.word),
            positionInWindow: index - start,
            tokens: contextTokens,
            sentence: sentenceContext,
            sentiment: contextSentiment,
            hasQuestion: contextTokens.some(t => t.word.includes('?')),
            hasExclamation: contextTokens.some(t => t.word.includes('!'))
        };
    }

    quickSentimentAnalysis(text) {
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        let count = 0;
        
        words.forEach(word => {
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            const sentiment = this.sentimentLexicon[cleanWord];
            if (sentiment !== undefined) {
                score += sentiment;
                count++;
            }
        });
        
        return {
            score: count > 0 ? score / count : 0,
            wordCount: count,
            hasSentiment: count > 0
        };
    }

    // ========== CACHE SYSTEM ==========
    
    getCacheKey(text, options = {}) {
        // Create a hash of text and options for caching
        const textHash = this.simpleHash(text);
        const optionsHash = this.simpleHash(JSON.stringify(options));
        return `${textHash}-${optionsHash}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }
        this.stats.cacheMisses++;
        return null;
    }

    setToCache(key, analysis) {
        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, analysis);
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    // ========== ENHANCED ANALYSIS PIPELINE ==========
    
    parseTextWithEnhancements(text) {
        const tokens = this.tokenize(text, { detectSentences: true });
        const hits = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.isPunctuation) continue;
            
            const marker = this.wordLookup.get(token.word);
            if (!marker) continue;
            
            const context = this.extractEnhancedContext(tokens, i);
            const negationState = this.detectNegationAdvanced(context, i, tokens);
            const modifierEffect = this.analyzeModifiersAdvanced(context, i, tokens);
            const semanticContext = this.matchSemanticPattern(token.word, context);
            
            const adjustedWeight = this.calculateAdjustedWeight(
                marker.weight,
                negationState,
                modifierEffect,
                semanticContext
            );
            
            if (adjustedWeight > 0.3) {
                const hit = {
                    word: token.word,
                    originalWord: token.original,
                    position: i,
                    charPosition: token.charPosition,
                    category: marker.category,
                    subcategory: marker.subcategory,
                    baseWeight: marker.weight,
                    adjustedWeight: adjustedWeight,
                    isNegated: negationState.isNegated,
                    negationType: negationState.type,
                    negationStrength: negationState.strength,
                    modifierEffect: modifierEffect.multiplier,
                    intensifiers: modifierEffect.intensifiers,
                    diminishers: modifierEffect.diminishers,
                    hasModifierConflict: modifierEffect.hasConflict,
                    context: {
                        preceding: context.preceding,
                        following: context.following,
                        sentence: context.sentence
                    },
                    semanticContext: semanticContext.contextPattern,
                    temporalSegment: this.getTemporalSegment(i, tokens.length),
                    emotionalValence: marker.emotional_valence || 0,
                    clinicalNote: marker.clinical_note,
                    token: token
                };
                
                hits.push(hit);
            }
        }
        
        return hits;
    }

    // ========== ENHANCED PATTERN AGGREGATION ==========
    
    aggregatePatternsWithClusters(hits) {
        const patternScores = {};
        const temporalDistribution = { early: {}, middle: {}, late: {} };
        const subpatternDistribution = {};
        const clusters = this.detectPatternClusters(hits);
        
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
                    markers: [],
                    clusters: []
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
                negated: hit.isNegated,
                position: hit.position
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
        
        // Add cluster information
        clusters.forEach(cluster => {
            cluster.patterns.counts.forEach((count, pattern) => {
                if (patternScores[pattern]) {
                    if (!patternScores[pattern].clusters) {
                        patternScores[pattern].clusters = [];
                    }
                    patternScores[pattern].clusters.push({
                        id: cluster.id,
                        size: cluster.size,
                        density: cluster.density,
                        markers: cluster.markers.length
                    });
                }
            });
        });
        
        // Calculate enhanced confidence scores
        Object.keys(patternScores).forEach(category => {
            const data = patternScores[category];
            
            // Average emotional valence
            data.avgValence = data.emotionalValence.length > 0 
                ? data.emotionalValence.reduce((a, b) => a + b) / data.emotionalValence.length 
                : 0;
            
            // Enhanced confidence calculation
            const countFactor = Math.min(data.count / 5, 1);
            const weightFactor = data.weightedScore / (data.count * 5);
            const distributionFactor = this.calculateEnhancedDistributionScore(data.positions, hits.length);
            const clusterFactor = data.clusters ? Math.min(data.clusters.length / 3, 1) : 0;
            const negationFactor = 1 - (data.markers.filter(m => m.negated).length / data.markers.length * 0.5);
            
            data.confidence = (
                countFactor * 0.25 +
                weightFactor * 0.25 +
                distributionFactor * 0.2 +
                clusterFactor * 0.2 +
                negationFactor * 0.1
            );
            
            // Apply pattern-specific multipliers
            const pattern = this.kb.patterns[category];
            if (pattern) {
                data.confidence *= (pattern.weight_multiplier || 1.0);
                data.severity = data.weightedScore >= (pattern.severity_threshold || 2);
                data.patternInfo = pattern;
            }
            
            // Calculate intensity
            data.intensity = this.calculatePatternIntensity(data);
        });
        
        return { 
            patternScores, 
            temporalDistribution, 
            subpatternDistribution,
            clusters 
        };
    }

    calculateEnhancedDistributionScore(positions, totalLength) {
        if (positions.length < 2) return 0.5;
        
        // Calculate weighted distribution considering clusters
        const gaps = [];
        for (let i = 1; i < positions.length; i++) {
            gaps.push(positions[i] - positions[i-1]);
        }
        
        const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
        const idealGap = totalLength / positions.length;
        
        // Score based on distribution pattern
        const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
        const clusteringScore = variance < (idealGap * 0.5) ? 0.3 : 0.7; // Lower for clustered, higher for spread
        
        return Math.max(0.1, clusteringScore);
    }

    calculatePatternIntensity(patternData) {
        const weightIntensity = Math.min(1, patternData.weightedScore / 20);
        const countIntensity = Math.min(1, patternData.count / 10);
        const valenceIntensity = Math.abs(patternData.avgValence);
        const clusterIntensity = patternData.clusters ? Math.min(1, patternData.clusters.length / 3) : 0;
        
        return (weightIntensity * 0.4 + 
                countIntensity * 0.3 + 
                valenceIntensity * 0.2 + 
                clusterIntensity * 0.1);
    }

    // ========== ENHANCED DRIVER INFERENCE ==========
    
    inferDriversWithConfidence(patternScores) {
        const driverScores = {};
        const driverContributions = {};
        
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
                    conflicts: [],
                    intensity: 0
                };
                driverContributions[driver] = [];
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
                markers: patternData.markers,
                intensity: patternData.intensity
            });
            
            driverContributions[driver].push({
                pattern: category,
                contribution: driverContribution,
                confidence: patternData.confidence
            });
            
            // Update confidence (weighted average)
            driverScores[driver].confidence = Math.max(
                driverScores[driver].confidence,
                patternData.confidence
            );
            
            // Add pattern manifestations
            if (pattern.manifestations) {
                driverScores[driver].manifestations.push(...pattern.manifestations);
            }
        });
        
        // Calculate normalized scores and intensity
        Object.keys(driverScores).forEach(driver => {
            const data = driverScores[driver];
            data.normalizedScore = Math.min(10, data.weightedScore / 5);
            data.primary = data.normalizedScore >= 5;
            
            // Calculate driver intensity
            const contributionIntensity = Math.min(1, data.weightedScore / 30);
            const patternIntensity = data.contributingPatterns.reduce((sum, p) => sum + p.intensity, 0) / data.contributingPatterns.length;
            data.intensity = (contributionIntensity * 0.6 + patternIntensity * 0.4);
            
            // Get driver info from knowledge base
            const driverInfo = this.kb.drivers[driver];
            if (driverInfo) {
                data.name = driverInfo.name;
                data.insight = driverInfo.insight;
                data.therapeuticDirection = driverInfo.therapeutic_direction;
                data.conflicts = driverInfo.conflicts_with || [];
                data.healthyExpression = driverInfo.healthy_expression;
                data.unhealthyExpression = driverInfo.unhealthy_expression;
            }
        });
        
        // Sort contributing patterns by contribution
        Object.keys(driverScores).forEach(driver => {
            driverScores[driver].contributingPatterns.sort((a, b) => b.contribution - a.contribution);
        });
        
        return driverScores;
    }

    // ========== ENHANCED CONFLICT DETECTION ==========
    
    detectEnhancedConflicts(driverScores, patternScores, hits) {
        const conflicts = [];
        
        // 1. Driver-level conflicts
        const drivers = Object.keys(driverScores);
        for (let i = 0; i < drivers.length; i++) {
            for (let j = i + 1; j < drivers.length; j++) {
                const d1 = drivers[i];
                const d2 = drivers[j];
                
                const d1Info = this.kb.drivers[d1];
                const d2Info = this.kb.drivers[d2];
                
                if (d1Info && d2Info && d1Info.conflicts_with && d1Info.conflicts_with.includes(d2)) {
                    const d1Score = driverScores[d1].normalizedScore;
                    const d2Score = driverScores[d2].normalizedScore;
                    
                    if (d1Score > 3 && d2Score > 3) {
                        const severity = (d1Score + d2Score) / 20; // 0-1 scale
                        
                        conflicts.push({
                            type: "driver_conflict",
                            drivers: [d1, d2],
                            driverNames: [d1Info.name, d2Info.name],
                            scores: [d1Score, d2Score],
                            severity: severity,
                            intensity: Math.min(d1Score, d2Score) / 10,
                            interpretation: `Strong tension between need for ${d1Info.name} (score: ${d1Score.toFixed(1)}) and ${d2Info.name} (score: ${d2Score.toFixed(1)}). This may cause internal conflict or decision paralysis.`,
                            recommendation: "Explore integration through dialectical thinking or mindfulness practices."
                        });
                    }
                }
            }
        }
        
        // 2. Pattern-level conflicts from lexicon
        hits.forEach((hit, i) => {
            const marker = this.kb.lexicon[hit.word];
            if (!marker || !marker.contradicts) return;
            
            for (let j = i + 1; j < Math.min(i + 10, hits.length); j++) {
                const otherHit = hits[j];
                if (marker.contradicts.includes(otherHit.word)) {
                    const distance = otherHit.position - hit.position;
                    const distanceFactor = Math.max(0, 1 - (distance / 20));
                    
                    conflicts.push({
                        type: "lexical_contradiction",
                        words: [hit.word, otherHit.word],
                        categories: [hit.category, otherHit.category],
                        positions: [hit.position, otherHit.position],
                        distance: distance,
                        distanceFactor: distanceFactor,
                        severity: (hit.adjustedWeight + otherHit.adjustedWeight) * distanceFactor * 0.3,
                        interpretation: `Contradictory language: "${hit.originalWord}" (${hit.category}) vs "${otherHit.originalWord}" (${otherHit.category})`,
                        recommendation: "This may indicate mixed feelings or uncertainty about the topic."
                    });
                }
            }
        });
        
        // 3. Self-negation conflicts
        hits.forEach(hit => {
            if (hit.isNegated && hit.adjustedWeight > 2) {
                conflicts.push({
                    type: "self_negation",
                    word: hit.word,
                    category: hit.category,
                    position: hit.position,
                    weight: hit.adjustedWeight,
                    severity: hit.adjustedWeight * 0.2,
                    interpretation: "Strong negation of significant cognitive marker. May indicate defensive response or underlying belief.",
                    recommendation: "Explore what emotions arise when considering the non-negated version."
                });
            }
        });
        
        // 4. Modifier conflicts
        hits.forEach(hit => {
            if (hit.hasModifierConflict) {
                conflicts.push({
                    type: "modifier_conflict",
                    word: hit.word,
                    category: hit.category,
                    severity: hit.adjustedWeight * 0.15,
                    interpretation: "Conflicting intensity modifiers suggest uncertainty about emotional expression.",
                    recommendation: "Notice when language both amplifies and diminishes intensity."
                });
            }
        });
        
        return conflicts.sort((a, b) => b.severity - a.severity);
    }

    // ========== MAIN ANALYSIS FUNCTION ==========
    
    analyze(text, options = {}) {
        const startTime = Date.now();
        const cacheKey = options.cache !== false ? this.getCacheKey(text, options) : null;
        
        // Check cache
        if (cacheKey) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`⚡ Using cached analysis (${this.stats.cacheHits} hits)`);
                return cached;
            }
        }
        
        console.log(`🔍 Starting analysis of ${text.length} characters...`);
        
        // Enhanced parsing
        const hits = this.parseTextWithEnhancements(text);
        console.log(`📊 Found ${hits.length} cognitive markers`);
        
        // Enhanced pattern aggregation
        const { patternScores, temporalDistribution, subpatternDistribution, clusters } = 
            this.aggregatePatternsWithClusters(hits);
        console.log(`🎯 Patterns detected: ${Object.keys(patternScores).length}`);
        
        // Enhanced driver inference
        const driverScores = this.inferDriversWithConfidence(patternScores);
        console.log(`🚀 Drivers inferred: ${Object.keys(driverScores).length}`);
        
        // Enhanced conflict detection
        const conflicts = this.detectEnhancedConflicts(driverScores, patternScores, hits);
        console.log(`⚡ Conflicts detected: ${conflicts.length}`);
        
        // Temporal analysis
        const temporalShift = this.analyzeTemporalShift(temporalDistribution);
        
        // Sentiment analysis
        const sentiment = this.enableAdvancedFeatures ? 
            this.analyzeSentiment(text, hits) : 
            { average: 0, overall: 'neutral', intensity: 0 };
        
        // Coherence calculation
        const coherenceScore = this.calculateEnhancedCoherence(hits, conflicts, clusters);
        
        // Generate insights
        const insights = this.generateEnhancedInsights(
            patternScores, 
            driverScores, 
            conflicts, 
            temporalShift,
            sentiment
        );
        
        const processingTime = Date.now() - startTime;
        
        const analysis = {
            hits: hits,
            patterns: patternScores,
            drivers: driverScores,
            conflicts: conflicts,
            temporalShift: temporalShift,
            sentiment: sentiment,
            clusters: clusters,
            coherence: coherenceScore,
            insights: insights,
            metadata: {
                wordCount: text.split(/\s+/).length,
                markerCount: hits.length,
                markerDensity: hits.length / text.split(/\s+/).length,
                avgConfidence: this.calculateAvgConfidence(patternScores),
                processingTime: processingTime,
                analysisTimestamp: new Date().toISOString(),
                engineVersion: "3.2",
                cacheKey: cacheKey,
                options: options
            }
        };
        
        // Update statistics
        this.stats.analyses++;
        this.stats.totalMarkers += hits.length;
        this.stats.totalWords += analysis.metadata.wordCount;
        
        // Cache the analysis
        if (cacheKey) {
            this.setToCache(cacheKey, analysis);
        }
        
        console.log(`✅ Analysis completed in ${processingTime}ms`);
        
        return analysis;
    }

    // ========== ENHANCED COHERENCE CALCULATION ==========
    
    calculateEnhancedCoherence(hits, conflicts, clusters) {
        const baseCoherence = 0.7;
        
        // Conflict penalty
        const conflictPenalty = conflicts.reduce((sum, conflict) => 
            sum + (conflict.severity || 0.5), 0) * 0.1;
        
        // Cluster bonus (clusters show coherent thinking)
        const clusterBonus = clusters ? Math.min(0.2, clusters.length * 0.05) : 0;
        
        // Marker distribution bonus
        const distributionBonus = this.calculateDistributionBonus(hits);
        
        // Sentiment consistency bonus (if sentiment analysis is enabled)
        const sentimentBonus = 0; // Could be calculated from sentiment analysis
        
        return Math.max(0.1, Math.min(1, 
            baseCoherence - conflictPenalty + clusterBonus + distributionBonus + sentimentBonus
        ));
    }

    calculateDistributionBonus(hits) {
        if (hits.length < 3) return 0;
        
        const positions = hits.map(h => h.position);
        const spread = Math.max(...positions) - Math.min(...positions);
        const density = hits.length / spread;
        
        // Moderate density is best (neither too clustered nor too sparse)
        const optimalDensity = 0.3;
        const densityScore = 1 - Math.min(1, Math.abs(density - optimalDensity) / optimalDensity);
        
        return densityScore * 0.1;
    }

    // ========== ENHANCED INSIGHT GENERATION ==========
    
    generateEnhancedInsights(patternScores, driverScores, conflicts, temporalShift, sentiment) {
        const insights = [];
        
        // 1. Primary pattern insight
        const primaryPatterns = Object.keys(patternScores)
            .filter(p => patternScores[p].confidence > this.minConfidenceThreshold)
            .sort((a, b) => patternScores[b].weightedScore - patternScores[a].weightedScore);
        
        if (primaryPatterns.length > 0) {
            const primary = primaryPatterns[0];
            const patternInfo = this.kb.patterns[primary];
            const data = patternScores[primary];
            
            insights.push({
                type: "primary_pattern",
                pattern: primary,
                name: patternInfo?.name || primary,
                confidence: data.confidence,
                intensity: data.intensity,
                description: patternInfo?.clinical_correlation || "Significant cognitive pattern detected.",
                markers: data.count,
                clusters: data.clusters?.length || 0,
                recommendation: patternInfo?.mitigation_strategy || "Consider awareness of this thinking pattern."
            });
        }
        
        // 2. Primary driver insight
        const primaryDrivers = Object.keys(driverScores)
            .filter(d => driverScores[d].normalizedScore >= 4)
            .sort((a, b) => driverScores[b].normalizedScore - driverScores[a].normalizedScore);
        
        if (primaryDrivers.length > 0) {
            const primary = primaryDrivers[0];
            const data = driverScores[primary];
            
            insights.push({
                type: "primary_driver",
                driver: primary,
                name: data.name || primary,
                score: data.normalizedScore,
                intensity: data.intensity,
                insight: data.insight || "Core psychological need detected.",
                patterns: data.contributingPatterns.length,
                therapeuticDirection: data.therapeuticDirection || "Explore this need in context."
            });
        }
        
        // 3. Sentiment insight
        if (sentiment && sentiment.intensity > 0.2) {
            insights.push({
                type: "sentiment_insight",
                overall: sentiment.overall,
                intensity: sentiment.intensity,
                sentimentScore: sentiment.combined,
                interpretation: `Language shows ${sentiment.overall} emotional tone with ${(sentiment.intensity * 100).toFixed(0)}% intensity.`,
                recommendation: sentiment.overall === 'negative' ? 
                    "Consider balancing negative statements with neutral or positive perspectives." :
                    "Acknowledge positive emotions while maintaining realistic perspective."
            });
        }
        
        // 4. Conflict insight
        if (conflicts.length > 0) {
            const primaryConflict = conflicts[0];
            
            insights.push({
                type: "conflict_insight",
                conflictType: primaryConflict.type,
                severity: primaryConflict.severity,
                interpretation: primaryConflict.interpretation,
                recommendation: primaryConflict.recommendation || "Explore this tension through reflection."
            });
        }
        
        // 5. Temporal insight
        if (temporalShift && temporalShift.shifts && temporalShift.shifts.length > 0) {
            const significantShift = temporalShift.shifts
                .sort((a, b) => b.intensity - a.intensity)[0];
            
            insights.push({
                type: "temporal_insight",
                pattern: significantShift.pattern,
                shift: significantShift.interpretation,
                fromTo: `${significantShift.from} → ${significantShift.to}`,
                change: significantShift.percentChange.toFixed(0) + '%',
                interpretation: `Pattern ${significantShift.interpretation} as narrative progresses.`
            });
        }
        
        // 6. Cluster insight
        const patternEntries = Object.entries(patternScores);
        const clusteredPatterns = patternEntries.filter(([_, data]) => 
            data.clusters && data.clusters.length > 0
        );
        
        if (clusteredPatterns.length > 0) {
            const mostClustered = clusteredPatterns.sort((a, b) => 
                b[1].clusters.length - a[1].clusters.length
            )[0];
            
            insights.push({
                type: "cluster_insight",
                pattern: mostClustered[0],
                clusterCount: mostClustered[1].clusters.length,
                interpretation: `Pattern appears in ${mostClustered[1].clusters.length} distinct clusters, suggesting recurring theme.`,
                recommendation: "Notice when this pattern emerges in your thinking."
            });
        }
        
        return insights;
    }

    // ========== HELPER METHODS (from original) ==========
    
    matchSemanticPattern(token, context) {
        const marker = this.wordLookup.get(token);
        if (!marker) return { match: false };
        
        if (marker.context_required && marker.valid_contexts) {
            const fullContext = context.fullWindow.join('_');
            const precedingContext = context.preceding.join('_');
            
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
        
        return { 
            match: true,
            contextPattern: "general",
            contextWeight: marker.weight
        };
    }

    calculateAdjustedWeight(baseWeight, negationState, modifierEffect, semanticContext) {
        if (!semanticContext.match) return 0;
        
        let adjustedWeight = semanticContext.contextWeight || baseWeight;
        
        if (negationState.isNegated) {
            adjustedWeight *= (1 - negationState.strength);
        }
        
        adjustedWeight *= modifierEffect.multiplier;
        
        return Math.max(0.1, adjustedWeight);
    }

    getTemporalSegment(position, totalLength) {
        const segmentSize = totalLength / this.temporalSegments;
        if (position < segmentSize) return "early";
        if (position < segmentSize * 2) return "middle";
        return "late";
    }

    analyzeTemporalShift(temporalDistribution) {
        const shifts = [];
        const segments = ["early", "middle", "late"];
        
        segments.forEach((seg, idx) => {
            if (idx === 0) return;
            
            const prev = segments[idx - 1];
            const categories = new Set([
                ...Object.keys(temporalDistribution[prev] || {}),
                ...Object.keys(temporalDistribution[seg] || {})
            ]);
            
            categories.forEach(cat => {
                const prevScore = temporalDistribution[prev][cat] || 0;
                const currScore = temporalDistribution[seg][cat] || 0;
                const change = currScore - prevScore;
                
                if (Math.abs(change) > 1) {
                    shifts.push({
                        category: cat,
                        from: prev,
                        to: seg,
                        change: change,
                        percentChange: prevScore > 0 ? (change / prevScore) * 100 : 100,
                        interpretation: change > 0 ? "escalating" : "diminishing",
                        intensity: Math.abs(change) / Math.max(prevScore, 1)
                    });
                }
            });
        });
        
        return {
            shifts: shifts,
            summary: this.generateTemporalSummary(shifts)
        };
    }

    generateTemporalSummary(shifts) {
        if (shifts.length === 0) return "Patterns remain stable throughout.";
        
        const escalating = shifts.filter(s => s.interpretation === "escalating");
        const diminishing = shifts.filter(s => s.interpretation === "diminishing");
        
        let summary = "";
        
        if (escalating.length > 0) {
            summary += `${escalating.length} pattern(s) escalate, `;
        }
        if (diminishing.length > 0) {
            summary += `${diminishing.length} pattern(s) diminish. `;
        }
        
        const strongestShift = shifts.sort((a, b) => b.intensity - a.intensity)[0];
        if (strongestShift) {
            summary += `Strongest shift: ${strongestShift.category} ${strongestShift.interpretation} by ${Math.abs(strongestShift.percentChange).toFixed(0)}%.`;
        }
        
        return summary;
    }

    calculateAvgConfidence(patternScores) {
        const patterns = Object.keys(patternScores);
        if (patterns.length === 0) return 0;
        
        const totalConfidence = patterns.reduce((sum, pattern) => {
            return sum + (patternScores[pattern].confidence || 0);
        }, 0);
        
        return totalConfidence / patterns.length;
    }

    // ========== UTILITY METHODS ==========
    
    getStatistics() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            lexiconSize: Object.keys(this.kb.lexicon).length,
            patternCount: Object.keys(this.kb.patterns).length,
            driverCount: Object.keys(this.kb.drivers).length,
            averageMarkersPerAnalysis: this.stats.analyses > 0 ? 
                Math.round(this.stats.totalMarkers / this.stats.analyses) : 0,
            cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 ?
                (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0
        };
    }

    resetStatistics() {
        this.stats = {
            analyses: 0,
            totalMarkers: 0,
            totalWords: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        console.log('📊 Statistics reset');
    }

    exportAnalysis(analysis, format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(analysis, null, 2);
                
            case 'csv':
                return this.convertToCSV(analysis);
                
            case 'summary':
                return this.generateTextSummary(analysis);
                
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    convertToCSV(analysis) {
        const headers = ['Type', 'Name', 'Score', 'Confidence', 'Count', 'Insight'];
        const rows = [];
        
        // Patterns
        Object.entries(analysis.patterns || {}).forEach(([name, data]) => {
            rows.push([
                'Pattern',
                name,
                data.weightedScore.toFixed(2),
                (data.confidence * 100).toFixed(1) + '%',
                data.count,
                data.patternInfo?.clinical_correlation || ''
            ]);
        });
        
        // Drivers
        Object.entries(analysis.drivers || {}).forEach(([name, data]) => {
            rows.push([
                'Driver',
                data.name || name,
                data.normalizedScore.toFixed(2),
                (data.confidence * 100).toFixed(1) + '%',
                data.contributingPatterns?.length || 0,
                data.insight || ''
            ]);
        });
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    generateTextSummary(analysis) {
        let summary = `=== COGNITIVE ANALYSIS SUMMARY ===\n`;
        summary += `Generated: ${analysis.metadata.analysisTimestamp}\n`;
        summary += `Words: ${analysis.metadata.wordCount}, Markers: ${analysis.metadata.markerCount}\n`;
        summary += `Processing Time: ${analysis.metadata.processingTime}ms\n\n`;
        
        summary += `PRIMARY INSIGHTS:\n`;
        if (analysis.insights && analysis.insights.length > 0) {
            analysis.insights.slice(0, 3).forEach(insight => {
                summary += `• ${insight.interpretation || insight.description}\n`;
            });
        }
        
        summary += `\nPATTERNS DETECTED: ${Object.keys(analysis.patterns || {}).length}\n`;
        const topPatterns = Object.entries(analysis.patterns || {})
            .sort((a, b) => b[1].weightedScore - a[1].weightedScore)
            .slice(0, 3);
        
        topPatterns.forEach(([name, data]) => {
            summary += `- ${name}: ${data.weightedScore.toFixed(1)} (${data.count} markers)\n`;
        });
        
        summary += `\nCOHERENCE: ${(analysis.coherence * 100).toFixed(1)}%\n`;
        
        if (analysis.sentiment) {
            summary += `SENTIMENT: ${analysis.sentiment.overall} (${(analysis.sentiment.intensity * 100).toFixed(1)}% intensity)\n`;
        }
        
        return summary;
    }

    // ========== BATCH PROCESSING ==========
    
    async analyzeBatch(texts, options = {}) {
        const results = [];
        const startTime = Date.now();
        
        console.log(`📦 Starting batch analysis of ${texts.length} texts...`);
        
        for (let i = 0; i < texts.length; i++) {
            try {
                const analysis = this.analyze(texts[i], options);
                results.push({
                    index: i,
                    success: true,
                    data: analysis,
                    error: null
                });
                
                // Progress indicator
                if ((i + 1) % Math.ceil(texts.length / 10) === 0) {
                    console.log(`  Progress: ${i + 1}/${texts.length} (${Math.round((i + 1) / texts.length * 100)}%)`);
                }
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    data: null,
                    error: error.message
                });
            }
            
            // Optional delay to prevent overwhelming
            if (options.delayBetween) {
                await this.delay(options.delayBetween);
            }
        }
        
        const processingTime = Date.now() - startTime;
        
        return {
            results,
            summary: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                processingTime
            }
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== VALIDATION ==========
    
    validateText(text) {
        if (!text || typeof text !== 'string') {
            return { valid: false, error: 'Text must be a non-empty string' };
        }
        
        if (text.length < 10) {
            return { valid: false, error: 'Text must be at least 10 characters' };
        }
        
        if (text.length > 10000) {
            return { valid: false, error: 'Text must not exceed 10,000 characters' };
        }
        
        // Check for valid UTF-8
        if (!/^[\x00-\x7F]*$/.test(text) && !Buffer.from(text, 'utf8').toString('utf8') === text) {
            return { valid: false, error: 'Text contains invalid UTF-8 characters' };
        }
        
        return { valid: true, error: null };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CognitiveEngine;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.CognitiveEngine = CognitiveEngine;
}