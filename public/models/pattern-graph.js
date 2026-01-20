// COGNITIVE INSIGHT ENGINE - Pattern Graph Module
// Version 3.0 - Relationship mapping between cognitive patterns

class PatternGraph {
    constructor(knowledgeBase) {
        this.kb = knowledgeBase;
        this.graph = this.buildGraph();
        this.centrality = {};
        this.clusters = [];
        this.bridges = [];
    }

    buildGraph() {
        const graph = {
            nodes: {},
            edges: []
        };
        
        // Create nodes for each pattern
        Object.keys(this.kb.patterns).forEach(pattern => {
            const patternInfo = this.kb.patterns[pattern];
            graph.nodes[pattern] = {
                id: pattern,
                name: patternInfo.name,
                driver: patternInfo.driver,
                weight: 0, // Will be updated with actual data
                centrality: 0,
                cluster: -1
            };
        });
        
        // Create edges based on relationships
        Object.keys(this.kb.pattern_relationships).forEach(sourcePattern => {
            const relationships = this.kb.pattern_relationships[sourcePattern];
            
            // Reinforcement edges
            if (relationships.reinforces) {
                relationships.reinforces.forEach(targetPattern => {
                    if (graph.nodes[targetPattern]) {
                        graph.edges.push({
                            source: sourcePattern,
                            target: targetPattern,
                            type: 'reinforces',
                            weight: 0.8,
                            bidirectional: false
                        });
                    }
                });
            }
            
            // Conflict edges
            if (relationships.conflicts_with) {
                relationships.conflicts_with.forEach(targetPattern => {
                    if (graph.nodes[targetPattern]) {
                        graph.edges.push({
                            source: sourcePattern,
                            target: targetPattern,
                            type: 'conflicts',
                            weight: -0.6,
                            bidirectional: true
                        });
                    }
                });
            }
        });
        
        // Add complementary edges (if A reinforces B, B is reinforced_by A)
        const newEdges = [];
        graph.edges.forEach(edge => {
            if (edge.type === 'reinforces' && !edge.bidirectional) {
                newEdges.push({
                    source: edge.target,
                    target: edge.source,
                    type: 'reinforced_by',
                    weight: 0.4,
                    bidirectional: false
                });
            }
        });
        
        graph.edges.push(...newEdges);
        
        return graph;
    }

    updateWithAnalysis(patternScores) {
        // Update node weights with actual analysis data
        Object.keys(patternScores).forEach(pattern => {
            if (this.graph.nodes[pattern]) {
                this.graph.nodes[pattern].weight = patternScores[pattern].weightedScore || 0;
            }
        });
        
        // Recalculate metrics
        this.calculateCentrality();
        this.findClusters();
        this.findBridges();
        
        return this.graph;
    }

    calculateCentrality() {
        const nodes = this.graph.nodes;
        const edges = this.graph.edges;
        
        // Simple degree centrality
        Object.keys(nodes).forEach(nodeId => {
            nodes[nodeId].degree = 0;
            nodes[nodeId].inDegree = 0;
            nodes[nodeId].outDegree = 0;
        });
        
        edges.forEach(edge => {
            if (nodes[edge.source]) {
                nodes[edge.source].outDegree++;
                nodes[edge.source].degree++;
            }
            if (nodes[edge.target]) {
                nodes[edge.target].inDegree++;
                nodes[edge.target].degree++;
            }
        });
        
        // Normalize centrality
        const maxDegree = Math.max(...Object.values(nodes).map(n => n.degree));
        Object.keys(nodes).forEach(nodeId => {
            nodes[nodeId].centrality = maxDegree > 0 ? nodes[nodeId].degree / maxDegree : 0;
        });
        
        this.centrality = Object.fromEntries(
            Object.entries(nodes).map(([id, node]) => [id, node.centrality])
        );
        
        return this.centrality;
    }

    findClusters() {
        const nodes = this.graph.nodes;
        const edges = this.graph.edges;
        const visited = new Set();
        const clusters = [];
        
        // Filter to only positive/reinforcement edges for clustering
        const positiveEdges = edges.filter(e => e.weight > 0);
        
        function dfs(nodeId, clusterId) {
            visited.add(nodeId);
            nodes[nodeId].cluster = clusterId;
            
            // Find connected nodes via positive edges
            positiveEdges.forEach(edge => {
                if (edge.source === nodeId && !visited.has(edge.target)) {
                    dfs(edge.target, clusterId);
                }
                if (edge.target === nodeId && !visited.has(edge.source)) {
                    dfs(edge.source, clusterId);
                }
            });
        }
        
        let clusterId = 0;
        Object.keys(nodes).forEach(nodeId => {
            if (!visited.has(nodeId)) {
                const cluster = [];
                dfs(nodeId, clusterId);
                
                // Get nodes in this cluster
                Object.keys(nodes).forEach(id => {
                    if (nodes[id].cluster === clusterId) {
                        cluster.push(id);
                    }
                });
                
                if (cluster.length > 0) {
                    clusters.push({
                        id: clusterId,
                        nodes: cluster,
                        size: cluster.length,
                        primaryDriver: this.getClusterDriver(cluster)
                    });
                    clusterId++;
                }
            }
        });
        
        this.clusters = clusters;
        return clusters;
    }

    getClusterDriver(clusterNodes) {
        const driverCounts = {};
        
        clusterNodes.forEach(nodeId => {
            const driver = this.graph.nodes[nodeId]?.driver;
            if (driver) {
                driverCounts[driver] = (driverCounts[driver] || 0) + 1;
            }
        });
        
        // Return most common driver
        return Object.entries(driverCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';
    }

    findBridges() {
        const bridges = [];
        const edges = this.graph.edges;
        
        // Find edges that connect different clusters
        edges.forEach(edge => {
            const sourceNode = this.graph.nodes[edge.source];
            const targetNode = this.graph.nodes[edge.target];
            
            if (sourceNode && targetNode && sourceNode.cluster !== targetNode.cluster) {
                bridges.push({
                    source: edge.source,
                    target: edge.target,
                    type: edge.type,
                    sourceCluster: sourceNode.cluster,
                    targetCluster: targetNode.cluster,
                    weight: edge.weight,
                    significance: Math.abs(sourceNode.centrality - targetNode.centrality)
                });
            }
        });
        
        this.bridges = bridges;
        return bridges;
    }

    getPatternNeighbors(pattern, depth = 1) {
        const neighbors = new Set();
        
        function explore(currentPattern, currentDepth, visited = new Set()) {
            if (currentDepth > depth || visited.has(currentPattern)) return;
            
            visited.add(currentPattern);
            
            this.graph.edges.forEach(edge => {
                if (edge.source === currentPattern && !visited.has(edge.target)) {
                    neighbors.add(edge.target);
                    explore.call(this, edge.target, currentDepth + 1, visited);
                }
                if (edge.target === currentPattern && !visited.has(edge.source)) {
                    neighbors.add(edge.source);
                    explore.call(this, edge.source, currentDepth + 1, visited);
                }
            });
        }
        
        explore.call(this, pattern, 0);
        return Array.from(neighbors);
    }

    getInfluencePath(sourcePattern, targetPattern, maxDepth = 3) {
        const paths = [];
        
        function dfs(current, path, visited = new Set()) {
            if (path.length > maxDepth) return;
            if (current === targetPattern) {
                paths.push([...path, current]);
                return;
            }
            
            visited.add(current);
            
            this.graph.edges.forEach(edge => {
                if (edge.source === current && !visited.has(edge.target)) {
                    dfs.call(this, edge.target, [...path, current], new Set(visited));
                }
            });
        }
        
        dfs.call(this, sourcePattern, []);
        
        // Return shortest path
        return paths.sort((a, b) => a.length - b.length)[0] || [];
    }

    getPatternInfluence(pattern) {
        const influence = {
            reinforces: [],
            conflicts: [],
            reinforced_by: [],
            total_influence: 0
        };
        
        this.graph.edges.forEach(edge => {
            if (edge.source === pattern) {
                if (edge.type === 'reinforces') {
                    influence.reinforces.push(edge.target);
                } else if (edge.type === 'conflicts') {
                    influence.conflicts.push(edge.target);
                }
                influence.total_influence += Math.abs(edge.weight);
            }
            if (edge.target === pattern && edge.type === 'reinforced_by') {
                influence.reinforced_by.push(edge.source);
            }
        });
        
        return influence;
    }

    visualizeGraph() {
        // This would generate data for visualization libraries like D3.js
        const visData = {
            nodes: Object.values(this.graph.nodes).map(node => ({
                id: node.id,
                name: node.name,
                group: node.cluster,
                value: node.weight,
                centrality: node.centrality
            })),
            links: this.graph.edges.map(edge => ({
                source: edge.source,
                target: edge.target,
                value: Math.abs(edge.weight),
                type: edge.type
            }))
        };
        
        return visData;
    }

    getClusterSummary() {
        return this.clusters.map(cluster => ({
            id: cluster.id,
            size: cluster.size,
            driver: cluster.primaryDriver,
            nodes: cluster.nodes.map(nodeId => ({
                id: nodeId,
                name: this.graph.nodes[nodeId]?.name,
                weight: this.graph.nodes[nodeId]?.weight
            })),
            averageWeight: cluster.nodes.reduce((sum, nodeId) => 
                sum + (this.graph.nodes[nodeId]?.weight || 0), 0) / cluster.size
        }));
    }

    getCriticalPatterns(threshold = 0.7) {
        return Object.values(this.graph.nodes)
            .filter(node => node.centrality >= threshold)
            .sort((a, b) => b.centrality - a.centrality)
            .map(node => ({
                pattern: node.id,
                name: node.name,
                centrality: node.centrality,
                degree: node.degree,
                influence: this.getPatternInfluence(node.id)
            }));
    }

    getSystemCoherence() {
        // Calculate overall graph coherence
        const positiveEdges = this.graph.edges.filter(e => e.weight > 0).length;
        const negativeEdges = this.graph.edges.filter(e => e.weight < 0).length;
        const totalEdges = this.graph.edges.length;
        
        if (totalEdges === 0) return 1;
        
        // Coherence is higher when there are more positive connections
        const positiveRatio = positiveEdges / totalEdges;
        
        // Also consider cluster separation
        const clusterSeparation = this.clusters.length > 1 ? 
            (this.clusters.length / Object.keys(this.graph.nodes).length) : 0;
        
        // Combine factors
        const coherence = (positiveRatio * 0.7) + ((1 - clusterSeparation) * 0.3);
        
        return Math.max(0, Math.min(1, coherence));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatternGraph;
}
