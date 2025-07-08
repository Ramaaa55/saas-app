/**
 * Test suite for special character handling in concept map generation
 * Run with: node services/conceptMapGenerator.test.js
 */

const { sanitizeMermaidText, testSpecialCharacterHandling, createMermaidDiagram } = require('./conceptMapGenerator.js');

// Mock console methods for testing
const originalConsole = { ...console };
console.log = () => {};
console.error = () => {};
console.warn = () => {};

/**
 * Unit tests for sanitizeMermaidText function
 */
function testSanitizeMermaidText() {
    console.log = originalConsole.log;
    console.log('\n🧪 Testing sanitizeMermaidText function...\n');
    
    const testCases = [
        // Accented characters - should be preserved
        { input: 'José María', expected: 'José María', description: 'Spanish accented names' },
        { input: 'München', expected: 'München', description: 'German umlaut' },
        { input: 'Canción', expected: 'Canción', description: 'Spanish with accent' },
        { input: 'François', expected: 'François', description: 'French with cedilla' },
        { input: 'São Paulo', expected: 'São Paulo', description: 'Portuguese with tilde' },
        
        // Math symbols - should be preserved
        { input: 'Δx = 5', expected: 'Δx = 5', description: 'Greek delta' },
        { input: '∑ = sum', expected: '∑ = sum', description: 'Sigma symbol' },
        { input: 'π ≈ 3.14', expected: 'π ≈ 3.14', description: 'Pi symbol' },
        { input: 'α + β = γ', expected: 'α + β = γ', description: 'Greek letters' },
        { input: '∞ infinity', expected: '∞ infinity', description: 'Infinity symbol' },
        
        // Emojis - should be preserved
        { input: '📈 Growth', expected: '📈 Growth', description: 'Chart emoji' },
        { input: '🚀 Launch', expected: '🚀 Launch', description: 'Rocket emoji' },
        { input: '💡 Idea', expected: '💡 Idea', description: 'Lightbulb emoji' },
        { input: '🎯 Target', expected: '🎯 Target', description: 'Target emoji' },
        { input: '🌟 Star', expected: '🌟 Star', description: 'Star emoji' },
        
        // Special symbols - should be preserved
        { input: '© 2024', expected: '© 2024', description: 'Copyright symbol' },
        { input: '™ Brand', expected: '™ Brand', description: 'Trademark symbol' },
        { input: '® Registered', expected: '® Registered', description: 'Registered symbol' },
        { input: '€ 100', expected: '€ 100', description: 'Euro symbol' },
        { input: '£ 50', expected: '£ 50', description: 'Pound symbol' },
        { input: '¥ 1000', expected: '¥ 1000', description: 'Yen symbol' },
        { input: '¢ 25', expected: '¢ 25', description: 'Cent symbol' },
        
        // Problematic characters that should be converted
        { input: 'Node [with] brackets', expected: 'Node (with) brackets', description: 'Square brackets' },
        { input: 'Node {with} braces', expected: 'Node (with) braces', description: 'Curly braces' },
        { input: 'Node | with | pipe', expected: 'Node I with I pipe', description: 'Pipe characters' },
        { input: 'Node <with> angles', expected: 'Node (with) angles', description: 'Angle brackets' },
        
        // Quotes and escaping
        { input: 'Node "with" quotes', expected: 'Node \\"with\\" quotes', description: 'Double quotes' },
        { input: 'Node with\\backslash', expected: 'Node with\\\\backslash', description: 'Backslashes' },
        
        // HTML entities
        { input: 'Node &amp; entity', expected: 'Node & entity', description: 'HTML ampersand entity' },
        { input: 'Node &lt;html&gt;', expected: 'Node (html)', description: 'HTML tag entities' },
        { input: 'Node &quot;quotes&quot;', expected: 'Node \\"quotes\\"', description: 'HTML quote entities' },
        
        // Mixed content
        { input: 'José 📈 [Growth] "2024"', expected: 'José 📈 (Growth) \\"2024\\"', description: 'Mixed special characters' },
        { input: 'Δx = ∑[i=1 to n] x_i', expected: 'Δx = ∑(i=1 to n) x_i', description: 'Math with brackets' },
        { input: '© José & María <3', expected: '© José & María (3', description: 'Mixed symbols and accents' },
        
        // Edge cases
        { input: '', expected: 'Content', description: 'Empty string' },
        { input: '   ', expected: 'Content', description: 'Whitespace only' },
        { input: 'A'.repeat(300), expected: 'A'.repeat(197) + '...', description: 'Very long string' },
        { input: 'Line1\nLine2\nLine3', expected: 'Line1 Line2 Line3', description: 'Multiple newlines' },
        { input: 'Tab\there', expected: 'Tab\there', description: 'Tab character preserved' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const sanitized = sanitizeMermaidText(testCase.input);
        const testPassed = sanitized === testCase.expected;
        
        if (testPassed) {
            passed++;
            console.log(`✅ Test ${index + 1}: ${testCase.description}`);
        } else {
            failed++;
            console.log(`❌ Test ${index + 1}: ${testCase.description}`);
            console.log(`   Input: "${testCase.input}"`);
            console.log(`   Expected: "${testCase.expected}"`);
            console.log(`   Actual: "${sanitized}"`);
        }
    });
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
    return { passed, failed, total: testCases.length };
}

/**
 * Integration tests for full concept map generation
 */
function testConceptMapGeneration() {
    console.log = originalConsole.log;
    console.log('\n🧪 Testing full concept map generation...\n');
    
    const testConcepts = [
        {
            id: 'concept1',
            text: 'José María 📈',
            type: 'main',
            definition: 'Spanish name with emoji',
            connections: [
                { targetId: 'concept2', label: 'connects to' }
            ]
        },
        {
            id: 'concept2',
            text: 'Δx = ∑[i=1 to n] x_i',
            type: 'sub',
            definition: 'Math formula with brackets',
            connections: [
                { targetId: 'concept3', label: 'equals' }
            ]
        },
        {
            id: 'concept3',
            text: '© 2024 José & María',
            type: 'detail',
            definition: 'Copyright with special characters',
            connections: []
        }
    ];
    
    try {
        const diagram = createMermaidDiagram(testConcepts);
        
        // Check if diagram was generated successfully
        if (diagram && !diagram.includes('ErrorNode')) {
            console.log('✅ Concept map generation with special characters: PASSED');
            console.log('Generated diagram preview:', diagram.substring(0, 200) + '...');
            return true;
        } else {
            console.log('❌ Concept map generation with special characters: FAILED');
            console.log('Generated diagram:', diagram);
            return false;
        }
    } catch (error) {
        console.log('❌ Concept map generation with special characters: FAILED');
        console.log('Error:', error.message);
        return false;
    }
}

/**
 * Test Mermaid syntax validation with comprehensive edge cases
 */
function testMermaidSyntaxValidation() {
    console.log = originalConsole.log;
    console.log('\n🧪 Testing Mermaid syntax validation...\n');
    
    // Test valid diagram generation
    const validConcepts = [
        { id: 'A', text: 'José María', type: 'main', connections: [{ targetId: 'B', label: 'connects' }] },
        { id: 'B', text: 'Δx = 5', type: 'sub', connections: [{ targetId: 'C', label: 'equals' }] },
        { id: 'C', text: '© 2024', type: 'detail', connections: [] }
    ];
    
    try {
        const validResult = createMermaidDiagram(validConcepts);
        
        if (!validResult.includes('ErrorNode')) {
            console.log('✅ Valid Mermaid syntax: PASSED');
            console.log('Generated diagram preview:', validResult.substring(0, 200) + '...');
        } else {
            console.log('❌ Valid Mermaid syntax: FAILED');
            console.log('Result:', validResult);
        }
        
        // Test edge syntax specifically
        const edgeTestConcepts = [
            { id: 'A', text: 'Start', type: 'main', connections: [{ targetId: 'B', label: 'leads to' }] },
            { id: 'B', text: 'End', type: 'sub', connections: [] }
        ];
        
        const edgeResult = createMermaidDiagram(edgeTestConcepts);
        if (edgeResult.includes('A -->|"leads to"| B')) {
            console.log('✅ Edge syntax: PASSED');
        } else {
            console.log('❌ Edge syntax: FAILED');
            console.log('Expected: A -->|"leads to"| B');
            console.log('Got:', edgeResult);
        }
        
        // Test node syntax specifically
        const nodeTestConcepts = [
            { id: 'A', text: 'Test Node', type: 'main', connections: [] }
        ];
        
        const nodeResult = createMermaidDiagram(nodeTestConcepts);
        if (nodeResult.includes('A["Test Node"]:::accent')) {
            console.log('✅ Node syntax: PASSED');
        } else {
            console.log('❌ Node syntax: FAILED');
            console.log('Expected: A["Test Node"]:::accent');
            console.log('Got:', nodeResult);
        }
        
        // Test classDef syntax
        if (nodeResult.includes('classDef accent fill:#e0e7ff,stroke:#6366f1,stroke-width:2.5px,color:#222,rx:22px,ry:22px,font-weight:bold')) {
            console.log('✅ ClassDef syntax: PASSED');
        } else {
            console.log('❌ ClassDef syntax: FAILED');
            console.log('Result:', nodeResult);
        }
        
        // Test invalid diagram (should be sanitized)
        const invalidConcepts = [
            { id: 'A', text: 'Node with [brackets]', type: 'main', connections: [{ targetId: 'B', label: 'connects' }] },
            { id: 'B', text: 'Node with {braces}', type: 'sub', connections: [] }
        ];
        
        const invalidResult = createMermaidDiagram(invalidConcepts);
        
        if (!invalidResult.includes('ErrorNode')) {
            console.log('✅ Invalid syntax sanitization: PASSED');
        } else {
            console.log('❌ Invalid syntax sanitization: FAILED');
            console.log('Result:', invalidResult);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Mermaid syntax validation: FAILED');
        console.log('Error:', error.message);
        return false;
    }
}

/**
 * Test comprehensive Mermaid diagram generation with various scenarios
 */
function testComprehensiveDiagramGeneration() {
    console.log = originalConsole.log;
    console.log('\n🧪 Testing comprehensive diagram generation...\n');
    
    const testScenarios = [
        {
            name: 'Single node',
            concepts: [{ id: 'A', text: 'Single Node', type: 'main', connections: [] }]
        },
        {
            name: 'Two connected nodes',
            concepts: [
                { id: 'A', text: 'Start', type: 'main', connections: [{ targetId: 'B', label: 'connects' }] },
                { id: 'B', text: 'End', type: 'sub', connections: [] }
            ]
        },
        {
            name: 'Complex network',
            concepts: [
                { id: 'A', text: 'Main Concept', type: 'main', connections: [{ targetId: 'B', label: 'includes' }, { targetId: 'C', label: 'relates to' }] },
                { id: 'B', text: 'Sub Concept 1', type: 'sub', connections: [{ targetId: 'D', label: 'contains' }] },
                { id: 'C', text: 'Sub Concept 2', type: 'sub', connections: [{ targetId: 'D', label: 'supports' }] },
                { id: 'D', text: 'Detail', type: 'detail', connections: [] }
            ]
        },
        {
            name: 'Special characters',
            concepts: [
                { id: 'A', text: 'José 📈 [Growth]', type: 'main', connections: [{ targetId: 'B', label: 'Δx = 5' }] },
                { id: 'B', text: '© 2024 & María', type: 'sub', connections: [] }
            ]
        }
    ];
    
    // Add more edge cases for special characters and multiline
    const extraEdgeCases = [
        {
            name: 'Emoji and accents',
            concepts: [
                { id: 'A', text: '🎨 Van Gogh "producción"', type: 'main', connections: [{ targetId: 'B', label: 'influye en' }] },
                { id: 'B', text: '🛏️ Psiquiátricos', type: 'sub', connections: [] }
            ]
        },
        {
            name: 'Quotes and parentheses',
            concepts: [
                { id: 'A', text: 'Node with "quotes" and (parentheses)', type: 'main', connections: [{ targetId: 'B', label: 'relates to' }] },
                { id: 'B', text: 'Node (with) [brackets]', type: 'sub', connections: [] }
            ]
        },
        {
            name: 'Multiline and complex',
            concepts: [
                { id: 'A', text: 'Line1\nLine2\nLine3', type: 'main', connections: [{ targetId: 'B', label: 'spans' }] },
                { id: 'B', text: 'Complex: "Δx = 5" & emojis 🚀', type: 'sub', connections: [] }
            ]
        },
        {
            name: 'Invalid node/edge (should auto-correct)',
            concepts: [
                { id: 'A', text: '', type: 'main', connections: [{ targetId: 'B', label: '' }] },
                { id: 'B', text: 'Valid', type: 'sub', connections: [] }
            ]
        }
    ];
    testScenarios.push(...extraEdgeCases);
    
    let allPassed = true;
    
    testScenarios.forEach((scenario, index) => {
        try {
            const result = createMermaidDiagram(scenario.concepts);
            
            // Check for basic validity
            const isValid = result.startsWith('graph TD') && !result.includes('ErrorNode');
            
            if (isValid) {
                console.log(`✅ ${scenario.name}: PASSED`);
            } else {
                console.log(`❌ ${scenario.name}: FAILED`);
                console.log('Result:', result);
                allPassed = false;
            }
            
            // Additional checks for specific scenarios
            if (scenario.name === 'Two connected nodes') {
                if (!result.includes('A -->|"connects"| B')) {
                    console.log('  ❌ Edge syntax incorrect');
                    allPassed = false;
                }
            }
            
            if (scenario.name === 'Special characters') {
                if (result.includes('José 📈 (Growth)') && result.includes('© 2024 & María')) {
                    console.log('  ✅ Special characters handled correctly');
                } else {
                    console.log('  ❌ Special characters not handled correctly');
                    allPassed = false;
                }
            }
            
        } catch (error) {
            console.log(`❌ ${scenario.name}: FAILED with error: ${error.message}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

/**
 * Test error handling and fallbacks
 */
function testErrorHandling() {
    console.log = originalConsole.log;
    console.log('\n🧪 Testing error handling and fallbacks...\n');
    
    // Test with invalid concepts
    const invalidConcepts = [
        { id: 'A', text: '', type: 'main', connections: [] }, // Empty text
        { id: '', text: 'Valid text', type: 'sub', connections: [] }, // Empty ID
        null, // Null concept
        { id: 'B', text: 'Valid', type: 'sub', connections: [{ targetId: 'nonexistent', label: 'connects' }] } // Invalid connection
    ];
    
    try {
        const result = createMermaidDiagram(invalidConcepts);
        
        // Should handle gracefully and not crash
        if (result && result.startsWith('graph TD')) {
            console.log('✅ Error handling: PASSED - Invalid concepts handled gracefully');
        } else {
            console.log('❌ Error handling: FAILED - Invalid concepts caused crash');
            return false;
        }
        
        // Test with completely invalid input
        const completelyInvalid = 'not an array';
        const invalidResult = createMermaidDiagram(completelyInvalid);
        
        if (invalidResult.includes('ErrorNode') && invalidResult.includes('Malformed concept data')) {
            console.log('✅ Invalid input handling: PASSED');
        } else {
            console.log('❌ Invalid input handling: FAILED');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Error handling: FAILED with exception:', error.message);
        return false;
    }
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log = originalConsole.log;
    console.log('🚀 Starting comprehensive special character tests...\n');
    
    const results = {
        sanitizeTests: testSanitizeMermaidText(),
        generationTests: testConceptMapGeneration(),
        syntaxTests: testMermaidSyntaxValidation(),
        comprehensiveTests: testComprehensiveDiagramGeneration(),
        errorHandling: testErrorHandling()
    };
    
    console.log('\n📋 Test Summary:');
    console.log(`- Sanitization: ${results.sanitizeTests.passed}/${results.sanitizeTests.total} passed`);
    console.log(`- Generation: ${results.generationTests ? 'PASSED' : 'FAILED'}`);
    console.log(`- Syntax: ${results.syntaxTests ? 'PASSED' : 'FAILED'}`);
    console.log(`- Comprehensive: ${results.comprehensiveTests ? 'PASSED' : 'FAILED'}`);
    console.log(`- Error Handling: ${results.errorHandling ? 'PASSED' : 'FAILED'}`);
    
    const allPassed = results.sanitizeTests.failed === 0 && results.generationTests && results.syntaxTests && results.comprehensiveTests && results.errorHandling;
    
    if (allPassed) {
        console.log('\n🎉 All tests passed! Special character handling is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the output above.');
    }
    
    return allPassed;
}

// Replace ES module export with CommonJS module.exports
module.exports = { testSanitizeMermaidText, testConceptMapGeneration, testMermaidSyntaxValidation, testComprehensiveDiagramGeneration, testErrorHandling, runAllTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    runAllTests();
} 