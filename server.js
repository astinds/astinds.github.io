const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');

// Import the cognitive engine
const KNOWLEDGE_BASE = require('./public/core/knowledge.js');
const CognitiveEngine = require('./public/core/engine.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(bodyParser.json({ limit: '10mb' })); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Initialize cognitive engine
const engine = new CognitiveEngine(KNOWLEDGE_BASE);

// ========== API ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        markers: Object.keys(KNOWLEDGE_BASE.lexicon).length,
        patterns: Object.keys(KNOWLEDGE_BASE.patterns).length
    });
});

// Analyze text
app.post('/api/analyze', (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Text parameter is required and must be a string'
            });
        }
        
        if (text.length < 10) {
            return res.status(400).json({
                error: 'Text too short',
                message: 'Please provide at least 10 characters for meaningful analysis'
            });
        }
        
        if (text.length > 10000) {
            return res.status(400).json({
                error: 'Text too long',
                message: 'Maximum text length is 10,000 characters'
            });
        }
        
        console.log(`Analyzing text (${text.length} chars)...`);
        const startTime = Date.now();
        
        // Perform analysis
        const analysis = engine.analyze(text);
        
        const processingTime = Date.now() - startTime;
        
        // Enhance with additional metadata
        analysis.metadata.processingTime = processingTime;
        analysis.metadata.serverVersion = '3.0.0';
        
        res.json({
            success: true,
            data: analysis,
            metadata: {
                processingTime: `${processingTime}ms`,
                wordCount: text.split(/\s+/).length,
                markerCount: analysis.hits.length
            }
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Batch analyze multiple texts
app.post('/api/analyze/batch', (req, res) => {
    try {
        const { texts } = req.body;
        
        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Texts must be a non-empty array'
            });
        }
        
        if (texts.length > 10) {
            return res.status(400).json({
                error: 'Too many texts',
                message: 'Maximum 10 texts per batch request'
            });
        }
        
        const results = texts.map((text, index) => {
            try {
                return {
                    index,
                    success: true,
                    data: text ? engine.analyze(text) : null
                };
            } catch (error) {
                return {
                    index,
                    success: false,
                    error: error.message
                };
            }
        });
        
        res.json({
            success: true,
            results,
            summary: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
        
    } catch (error) {
        console.error('Batch analysis error:', error);
        res.status(500).json({
            error: 'Batch analysis failed',
            message: error.message
        });
    }
});

// Get engine statistics
app.get('/api/stats', (req, res) => {
    res.json({
        knowledgeBase: {
            markers: Object.keys(KNOWLEDGE_BASE.lexicon).length,
            patterns: Object.keys(KNOWLEDGE_BASE.patterns).length,
            drivers: Object.keys(KNOWLEDGE_BASE.drivers).length,
            amplifiers: KNOWLEDGE_BASE.amplifiers?.extreme?.length || 0,
            diminishers: KNOWLEDGE_BASE.diminishers?.uncertainty?.length || 0
        },
        engine: {
            version: '3.0.0',
            contextWindow: engine.contextWindow,
            temporalSegments: engine.temporalSegments
        },
        system: {
            nodeVersion: process.version,
            platform: process.platform,
            memory: process.memoryUsage()
        }
    });
});

// Export analysis as PDF (placeholder)
app.post('/api/export/pdf', (req, res) => {
    const { analysis } = req.body;
    
    // In a real implementation, you would generate PDF here
    res.json({
        success: true,
        message: 'PDF export would be generated here',
        data: {
            format: 'pdf',
            downloadUrl: '/api/download/analysis.pdf'
        }
    });
});

// ========== FRONTEND ROUTES ==========

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
    console.log(`
🚀 Cognitive Insight Engine v3.0
🌐 Server running at: http://localhost:${PORT}
📊 Markers loaded: ${Object.keys(KNOWLEDGE_BASE.lexicon).length}
🔍 Patterns available: ${Object.keys(KNOWLEDGE_BASE.patterns).length}
📈 API endpoints ready
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app; // For testing