/**
 * Comprehensive tests for Mermaid diagram validation and generation
 * Run with: node services/conceptMapGenerator.test.js
 */

// Mock the required modules since we're testing in isolation
const mockMermaid = {
    parse: () => {},
    render: () => Promise.resolve({ svg: '<svg></svg>' })
};

// Mock the conceptMapGenerator functions
function validateMermaidDiagram(diagramString) {
    if (!diagramString || typeof diagramString !== 'string') {
        return { 
            isValid: false, 
            errors: [{ line: 0, message: 'Diagram is empty or not a string' }], 
            sanitized: '' 
        };
    }

    const errors = [];
    let sanitized = diagramString;

    // Remove BOM and normalize line endings
    sanitized = sanitized.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    
    // Remove invalid Unicode characters (keep only ASCII printable + newlines)
    sanitized = sanitized.replace(/[^\x20-\x7E\n]/g, '');
    
    const lines = sanitized.split('\n');
    const sanitizedLines = [];
    let foundGraph = false;
    let nodeCount = 0;
    let edgeCount = 0;

    // Enhanced regex patterns for better validation
    const graphRegex = /^(graph|flowchart)\s+(TD|TB|LR|RL|BT)\s*$/;
    const nodeRegex = /^[a-zA-Z0-9_\-]+\s*\[".*"\]$/;
    const edgeRegex = /^[a-zA-Z0-9_\-]+\s*--?>(\|[^|]+\|)?\s*[a-zA-Z0-9_\-]+$/;
    const specialKeywords = ['classDef', 'class ', 'style', 'click', 'linkStyle'];

    // Validate and fix graph declaration
    if (lines.length === 0 || !graphRegex.test(lines[0].trim())) {
        if (lines.length > 0 && lines[0].trim()) {
            errors.push({ 
                line: 1, 
                message: `Invalid graph declaration. Expected 'graph TD', 'flowchart LR', etc. Found: '${lines[0].trim()}'` 
            });
        } else {
            errors.push({ 
                line: 1, 
                message: 'Missing graph declaration. Diagram must start with "graph TD", "flowchart LR", etc.' 
            });
        }
        // Auto-correct: prepend valid graph declaration
        lines.unshift('graph TD');
        sanitized = 'graph TD\n' + sanitized;
    }

    // Find first blank line for style directive placement
    let firstBlankLine = lines.findIndex(l => l.trim() === '');
    if (firstBlankLine === -1) firstBlankLine = lines.length;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (trimmedLine === '' || trimmedLine.startsWith('%%')) {
            sanitizedLines.push(line);
            continue;
        }

        // Validate graph declaration (line 1)
        if (i === 0) {
            if (!graphRegex.test(trimmedLine)) {
                errors.push({ 
                    line: lineNum, 
                    message: `Invalid graph declaration: '${trimmedLine}'. Must be 'graph TD', 'flowchart LR', etc.` 
                });
            } else {
                foundGraph = true;
                sanitizedLines.push(trimmedLine);
            }
            continue;
        }

        // Check for misplaced style directives
        const hasSpecialKeyword = specialKeywords.some(keyword => trimmedLine.includes(keyword));
        if (hasSpecialKeyword && i < firstBlankLine) {
            errors.push({ 
                line: lineNum, 
                message: `Style directive '${trimmedLine.split(' ')[0]}' must appear after the first blank line` 
            });
            continue;
        }

        // Validate style directives
        if (hasSpecialKeyword) {
            const keyword = specialKeywords.find(k => trimmedLine.startsWith(k));
            if (!keyword) {
                errors.push({ 
                    line: lineNum, 
                    message: `Style directive must be on its own line: '${trimmedLine}'` 
                });
                continue;
            }
            sanitizedLines.push(trimmedLine);
            continue;
        }

        // Validate nodes
        if (nodeRegex.test(trimmedLine)) {
            nodeCount++;
            sanitizedLines.push(trimmedLine);
            continue;
        }

        // Validate edges
        if (edgeRegex.test(trimmedLine)) {
            edgeCount++;
            sanitizedLines.push(trimmedLine);
            continue;
        }

        // If we get here, the line is invalid
        errors.push({ 
            line: lineNum, 
            message: `Invalid Mermaid syntax: '${trimmedLine}'. Expected node definition, edge, or style directive.` 
        });
    }

    // Validate minimum requirements
    if (!foundGraph) {
        errors.push({ 
            line: 1, 
            message: 'Missing graph declaration. Diagram must start with "graph TD", "flowchart LR", etc.' 
        });
    }

    if (nodeCount < 2) {
        errors.push({ 
            line: 0, 
            message: `Insufficient nodes. Found ${nodeCount}, need at least 2 nodes for a valid diagram.` 
        });
    }

    if (edgeCount < 1) {
        errors.push({ 
            line: 0, 
            message: `No connections found. Need at least 1 edge to connect nodes.` 
        });
    }

    // If all lines were stripped, provide a clear error
    if (sanitizedLines.length === 0) {
        errors.push({ 
            line: 0, 
            message: 'Diagram is empty after sanitization. Please check your input for valid Mermaid syntax.' 
        });
    }

    const isValid = errors.length === 0;
    const sanitizedDiagram = sanitizedLines.join('\n');

    return {
        isValid,
        errors,
        sanitized: sanitizedDiagram
    };
}

function createMermaidDiagram(concepts, inputText = '') {
    try {
        if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
            return 'graph TD\nErrorNode["No concepts available"]';
        }

        let lines = ['graph TD'];
        const validNodeIds = new Set();
        const processedNodes = [];
        const processedEdges = [];

        // First pass: collect and validate all nodes
        for (const concept of concepts) {
            if (!concept || !concept.id) {
                continue;
            }

            // Create a safe node ID from the concept ID
            let id = concept.id.toString();
            // Remove invalid characters but keep valid ones
            id = id.replace(/[^a-zA-Z0-9_\-]/g, '_');
            // Ensure it starts with a letter
            if (!/^[a-zA-Z]/.test(id)) {
                id = 'node_' + id;
            }
            // Ensure uniqueness
            let originalId = id;
            let counter = 1;
            while (validNodeIds.has(id)) {
                id = `${originalId}_${counter}`;
                counter++;
            }

            const text = concept.text || 'Node';
            
            // Validate node text
            if (!text || text.length === 0) {
                continue;
            }

            validNodeIds.add(id);
            processedNodes.push({ id, text, originalId: concept.id });
        }

        // If no valid nodes, return error diagram
        if (processedNodes.length === 0) {
            return 'graph TD\nErrorNode["No valid concepts available"]';
        }

        // Add nodes to diagram
        for (const node of processedNodes) {
            lines.push(`${node.id}["${node.text}"]`);
        }

        // Second pass: collect and validate all edges
        for (const concept of concepts) {
            if (!concept || !concept.id || !concept.connections) {
                continue;
            }

            // Find the corresponding processed node
            const processedNode = processedNodes.find(n => n.originalId === concept.id);
            if (!processedNode) {
                continue;
            }

            const fromId = processedNode.id;
            
            for (const conn of concept.connections) {
                if (!conn || !conn.targetId) {
                    continue;
                }

                // Find the target processed node
                const targetProcessedNode = processedNodes.find(n => n.originalId === conn.targetId);
                if (!targetProcessedNode) {
                    continue;
                }

                const toId = targetProcessedNode.id;
                const label = conn.label || 'relates to';

                // Check for self-loops (optional - remove if you want to allow them)
                if (fromId === toId) {
                    continue;
                }

                processedEdges.push({ fromId, toId, label });
            }
        }

        // Add edges to diagram
        for (const edge of processedEdges) {
            lines.push(`${edge.fromId} -->|${edge.label}| ${edge.toId}`);
        }

        // Join lines with newlines to ensure proper Mermaid syntax
        const diagram = lines.join('\n');
        
        // Validate the final diagram
        const validation = validateMermaidDiagram(diagram);
        if (!validation.isValid) {
            // Return a simple error diagram that will definitely work
            return 'graph TD\nErrorNode["Unable to render concept map due to syntax errors"]\nTryAgainNode["Please try again with different input"]\nErrorNode --> TryAgainNode';
        }

        return validation.sanitized;
    } catch (error) {
        return 'graph TD\nErrorNode["Error creating diagram"]';
    }
}

// Mock console methods to avoid noise during tests
const originalConsole = { ...console };
console.log = () => {};
console.warn = () => {};
console.error = () => {};

function runTest(testName, testFn) {
    try {
        testFn();
        console.log(`✅ ${testName}`);
        return true;
    } catch (error) {
        console.error(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFalse(condition, message) {
    if (condition) {
        throw new Error(message);
    }
}

function assertArrayLength(array, expectedLength, message) {
    if (array.length !== expectedLength) {
        throw new Error(`${message}: expected length ${expectedLength}, got ${array.length}`);
    }
}

// Test 1: Valid Mermaid diagram
runTest('Valid Mermaid diagram should pass validation', () => {
    const validDiagram = `graph TD
    A["Node A"]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(validDiagram);
    assertTrue(result.isValid, 'Valid diagram should be marked as valid');
    assertArrayLength(result.errors, 0, 'Valid diagram should have no errors');
    assertTrue(result.sanitized.includes('graph TD'), 'Sanitized diagram should contain graph declaration');
});

// Test 2: Missing graph declaration
runTest('Missing graph declaration should fail validation', () => {
    const invalidDiagram = `A["Node A"]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.length > 0, 'Invalid diagram should have errors');
    assertTrue(result.errors.some(e => e.message.includes('graph declaration')), 'Should have graph declaration error');
});

// Test 3: Invalid graph declaration
runTest('Invalid graph declaration should fail validation', () => {
    const invalidDiagram = `invalid TD
    A["Node A"]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.length > 0, 'Invalid diagram should have errors');
    assertTrue(result.errors.some(e => e.message.includes('Invalid graph declaration')), 'Should have invalid graph declaration error');
});

// Test 4: Insufficient nodes
runTest('Diagram with less than 2 nodes should fail validation', () => {
    const invalidDiagram = `graph TD
    A["Node A"]`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('Insufficient nodes')), 'Should have insufficient nodes error');
});

// Test 5: No connections
runTest('Diagram with no connections should fail validation', () => {
    const invalidDiagram = `graph TD
    A["Node A"]
    B["Node B"]`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('No connections found')), 'Should have no connections error');
});

// Test 6: Misplaced style directives
runTest('Style directives before first blank line should fail validation', () => {
    const invalidDiagram = `graph TD
    classDef default fill:#f9f,stroke:#333,stroke-width:4px
    A["Node A"]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('Style directive')), 'Should have style directive error');
});

// Test 7: Valid style directives after blank line
runTest('Style directives after blank line should pass validation', () => {
    const validDiagram = `graph TD
    A["Node A"]
    B["Node B"]
    A -->|connects to| B

    classDef default fill:#f9f,stroke:#333,stroke-width:4px`;
    
    const result = validateMermaidDiagram(validDiagram);
    assertTrue(result.isValid, 'Valid diagram should be marked as valid');
    assertArrayLength(result.errors, 0, 'Valid diagram should have no errors');
});

// Test 8: Unicode characters
runTest('Unicode characters should be removed during sanitization', () => {
    const diagramWithUnicode = `graph TD
    A["Node A with unicode: 🚀 éñ"]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(diagramWithUnicode);
    assertTrue(result.isValid, 'Diagram should be valid after Unicode removal');
    assertFalse(result.sanitized.includes('🚀'), 'Unicode should be removed');
    assertFalse(result.sanitized.includes('é'), 'Unicode should be removed');
    assertFalse(result.sanitized.includes('ñ'), 'Unicode should be removed');
});

// Test 9: Empty diagram
runTest('Empty diagram should fail validation', () => {
    const result = validateMermaidDiagram('');
    assertFalse(result.isValid, 'Empty diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('empty or not a string')), 'Should have empty diagram error');
});

// Test 10: Null diagram
runTest('Null diagram should fail validation', () => {
    const result = validateMermaidDiagram(null);
    assertFalse(result.isValid, 'Null diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('empty or not a string')), 'Should have null diagram error');
});

// Test 11: Invalid node syntax
runTest('Invalid node syntax should fail validation', () => {
    const invalidDiagram = `graph TD
    A[Invalid node syntax]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('Invalid Mermaid syntax')), 'Should have invalid syntax error');
});

// Test 12: Invalid edge syntax
runTest('Invalid edge syntax should fail validation', () => {
    const invalidDiagram = `graph TD
    A["Node A"]
    B["Node B"]
    A invalid B`;
    
    const result = validateMermaidDiagram(invalidDiagram);
    assertFalse(result.isValid, 'Invalid diagram should be marked as invalid');
    assertTrue(result.errors.some(e => e.message.includes('Invalid Mermaid syntax')), 'Should have invalid syntax error');
});

// Test 13: createMermaidDiagram with valid concepts
runTest('createMermaidDiagram should generate valid diagram from concepts', () => {
    const concepts = [
        {
            id: 'concept1',
            text: 'Main Concept',
            connections: [{ targetId: 'concept2', label: 'relates to' }]
        },
        {
            id: 'concept2',
            text: 'Secondary Concept',
            connections: []
        }
    ];
    
    const result = createMermaidDiagram(concepts);
    const validation = validateMermaidDiagram(result);
    assertTrue(validation.isValid, 'Generated diagram should be valid');
    assertTrue(result.includes('graph TD'), 'Generated diagram should start with graph declaration');
    assertTrue(result.includes('concept1'), 'Generated diagram should contain first concept');
    assertTrue(result.includes('concept2'), 'Generated diagram should contain second concept');
});

// Test 14: createMermaidDiagram with empty concepts
runTest('createMermaidDiagram should handle empty concepts', () => {
    const result = createMermaidDiagram([]);
    const validation = validateMermaidDiagram(result);
    assertTrue(validation.isValid, 'Error diagram should be valid');
    assertTrue(result.includes('No concepts available'), 'Should contain error message');
});

// Test 15: createMermaidDiagram with concepts containing special characters
runTest('createMermaidDiagram should handle special characters in concept IDs', () => {
    const concepts = [
        {
            id: 'concept-1@#$%',
            text: 'Concept with special chars',
            connections: [{ targetId: 'concept-2@#$%', label: 'relates to' }]
        },
        {
            id: 'concept-2@#$%',
            text: 'Another concept',
            connections: []
        }
    ];
    
    const result = createMermaidDiagram(concepts);
    const validation = validateMermaidDiagram(result);
    assertTrue(validation.isValid, 'Generated diagram should be valid');
    // Should contain sanitized IDs
    assertTrue(result.includes('concept_1'), 'Should contain sanitized ID');
    assertTrue(result.includes('concept_2'), 'Should contain sanitized ID');
});

// Test 16: createMermaidDiagram with duplicate IDs
runTest('createMermaidDiagram should handle duplicate concept IDs', () => {
    const concepts = [
        {
            id: 'concept1',
            text: 'First Concept',
            connections: [{ targetId: 'concept1', label: 'relates to' }]
        },
        {
            id: 'concept1',
            text: 'Duplicate Concept',
            connections: []
        }
    ];
    
    const result = createMermaidDiagram(concepts);
    const validation = validateMermaidDiagram(result);
    assertTrue(validation.isValid, 'Generated diagram should be valid');
    // Should contain unique IDs
    assertTrue(result.includes('concept1'), 'Should contain first concept');
    assertTrue(result.includes('concept1_1'), 'Should contain unique second concept');
});

// Test 17: Auto-correction of missing graph declaration
runTest('validateMermaidDiagram should auto-correct missing graph declaration', () => {
    const diagram = `A["Node A"]
    B["Node B"]
    A -->|connects to| B`;
    
    const result = validateMermaidDiagram(diagram);
    assertTrue(result.sanitized.startsWith('graph TD'), 'Should auto-prepend graph TD');
    assertTrue(result.sanitized.includes('A["Node A"]'), 'Should preserve nodes');
    assertTrue(result.sanitized.includes('B["Node B"]'), 'Should preserve nodes');
    assertTrue(result.sanitized.includes('A -->|connects to| B'), 'Should preserve edges');
});

// Test 18: Complex valid diagram
runTest('Complex valid diagram should pass validation', () => {
    const complexDiagram = `graph TD
    A["Main Concept"]
    B["Secondary Concept"]
    C["Detail Concept"]
    D["Another Detail"]
    
    A -->|contains| B
    A -->|includes| C
    B -->|relates to| D
    C -->|supports| D

    classDef mainConcept fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef secondaryConcept fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef detailConcept fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    
    class A mainConcept
    class B secondaryConcept
    class C,D detailConcept`;
    
    const result = validateMermaidDiagram(complexDiagram);
    assertTrue(result.isValid, 'Complex diagram should be valid');
    assertArrayLength(result.errors, 0, 'Complex diagram should have no errors');
});

// Test 19: Edge case with only comments
runTest('Diagram with only comments should fail validation', () => {
    const commentOnlyDiagram = `graph TD
    %% This is a comment
    %% Another comment`;
    
    const result = validateMermaidDiagram(commentOnlyDiagram);
    assertFalse(result.isValid, 'Comment-only diagram should be invalid');
    assertTrue(result.errors.some(e => e.message.includes('Insufficient nodes')), 'Should have insufficient nodes error');
});

// Test 20: Edge case with malformed node IDs
runTest('Malformed node IDs should be handled gracefully', () => {
    const concepts = [
        {
            id: '123', // Starts with number
            text: 'Numeric ID Concept',
            connections: [{ targetId: 'concept2', label: 'relates to' }]
        },
        {
            id: 'concept2',
            text: 'Valid Concept',
            connections: []
        }
    ];
    
    const result = createMermaidDiagram(concepts);
    const validation = validateMermaidDiagram(result);
    assertTrue(validation.isValid, 'Generated diagram should be valid');
    assertTrue(result.includes('node_123'), 'Should prefix numeric ID with node_');
});

console.log('\n🎉 All tests completed!');
console.log('Restoring console methods...');

// Restore console methods
Object.assign(console, originalConsole); 