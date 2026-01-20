// COGNITIVE INSIGHT ENGINE - Interface Controller
// Version 3.0 - Complete UI integration with all modules

class InterfaceController {
    constructor(knowledgeBase) {
        this.kb = knowledgeBase;
        this.engine = new CognitiveEngine(knowledgeBase);
        this.conflictResolver = new ConflictResolver(knowledgeBase);
        this.temporalAnalyzer = new TemporalAnalyzer(knowledgeBase);
        this.confidenceScorer = new ConfidenceScorer(knowledgeBase);
        this.narrativeGenerator = new NarrativeGenerator(knowledgeBase);
        
        this.radarChart = null;
        this.currentAnalysis = null;
        this.currentText = "";
        
        // ========== UPDATE THIS SECTION ==========
        // BOLD COLOR MAPPING FOR PATTERNS
        this.categoryColors = {
            'absolutist': '#FF2E63',        // Hot Pink/Red
            'imperative': '#FFD700',        // Gold Yellow
            'catastrophizing': '#FF6B35',   // Orange
            'self_critic': '#FF00F7',       // Magenta
            'personalization': '#08D9D6',   // Electric Blue
            'mind_reading': '#00FF8C',      // Lime Green
            'emotional_reasoning': '#AA00FF', // Neon Purple
            'default': '#8A8AA3'            // Muted Purple
        };
        
        // Bind methods
        this.updateInterface = this.updateInterface.bind(this);
        this.highlightText = this.highlightText.bind(this);
    }

    // ========== ALSO UPDATE THE createDriverRadar METHOD ==========
    
    createDriverRadar(driverScores) {
        const canvas = document.getElementById('driver-radar');
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.radarChart) {
            this.radarChart.destroy();
        }
        
        const drivers = Object.keys(driverScores).filter(d => driverScores[d].normalizedScore > 1);
        
        if (drivers.length < 2) {
            canvas.parentElement.innerHTML = `
                <div class="no-data" style="height: 250px; display: flex; align-items: center; justify-content: center;">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-pie" style="font-size: 2rem; color: #8A8AA3; margin-bottom: 10px;"></i>
                        <p>Insufficient data for radar chart<br><small>Need at least 2 drivers with scores > 1</small></p>
                    </div>
                </div>
            `;
            return;
        }
        
        // ========== ADD THIS BOLD COLOR MAPPING ==========
        const driverColors = {
            control: '#FF2E63',        // Hot Pink/Red
            validation: '#FFD700',     // Gold Yellow
            safety: '#FF6B35',         // Orange
            responsibility: '#08D9D6', // Electric Blue
            autonomy: '#00FF8C'        // Lime Green
        };
        
        // ========== UPDATE THE CHART DATA ==========
        const data = {
            labels: drivers.map(d => this.kb.drivers[d]?.name || d),
            datasets: [{
                label: 'Driver Strength',
                data: drivers.map(d => driverScores[d].normalizedScore),
                backgroundColor: drivers.map(d => `${driverColors[d] || '#AA00FF'}30`), // 30 = 0.2 opacity
                borderColor: drivers.map(d => driverColors[d] || '#AA00FF'),
                pointBackgroundColor: drivers.map(d => driverColors[d] || '#AA00FF'),
                pointBorderColor: '#FFFFFF',
                pointHoverBackgroundColor: '#FFFFFF',
                pointHoverBorderColor: drivers.map(d => driverColors[d] || '#AA00FF'),
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };
        
        // ========== UPDATE CHART CONFIG FOR BOLD STYLE ==========
        const config = {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        min: 0,
                        ticks: {
                            stepSize: 2,
                            font: {
                                size: 12,
                                weight: '800'
                            },
                            color: '#B8B8D1'
                        },
                        pointLabels: {
                            font: {
                                size: 14,
                                weight: '800'
                            },
                            color: '#FFFFFF'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            lineWidth: 2
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            lineWidth: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(18, 18, 24, 0.95)',
                        titleColor: '#08D9D6',
                        bodyColor: '#FFFFFF',
                        borderColor: '#FF2E63',
                        borderWidth: 2,
                        titleFont: {
                            size: 14,
                            weight: '700'
                        },
                        bodyFont: {
                            size: 13,
                            weight: '600'
                        },
                        callbacks: {
                            label: (context) => {
                                const driver = drivers[context.dataIndex];
                                const score = driverScores[driver].normalizedScore;
                                const patterns = driverScores[driver].contributingPatterns
                                    .slice(0, 3)
                                    .map(p => p.patternName || p.pattern)
                                    .join(', ');
                                return [
                                    `🔥 Score: ${score.toFixed(1)}/10`,
                                    `📊 Patterns: ${patterns}`
                                ];
                            }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        };
        
        // Create gradient background for radar chart
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(255, 46, 99, 0.1)');
        gradient.addColorStop(0.5, 'rgba(170, 0, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(8, 217, 214, 0.1)');
        
        // Apply gradient to background
        config.options.scales.r.backgroundColor = gradient;
        
        this.radarChart = new Chart(canvas, config);
        
        // Add glow effect to canvas
        canvas.style.boxShadow = '0 0 30px rgba(255, 46, 99, 0.3)';
        
        // Update badge with bold colors
        const badge = document.getElementById('driver-badge');
        if (badge) {
            badge.textContent = drivers.length;
            badge.style.background = 'linear-gradient(135deg, #FF2E63, #FF00F7, #AA00FF)';
            badge.style.boxShadow = '0 0 15px rgba(255, 46, 99, 0.5)';
        }
    }
    
    // ========== ALSO UPDATE OTHER METHODS FOR BOLD COLORS ==========
    
    highlightText(text, hits) {
        if (!text || !hits) return text;
        
        const sortedHits = [...hits].sort((a, b) => b.position - a.position);
        let highlighted = text;
        
        sortedHits.forEach(hit => {
            const originalWord = hit.originalWord || hit.word;
            const escapedWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
            
            // Use bold colors from the constructor
            const color = this.categoryColors[hit.category] || this.categoryColors.default;
            const weightClass = this.getWeightClass(hit.adjustedWeight);
            const opacity = Math.min(0.8, Math.max(0.3, hit.adjustedWeight / 5));
            
            // Convert opacity to hex (0-255)
            const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
            
            const replacement = `<span class="highlight-marker ${weightClass}" 
                style="background-color: ${color}${opacityHex}; 
                       border-bottom: 3px solid ${color};
                       padding: 2px 4px;
                       border-radius: 4px;
                       cursor: help;
                       font-weight: 900 !important;
                       text-shadow: 0 1px 3px rgba(0,0,0,0.7);"
                title="${hit.category.toUpperCase()} - Weight: ${hit.adjustedWeight.toFixed(1)}${hit.isNegated ? ' [NEGATED]' : ''}">
                ${originalWord}
            </span>`;
            
            highlighted = highlighted.replace(regex, replacement);
        });
        
        return highlighted;
    }
    
    // ========== UPDATE TEMPORAL CHART COLORS ==========
    
    createTemporalChart(temporalDistribution) {
        const container = document.getElementById('temporal-chart');
        if (!container) return;
        
        container.innerHTML = '';
        
        const hasData = Object.keys(temporalDistribution.early || {}).length > 0 ||
                       Object.keys(temporalDistribution.middle || {}).length > 0 ||
                       Object.keys(temporalDistribution.late || {}).length > 0;
        
        if (!hasData) {
            container.innerHTML = `
                <div style="height: 180px; display: flex; align-items: center; justify-content: center; color: #8A8AA3;">
                    <div style="text-align: center;">
                        <i class="fas fa-stream" style="font-size: 2rem; margin-bottom: 10px; color: #FFD700;"></i>
                        <p style="font-weight: 700; color: #FFFFFF;">No temporal patterns detected</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const timeline = document.createElement('div');
        timeline.className = 'timeline';
        timeline.style.cssText = `
            display: flex;
            height: 180px;
            gap: 15px;
            padding: 20px;
            background: rgba(18, 18, 24, 0.7);
            border-radius: 12px;
            border: 2px solid #2A2A40;
        `;
        
        const segments = ['early', 'middle', 'late'];
        const allPatterns = new Set();
        
        segments.forEach(seg => {
            Object.keys(temporalDistribution[seg] || {}).forEach(p => allPatterns.add(p));
        });
        
        const patternList = Array.from(allPatterns).slice(0, 6);
        
        segments.forEach(segment => {
            const segmentDiv = document.createElement('div');
            segmentDiv.className = 'segment';
            segmentDiv.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: center;
                gap: 8px;
            `;
            
            const maxWeight = Math.max(...patternList.map(pattern => 
                temporalDistribution[segment][pattern] || 0
            ));
            
            patternList.forEach(pattern => {
                const score = temporalDistribution[segment][pattern] || 0;
                const height = maxWeight > 0 ? (score / maxWeight) * 100 : 0;
                const color = this.categoryColors[pattern] || this.categoryColors.default;
                
                const barContainer = document.createElement('div');
                barContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    justify-content: flex-end;
                `;
                
                const bar = document.createElement('div');
                bar.className = 'segment-bar';
                bar.style.cssText = `
                    width: 25px;
                    height: ${height}%;
                    background: linear-gradient(to top, ${color}, ${color}DD);
                    border-radius: 6px 6px 0 0;
                    transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: help;
                    position: relative;
                    box-shadow: 0 0 10px ${color}80;
                `;
                bar.title = `${pattern.toUpperCase()}: ${score.toFixed(1)}`;
                
                // Add glow effect
                bar.innerHTML = `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 6px 6px 0 0; box-shadow: inset 0 0 10px rgba(255,255,255,0.3);"></div>`;
                
                const patternLabel = document.createElement('div');
                patternLabel.style.cssText = `
                    font-size: 0.75rem;
                    color: ${color};
                    font-weight: 800;
                    margin-top: 8px;
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    text-shadow: 0 0 5px ${color};
                `;
                patternLabel.textContent = pattern.substring(0, 10);
                
                barContainer.appendChild(bar);
                barContainer.appendChild(patternLabel);
                segmentDiv.appendChild(barContainer);
            });
            
            const label = document.createElement('div');
            label.className = 'segment-label';
            label.style.cssText = `
                font-weight: 800;
                color: #FFD700;
                margin-top: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-size: 0.9rem;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            `;
            label.textContent = segment;
            
            segmentDiv.appendChild(label);
            timeline.appendChild(segmentDiv);
        });
        
        container.appendChild(timeline);
        
        // Update badge with bold colors
        const badge = document.getElementById('temporal-badge');
        if (badge) {
            const shiftCount = this.currentAnalysis?.temporalShift?.shifts?.length || 0;
            badge.textContent = shiftCount > 0 ? `${shiftCount} SHIFT${shiftCount !== 1 ? 'S' : ''}` : 'STABLE';
            badge.style.background = shiftCount > 0 ? 
                'linear-gradient(135deg, #FF6B35, #FFD700)' : 
                'linear-gradient(135deg, #00FF8C, #08D9D6)';
            badge.style.boxShadow = shiftCount > 0 ? 
                '0 0 15px rgba(255, 107, 53, 0.5)' : 
                '0 0 15px rgba(0, 255, 140, 0.5)';
        }
    }
    
    // ========== UPDATE CONFLICT STYLES ==========
    
    updateConflictList(conflicts) {
        const container = document.getElementById('conflict-list');
        const section = document.getElementById('conflict-section');
        
        if (!container) return;
        
        if (!conflicts || conflicts.length === 0) {
            container.innerHTML = `
                <div class="no-conflicts" style="text-align: center; padding: 30px; color: #00FF8C;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 15px; text-shadow: 0 0 20px rgba(0, 255, 140, 0.5);"></i>
                    <p style="font-size: 1.2rem; font-weight: 800; margin-bottom: 10px;">NO TENSIONS DETECTED</p>
                    <p style="font-size: 0.9rem; opacity: 0.8; color: #B8B8D1;">Excellent internal consistency</p>
                </div>
            `;
            if (section) section.style.display = 'block';
            return;
        }
        
        container.innerHTML = '';
        if (section) section.style.display = 'block';
        
        const sortedConflicts = conflicts
            .sort((a, b) => (b.severity || 0) - (a.severity || 0))
            .slice(0, 4);
        
        sortedConflicts.forEach(conflict => {
            const item = document.createElement('div');
            item.className = 'conflict-item';
            item.style.cssText = `
                background: linear-gradient(135deg, rgba(255, 46, 99, 0.1), rgba(170, 0, 255, 0.1));
                border: 3px solid #FF2E63;
                padding: 20px;
                border-radius: 12px;
                border-left: 8px solid #FF2E63;
                margin-bottom: 15px;
                position: relative;
                overflow: hidden;
                animation: pulse 2s infinite;
            `;
            
            // Add animated glow
            item.innerHTML += `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); animation: shine 3s infinite;"></div>`;
            
            const severity = conflict.severity || 0;
            const severityColor = severity > 5 ? '#FF2E63' : severity > 3 ? '#FF6B35' : '#FFD700';
            
            let description = conflict.interpretation || 'Cognitive tension detected';
            if (conflict.recommendation) {
                description += `<br><br><strong style="color: #08D9D6;"><i class="fas fa-lightbulb"></i> SUGGESTION:</strong> ${conflict.recommendation}`;
            }
            
            item.innerHTML += `
                <div class="conflict-type" style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; position: relative; z-index: 1;">
                    <i class="fas fa-exclamation-triangle" style="color: ${severityColor}; font-size: 1.2em; text-shadow: 0 0 10px ${severityColor};"></i>
                    <span style="font-weight: 900; color: #FFFFFF; font-size: 1.1rem; letter-spacing: 1px;">
                        ${conflict.type ? conflict.type.replace('_', ' ').toUpperCase() : 'CONFLICT'}
                    </span>
                    <span style="margin-left: auto; font-size: 0.9rem; padding: 6px 12px; background: ${severityColor}30; color: ${severityColor}; border-radius: 20px; font-weight: 800; border: 2px solid ${severityColor};">
                        SEVERITY: ${severity.toFixed(1)}
                    </span>
                </div>
                <div class="conflict-description" style="font-size: 1rem; color: #FFFFFF; line-height: 1.6; position: relative; z-index: 1; font-weight: 600;">
                    ${description}
                </div>
            `;
            
            container.appendChild(item);
        });
        
        // Update badge with bold colors
        const badge = document.getElementById('conflict-badge');
        if (badge) {
            badge.textContent = conflicts.length;
            badge.style.background = 'linear-gradient(135deg, #FF2E63, #FF00F7)';
            badge.style.boxShadow = '0 0 20px rgba(255, 46, 99, 0.7)';
            badge.style.animation = 'pulse 1.5s infinite';
        }
    }
    
    // ========== UPDATE MARKER ANALYSIS COLORS ==========
    
    updateMarkerAnalysis(hits) {
        const container = document.getElementById('marker-analysis');
        if (!container) return;
        
        container.innerHTML = '';
        
        const sortedHits = [...hits]
            .sort((a, b) => b.adjustedWeight - a.adjustedWeight)
            .slice(0, 8);
        
        if (sortedHits.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #8A8AA3;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; color: #08D9D6;"></i>
                    <p style="font-weight: 800; color: #FFFFFF; font-size: 1.2rem;">NO COGNITIVE MARKERS</p>
                    <p style="font-size: 0.9rem;">Try writing about thoughts or emotions</p>
                </div>
            `;
            return;
        }
        
        sortedHits.forEach(hit => {
            const markerInfo = this.kb.lexicon[hit.word];
            const patternInfo = this.kb.patterns[hit.category];
            const color = this.categoryColors[hit.category] || this.categoryColors.default;
            
            const item = document.createElement('div');
            item.className = 'marker-item';
            item.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                padding: 20px;
                margin-bottom: 12px;
                border-radius: 10px;
                border-left: 6px solid ${color};
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                border: 2px solid #2A2A40;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            `;
            
            item.onmouseenter = () => {
                item.style.transform = 'translateX(10px)';
                item.style.boxShadow = `0 10px 25px ${color}40`;
            };
            
            item.onmouseleave = () => {
                item.style.transform = 'translateX(0)';
                item.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
            };
            
            const weightPercent = Math.min(100, (hit.adjustedWeight / 5) * 100);
            
            item.innerHTML = `
                <div class="marker-word" style="font-weight: 900; color: #FFFFFF; margin-bottom: 10px; font-size: 1.3rem; display: flex; align-items: center; gap: 10px;">
                    <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>
                    <span style="text-shadow: 0 2px 5px rgba(0,0,0,0.5);">"${hit.originalWord || hit.word}"</span>
                </div>
                <div class="marker-info" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: 800; color: ${color}; font-size: 1rem;">
                        <i class="fas fa-tag" style="margin-right: 8px;"></i>
                        ${patternInfo?.name || hit.category}
                    </span>
                    <span style="font-weight: 900; color: #FFD700; font-size: 1.2rem;">
                        <i class="fas fa-weight-hanging" style="margin-right: 8px;"></i>
                        ${hit.adjustedWeight.toFixed(1)}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; border: 1px solid #2A2A40;">
                        <div style="height: 100%; width: ${weightPercent}%; background: linear-gradient(90deg, ${color}, ${color}DD); border-radius: 4px; position: relative;">
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite;"></div>
                        </div>
                    </div>
                    <span style="color: ${color}; font-weight: 900; font-size: 1.1rem; min-width: 50px;">${weightPercent.toFixed(0)}%</span>
                </div>
                ${hit.isNegated ? 
                    '<div style="font-size: 0.85rem; color: #FF2E63; margin-top: 8px; font-weight: 800;"><i class="fas fa-ban"></i> NEGATED</div>' : ''
                }
                ${markerInfo?.clinical_note ? 
                    `<div style="font-size: 0.85rem; color: #B8B8D1; margin-top: 8px; font-weight: 600; font-style: italic; border-left: 3px solid ${color}; padding-left: 10px;">
                        <i class="fas fa-stethoscope" style="color: ${color}; margin-right: 5px;"></i> ${markerInfo.clinical_note}
                    </div>` : ''
                }
            `;
            
            container.appendChild(item);
        });
        
        // Update badge with bold colors
        const badge = document.getElementById('marker-badge');
        if (badge) {
            badge.textContent = hits.length;
            badge.style.background = 'linear-gradient(135deg, #08D9D6, #00FF8C)';
            badge.style.boxShadow = '0 0 15px rgba(8, 217, 214, 0.5)';
        }
    }
}
