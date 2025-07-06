/**
 * Test suite for special character handling in concept map generation
 * Run with: node services/conceptMapGenerator.test.js
 */

import { sanitizeMermaidText, testSpecialCharacterHandling, createMermaidDiagram } from './conceptMapGenerator.js';

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
 * Test Mermaid syntax validation
 */
function testMermaidSyntaxValidation() {
    console.log = originalConsole.log;
    console.log('\n🧪 Testing Mermaid syntax validation...\n');
    
    const validDiagram = `
graph TD
A["José María"] --> B["Δx = 5"]
B --> C["© 2024"]
    `.trim();
    
    const invalidDiagram = `
graph TD
A["Node with [brackets]"] --> B["Node with {braces}"]
    `.trim();
    
    try {
        // Test valid diagram
        const validResult = createMermaidDiagram([
            { id: 'A', text: 'José María', type: 'main', connections: [{ targetId: 'B', label: 'connects' }] },
            { id: 'B', text: 'Δx = 5', type: 'sub', connections: [{ targetId: 'C', label: 'equals' }] },
            { id: 'C', text: '© 2024', type: 'detail', connections: [] }
        ]);
        
        if (!validResult.includes('ErrorNode')) {
            console.log('✅ Valid Mermaid syntax: PASSED');
        } else {
            console.log('❌ Valid Mermaid syntax: FAILED');
            console.log('Result:', validResult);
        }
        
        // Test invalid diagram (should be sanitized)
        const invalidResult = createMermaidDiagram([
            { id: 'A', text: 'Node with [brackets]', type: 'main', connections: [{ targetId: 'B', label: 'connects' }] },
            { id: 'B', text: 'Node with {braces}', type: 'sub', connections: [] }
        ]);
        
        if (!invalidResult.includes('ErrorNode')) {
            console.log('✅ Invalid syntax sanitization: PASSED');
        } else {
            console.log('❌ Invalid syntax sanitization: FAILED');
            console.log('Result:', invalidResult);
        }
        
    } catch (error) {
        console.log('❌ Mermaid syntax validation: FAILED');
        console.log('Error:', error.message);
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
        syntaxTests: testMermaidSyntaxValidation()
    };
    
    console.log('\n📋 Test Summary:');
    console.log(`- Sanitization: ${results.sanitizeTests.passed}/${results.sanitizeTests.total} passed`);
    console.log(`- Generation: ${results.generationTests ? 'PASSED' : 'FAILED'}`);
    console.log(`- Syntax: ${results.syntaxTests ? 'PASSED' : 'FAILED'}`);
    
    const allPassed = results.sanitizeTests.failed === 0 && results.generationTests && results.syntaxTests;
    
    if (allPassed) {
        console.log('\n🎉 All tests passed! Special character handling is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the output above.');
    }
    
    return allPassed;
}

// Export for use in other files
export { testSanitizeMermaidText, testConceptMapGeneration, testMermaidSyntaxValidation, runAllTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    runAllTests();
} 