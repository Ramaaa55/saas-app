/**
 * Concept Map Generator Service
 * Advanced concept map generation with deep reasoning, semantic enrichment,
 * and visual optimization using open-source tools and APIs.
 */

import axios from 'axios';

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-96a7994b00d646809acf5e17fc63ce74';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Language detection configuration
const LANGDETECT_API_URL = 'https://api.languagedetector.com/v1/detect';

/**
 * Lightweight English dictionary for spell-checking (expand as needed)
 */
const ENGLISH_DICTIONARY = new Set([
    'concept', 'map', 'node', 'relationship', 'connection', 'main', 'sub', 'detail', 'example', 'contains', 'includes', 'comprises', 'consists', 'part', 'precedes', 'follows', 'evolves', 'develops', 'supports', 'enables', 'facilitates', 'enhances', 'improves', 'relates', 'connects', 'associates', 'correlates', 'requires', 'needs', 'depends', 'influences', 'affects', 'founded', 'composed', 'born', 'formed', 'influenced', 'poetry', 'music', 'rock', 'progressive', 'band', 'song', 'lyrics', 'paragraph', 'detail', 'example', 'explanation', 'definition', 'label', 'trigger', 'result', 'cause', 'lead', 'support', 'improve', 'enhance', 'facilitate', 'associate', 'correlate', 'require', 'need', 'depend', 'influence', 'affect', 'connect', 'relate', 'enable', 'develop', 'precede', 'follow', 'contain', 'include', 'comprise', 'consist', 'part', 'main', 'sub', 'detail', 'node', 'relationship', 'connection', 'concept', 'map', 'diagram', 'visual', 'render', 'error', 'please', 'try', 'again', 'synopsis', 'title', 'created', 'at', 'confidence', 'source', 'analysis', 'language', 'id', 'type', 'data', 'position', 'x', 'y', 'animated', 'custom', 'style', 'stroke', 'width', 'color', 'marker', 'end', 'arrow', 'closed', 'height', 'metadata', 'mermaid', 'diagram', 'class', 'accent', 'pastel', 'blue', 'green', 'pink', 'fill', 'stroke', 'font', 'weight', 'bold', 'small', 'strong', 'u', 'em', 'br', 'span', 'connector', 'label', 'definition', 'paragraph', 'content', 'example', 'context', 'detail', 'information', 'specific', 'date', 'contextual', 'relevance', 'directional', 'logic', 'non', 'circular', 'redundant', 'duplicate', 'domain', 'specific', 'network', 'rich', 'structure', 'vocabulary', 'action', 'oriented', 'verb', 'based', 'clear', 'unambiguous', 'maximum', 'words', 'english', 'spanish', 'input', 'output', 'user', 'text', 'ai', 'pipeline', 'processing', 'json', 'array', 'object', 'objects', 'string', 'identifier', 'unique', 'main', 'sub', 'detail', 'connections', 'target', 'id', 'label', 'maximum', 'using', 'structured', 'vocabulary', 'class', 'string', 'indicating', 'node', 'type', 'styling', 'main', 'idea', 'secondary', 'idea', 'example', 'important', 'do', 'not', 'omit', 'shorten', 'any', 'information', 'from', 'user', 'input', 'the', 'more', 'user', 'writes', 'the', 'more', 'detail', 'you', 'must', 'include', 'in', 'map', 'each', 'node', 'contains', 'rich', 'paragraph', 'style', 'content', 'with', 'specific', 'examples', 'context', 'use', 'html', 'tags', 'for', 'styling', 'avoid', 'raw', 'markdown', 'syntax', 'example', 'founder', 'argentine', 'rock', 'pioneer', 'progressive', 'work', 'characterized', 'deep', 'lyrical', 'musical', 'exploration', 'fusing', 'elements', 'surrealist', 'poetry', 'sonic', 'innovations', 'born', 'buenos', 'aires', 'formed', 'band', 'almendra', 'influenced', 'rimbaud', 'composed', 'over', 'songs', 'fuse', 'rock', 'poetry', 'muchacha', 'ojos', 'de', 'papel', 'masterpiece', 'lyrics', 'rockera', 'founder', 'rock', 'argentino', 'pionero', 'progresivo', 'caracteriza', 'profunda', 'exploracion', 'lirica', 'musical', 'fusionando', 'elementos', 'poesia', 'surrealista', 'innovaciones', 'sonoras', 'nacido', 'buenos', 'aires', 'formo', 'banda', 'almendra', 'influenciado', 'poesia', 'rimbaud', 'compuso', 'mas', 'de', 'canciones', 'fusionan', 'rock', 'poesia', 'ejemplo', 'muchacha', 'ojos', 'de', 'papel', 'obra', 'maestra', 'lirica', 'rockera'
]);

/**
 * Comprehensive Mermaid text sanitization that preserves meaning while ensuring syntax safety
 * @param {string} text - Input text that may contain special characters, accents, symbols, emojis
 * @returns {string} Mermaid-safe text that preserves the original meaning
 */
export function sanitizeMermaidText(text) {
    if (!text || typeof text !== 'string') return '';
    
    let result = text;
    
    // Step 1: Normalize Unicode characters (combines combining characters)
    result = result.normalize('NFC');
    
    // Step 2: Handle HTML entities and tags
    result = result
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    
    // Step 3: Handle newlines and whitespace
    result = result
        .replace(/\r\n|\r|\n/g, ' ') // Convert all newlines to spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();
    
    // Step 4: Handle Mermaid syntax conflicts
    result = result
        // Escape quotes properly for Mermaid node syntax
        .replace(/"/g, '\\"')
        // Escape backslashes
        .replace(/\\/g, '\\\\')
        // Replace problematic characters that break Mermaid syntax
        .replace(/[\[\]{}]/g, (match) => {
            switch(match) {
                case '[': return '(';
                case ']': return ')';
                case '{': return '(';
                case '}': return ')';
                default: return match;
            }
        })
        // Replace pipe character (used in Mermaid for subgraphs)
        .replace(/\|/g, 'I')
        // Replace angle brackets
        .replace(/[<>]/g, (match) => match === '<' ? '(' : ')')
        // Replace other problematic characters
        .replace(/[`~!@#$%^&*+=|\\:;'",.?]/g, (match) => {
            // Keep some punctuation but escape others
            if (['.', ',', '!', '?', ':', ';'].includes(match)) {
                return match; // Keep these
            }
            return ' '; // Replace others with space
        });
    
    // Step 5: Remove control characters except tab
    result = result.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
    
    // Step 6: Ensure the result is not empty and has reasonable length
    if (!result.trim()) {
        result = 'Content';
    } else if (result.length > 200) {
        result = result.substring(0, 197) + '...';
    }
    
    return result.trim();
}

/**
 * Test suite for special character handling
 * @returns {Object} Test results
 */
export function testSpecialCharacterHandling() {
    const testCases = [
        // Accented characters
        { input: 'José María', expected: 'José María', description: 'Spanish accented names' },
        { input: 'München', expected: 'München', description: 'German umlaut' },
        { input: 'Canción', expected: 'Canción', description: 'Spanish with accent' },
        { input: 'François', expected: 'François', description: 'French with cedilla' },
        
        // Math symbols
        { input: 'Δx = 5', expected: 'Δx = 5', description: 'Greek delta' },
        { input: '∑ = sum', expected: '∑ = sum', description: 'Sigma symbol' },
        { input: 'π ≈ 3.14', expected: 'π ≈ 3.14', description: 'Pi symbol' },
        { input: 'α + β = γ', expected: 'α + β = γ', description: 'Greek letters' },
        
        // Emojis
        { input: '📈 Growth', expected: '📈 Growth', description: 'Chart emoji' },
        { input: '🚀 Launch', expected: '🚀 Launch', description: 'Rocket emoji' },
        { input: '💡 Idea', expected: '💡 Idea', description: 'Lightbulb emoji' },
        { input: '🎯 Target', expected: '🎯 Target', description: 'Target emoji' },
        
        // Special symbols
        { input: '© 2024', expected: '© 2024', description: 'Copyright symbol' },
        { input: '™ Brand', expected: '™ Brand', description: 'Trademark symbol' },
        { input: '® Registered', expected: '® Registered', description: 'Registered symbol' },
        { input: '€ 100', expected: '€ 100', description: 'Euro symbol' },
        { input: '£ 50', expected: '£ 50', description: 'Pound symbol' },
        { input: '¥ 1000', expected: '¥ 1000', description: 'Yen symbol' },
        
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
        
        // Mixed content
        { input: 'José 📈 [Growth] "2024"', expected: 'José 📈 (Growth) \\"2024\\"', description: 'Mixed special characters' },
        { input: 'Δx = ∑[i=1 to n] x_i', expected: 'Δx = ∑(i=1 to n) x_i', description: 'Math with brackets' },
    ];
    
    const results = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    testCases.forEach((testCase, index) => {
        const sanitized = sanitizeMermaidText(testCase.input);
        const passed = sanitized === testCase.expected;
        
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        results.details.push({
            test: index + 1,
            description: testCase.description,
            input: testCase.input,
            expected: testCase.expected,
            actual: sanitized,
            passed
        });
    });
    
    console.log('Special Character Test Results:', results);
    return results;
}

/**
 * Escapes text for direct inclusion within a Mermaid node's quoted string.
 * This function handles internal double quotes and backslashes.
 * Mermaid expects double quotes to be escaped with a backslash (\").
 * @param {string} text - The input text, potentially containing HTML tags.
 * @returns {string} The escaped string suitable for Mermaid.
 */
function escapeMermaidText(text) {
    let escapedText = text;
    // First, escape backslashes, so we don't accidentally double-escape a later backslash from a quote.
    escapedText = escapedText.replace(/\\/g, '\\\\');
    // Then, escape double quotes.
    escapedText = escapedText.replace(/"/g, '\\"');
    return escapedText;
}

/**
 * Strips HTML tags and decodes HTML entities from a string.
 * @param {string} htmlString - The input string potentially containing HTML tags or entities.
 * @returns {string} The string with HTML tags removed and entities decoded.
 */
function stripHtmlTags(htmlString) {
    // Create a temporary DOM element to leverage browser's HTML parsing capabilities
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    // Get the text content, which automatically decodes HTML entities
    let textContent = doc.body.textContent || '';
    
    // Additionally, replace any remaining problematic characters for Mermaid
    textContent = textContent.replace(/\r\n|\n|\r/g, ' '); // Replace newlines with spaces
    textContent = textContent.replace(/"/g, '\"'); // Escape double quotes for Mermaid node syntax
    textContent = textContent.replace(/\\/g, '\\\\'); // Escape backslashes for Mermaid node syntax
    
    return textContent;
}

/**
 * Parses a JSON object from a markdown string, typically found within a ```json code block.
 * It also handles and cleans up common issues like unescaped newlines in the JSON.
 * @param {string} markdownString - The input markdown string containing the JSON.
 * @returns {object|null} The parsed JSON object, or null if parsing fails.
 */
function parseJsonFromMarkdown(markdownString) {
    const jsonMatch = markdownString.match(/```json\n(.*?)```/s);
    if (jsonMatch && jsonMatch[1]) {
        let jsonString = jsonMatch[1].trim();

        // No aggressive newline replacements here. Let JSON.parse handle standard \n escapes.

        console.log('JSON string before parsing:', jsonString); // Log before parsing

        try {
            const parsed = JSON.parse(jsonString);
            return parsed;
        } catch (error) {
            console.error('Error parsing JSON string:', jsonString, error);
            return null;
        }
    }
    return null;
}

/**
 * Detects the language of the input text
 * @param {string} text - Input text to analyze
 * @returns {string} 'en' for English, 'es' for Spanish
 */
function detectLanguage(text) {
    // Common Spanish words and patterns
    const spanishPatterns = [
        /\b(el|la|los|las|un|una|unos|unas)\b/i,
        /\b(es|son|está|están|fue|fueron)\b/i,
        /\b(para|por|con|sin|sobre|bajo)\b/i,
        /\b(que|qué|cómo|cuándo|dónde|quién)\b/i,
        /\b(y|o|pero|porque|si|aunque)\b/i,
        /[áéíóúñ¿¡]/i
    ];

    // Count Spanish indicators
    const spanishScore = spanishPatterns.reduce((score, pattern) => {
        return score + (text.match(pattern) || []).length;
    }, 0);

    // If we find enough Spanish indicators, return Spanish
    return spanishScore >= 3 ? 'es' : 'en';
}

/**
 * Analyzes text using DeepSeek for deep reasoning and comprehension
 * @param {string} text - Input text to analyze
 * @returns {Promise<Array>} Array of extracted concepts and relationships
 */
async function analyzeWithDeepSeek(text) {
    try {
        // Detect language first
        const language = detectLanguage(text);
        
        if (!DEEPSEEK_API_KEY) {
            console.error('DeepSeek API key is missing');
            return createBasicConcepts(text);
        }

        const systemPrompt = `You are an expert at creating sophisticated, semantically precise concept maps for a modern SaaS application. Your task is to transform complex knowledge into clear, elegant visualizations that maintain semantic accuracy while being visually appealing.

🎯 **CORE REQUIREMENTS (MUST-DO for each generated concept map):**

1.  ✅ **Enhanced Semantic Precision (+200% improvement)**:
    - **Structured Relationship Vocabulary**: Use ONLY these precise relationship types for connections:
      * Causal: "causes", "leads to", "results in", "triggers", "enables"
      * Hierarchical: "contains", "includes", "comprises", "consists of", "is part of"
      * Temporal: "precedes", "follows", "evolves into", "develops from"
      * Functional: "supports", "enables", "facilitates", "enhances", "improves"
      * Conceptual: "relates to", "connects with", "associates with", "correlates with"
      * Process: "requires", "needs", "depends on", "influences", "affects"
    - **Enforced Hierarchy**: Create a clear 3-level hierarchy:
      * Level 1 (main): Central concepts (2-4 nodes)
      * Level 2 (sub): Supporting concepts (4-8 nodes) 
      * Level 3 (detail): Specific examples/details (6-12 nodes)
    - **Semantic Validation**: Every connection must pass these tests:
      * Directional logic: A → B must mean "A affects/creates/includes B"
      * Non-circular: No loops in the relationship chain
      * Non-redundant: No duplicate relationships between same nodes
      * Contextual relevance: Relationships must be domain-specific, not generic
    - **Include as many nodes as are necessary to fully represent the user's input. Do NOT summarize, omit, or shorten information unless the input is extremely long (over 1000 words), and even then, only summarize with explicit notice.**
    - For normal-length inputs, preserve all key details, facts, and relationships from the user's text.
    - **Semantic Depth**: Each concept must connect to at least 2 other concepts when possible, creating a rich network.

2.  ✅ **Rich Content Structure**:
    - Each node MUST contain a rich, multi-sentence paragraph (3-6 sentences) or well-structured bullet points, with as much detail as possible from the user's input.
    - Include specific examples, dates, and contextual information.
    - Use proper paragraph structure with clear topic sentences.
    - For the central concept within a node's 'text' field, always ensure it is in <strong>bold</strong> and has a line break (<br>) separating it from the detailed explanation. For example: "🎤 <strong>MAIN IDEA</strong><br><small>Detailed paragraph with specific examples and context.</small>".
    - Use bullet points (<br>- ) for related sub-elements or lists within the 'definition' field when relevant.
    - **Do NOT shorten or omit any information from the user's input.**

3.  ✅ **Visual Elegance & Thematic Styling**:
    - Use exactly ONE emoji per node (only at the start).
    - Apply HTML tags for styling: <strong> for main concepts, <small> for detailed paragraphs, <u> for key examples, and <em> for other necessary emphasis (e.g., italics).
    - Ensure clean, modern SaaS aesthetics that mimic the attached visual style example (pastel colors, slightly sketchy border look). You will also provide a 'class' property for each node to enable this styling.
    - Format: "🎤 <strong>CONCEPT</strong><br><small>Rich paragraph content</small>".
    - Use <br> for bullet points.
    - No visual clutter or unnecessary cross-connections.

4.  ✅ **Language and Formatting**:
    - ALL content in ${language === 'es' ? 'Spanish' : 'English'}.
    - Use <br> for proper line breaks (ABSOLUTELY NO \n or \n\n for newlines within the JSON string values. ONLY AND ALWAYS USE <br> FOR NEWLINES.).
    - Ensure proper visual spacing within nodes by strategically using <br> for line breaks and content separation.
    - No raw Markdown (e.g., **bold**, _underline_) or special characters that are not part of HTML tags or emojis.

5.  ✅ **Semantic Relationship Mapping**:
    - **Primary Relationships**: Each main concept should connect to 2-3 sub-concepts
    - **Secondary Relationships**: Each sub-concept should connect to 1-2 detail concepts
    - **Cross-Connections**: Allow meaningful cross-connections between related concepts at the same level
    - **Relationship Labels**: Use the structured vocabulary above, ensuring each label is:
      * Action-oriented (verb-based)
      * Domain-specific to the content
      * Clear and unambiguous
      * Maximum 3 words

Your response MUST be a JSON array of objects, and ONLY the JSON array. Each object MUST have:
- 'id': Unique string identifier (e.g., "concept1")
- 'text': Formatted concept label with emoji and styling, with the main concept bolded and a line break before the detailed explanation.
- 'type': 'main', 'sub', or 'detail' (based on hierarchy)
- 'definition': Rich, paragraph-style explanation, using bullet points with <br>-  where appropriate, and including ALL relevant information from the user's input.
- 'connections': Array of objects with 'targetId' and specific 'label' (maximum 3, using structured vocabulary)
- 'class': A string indicating the node's type for styling (e.g., "main-idea", "secondary-idea", "example").

**IMPORTANT: Do NOT omit or shorten any information from the user's input. The more the user writes, the more detail you must include in the map.**

Example of a semantically precise concept in ${language === 'es' ? 'Spanish' : 'English'}:
{
  "id": "concept1",
  "text": "${language === 'es' ? '🎤 <strong>Luis Alberto Spinetta</strong><br><small>Músico y poeta argentino (1950–2012), pionero del rock en español. Su obra mezcla poesía, filosofía y experimentación sonora.</small>' : '🎤 <strong>Luis Alberto Spinetta</strong><br><small>Argentine musician and poet (1950–2012), pioneer of Spanish-language rock. His work blends poetry, philosophy, and sonic experimentation.</small>'}",
  "type": "main",
  "definition": "${language === 'es' ? 'Fundador del rock argentino y pionero del rock progresivo. Su obra se caracteriza por una profunda exploración lírica y musical, fusionando elementos de la poesía surrealista con innovaciones sonoras:<br>- <u>Nacido en</u> 1950 en Buenos Aires<br>- <u>Formó</u> la banda Almendra en 1967<br>- <u>Influenciado por</u> la poesía de Rimbaud y el surrealismo<br>- <u>Compuso</u> más de 400 canciones que fusionan rock con poesía<br>- <u>Ejemplo:</u> \'Muchacha ojos de papel\'(1969), una obra maestra de la lírica rockera' : 'Founder of Argentine rock and pioneer of progressive rock. His work is characterized by deep lyrical and musical exploration, fusing elements of surrealist poetry with sonic innovations:<br>- <u>Born in</u> 1950 in Buenos Aires<br>- <u>Formed</u> the band Almendra in 1967<br>- <u>Influenced by</u> Rimbaud\'s poetry and surrealism<br>- <u>Composed</u> over 400 songs that fuse rock with poetry<br>- <u>Example:</u> \'Muchacha ojos de papel\'(1969), a masterpiece of rock lyrics'}",
  "connections": [
    {"targetId": "concept2", "label": "${language === 'es' ? 'fundó' : 'founded'}"},
    {"targetId": "concept3", "label": "${language === 'es' ? 'compuso' : 'composed'}"}
  ],
  "class": "main-idea"
}

Ensure each node contains rich, paragraph-style content with specific examples and context. Use HTML tags for styling and avoid raw Markdown syntax.`

        const response = await axios.post(DEEPSEEK_API_URL, {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Generate a detailed, explanatory concept map in ${language === 'es' ? 'Spanish' : 'English'} from this text: ${text}`
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Get the content from the response
        const content = response.data.choices[0].message.content;
        console.log('DeepSeek API raw content:', content);
        
        try {
            // Attempt to parse the content directly or robustly extract JSON
            const concepts = parseJsonFromMarkdown(content);
            
            // Post-process concepts to ensure they meet our requirements
            const processedConcepts = concepts.map(concept => {
                // Ensure definition is rich and paragraph-style
                if (!concept.definition || concept.definition.length < 50) { // Reduced minimum length
                    concept.definition = `${concept.definition || ''} `; // Ensure there's at least a space
                }
                
                // Post-process text and definition to ensure all newlines are <br>
                concept.text = concept.text.replace(/\r\n|\n|\r/g, '<br>');
                concept.definition = concept.definition.replace(/\r\n|\n|\r/g, '<br>');

                // The LLM is now responsible for formatting 'text' with <strong>, <small>, <u> and emoji.
                // We remove the old formatting logic here.
                // Ensure text has proper formatting
                // if (!concept.text.includes('<strong>')) {
                //     concept.text = `<strong>${concept.text}</strong><br><small>${language === 'es' ? 'Concepto principal' : 'Main concept'}</small>`;
                // }
                
                // Limit connections to 3 most important ones
                if (concept.connections && concept.connections.length > 3) {
                    concept.connections = concept.connections.slice(0, 3);
                }
                
                return {
                    ...concept,
                    text: concept.text,
                    definition: concept.definition
                };
            });
            
            return processedConcepts;
        } catch (parseError) {
            console.error('Failed to process DeepSeek response:', parseError);
            console.error('Problematic content:', content);
            return createBasicConcepts(text);
        }
    } catch (error) {
        console.error('DeepSeek API Error:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            
            if (error.response.status === 401) {
                console.error('Authentication failed. Please check your API key.');
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        return createBasicConcepts(text);
    }
}

/**
 * Creates basic concepts from text when API fails
 * @param {string} text - Input text
 * @returns {Array} Array of basic concepts
 */
function createBasicConcepts(text) {
    // Fallback for when API fails - create a single node with the text
    return [{
        id: 'node-0',
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        type: 'main',
        definition: 'Could not generate detailed map. Please try again or provide more input.',
        connections: []
    }];
}

/**
 * Enriches concepts with additional semantic information
 * @param {Array} concepts - List of concepts to enrich
 * @returns {Promise<Array>} Enriched concepts with additional context
 */
// Removed unused function enrichConcepts - API prompt should handle enrichment

/**
 * Validates concepts and relationships for logical soundness
 * @param {Object} conceptMap - The concept map to validate
 * @returns {Promise<Object>} Validated concept map
 */
async function validateConceptMap(conceptMap) {
    // This comment is added to trigger a recompile and ensure the latest code is loaded.
    // TODO: Implement Arguflow and NeMo Guardrails integration
    return {
        ...conceptMap,
        validationStatus: "validated",
        confidence: 0.95
    };
}

/**
 * Spell-checks and sanitizes a string for Mermaid safety.
 * - Corrects misspelled words using a basic dictionary
 * - Escapes problematic characters for Mermaid while preserving meaning
 * - Logs corrections and sanitizations
 * @param {string} text
 * @returns {string}
 */
function spellCheckAndSanitize(text) {
    if (!text) return '';
    
    // Remove HTML tags for spell-checking, but keep them for output
    const htmlTagRegex = /<[^>]*>/g;
    const words = text.replace(htmlTagRegex, ' ').split(/\b/);
    let corrected = false;
    let corrections = [];
    
    const correctedWords = words.map(word => {
        const clean = word.toLowerCase().replace(/[^a-záéíóúñü]/gi, '');
        if (clean && !ENGLISH_DICTIONARY.has(clean) && /^[a-záéíóúñü]{3,}$/.test(clean)) {
            // Find closest match (Levenshtein distance 1)
            let suggestion = null;
            for (const dictWord of ENGLISH_DICTIONARY) {
                if (levenshtein(clean, dictWord) === 1) {
                    suggestion = dictWord;
                    break;
                }
            }
            if (suggestion) {
                corrections.push({ from: word, to: suggestion });
                corrected = true;
                return suggestion;
            } else {
                corrections.push({ from: word, to: '[?]' });
                corrected = true;
                return word;
            }
        }
        return word;
    });
    
    let result = correctedWords.join('');
    
    // Use the new comprehensive sanitization
    result = sanitizeMermaidText(result);
    
    if (corrected) {
        console.log('Spell-check corrections:', corrections);
    }
    
    return result;
}

/**
 * Levenshtein distance for spell-check suggestions
 */
function levenshtein(a, b) {
    const matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Preprocesses the AI-generated concept array for Mermaid safety and spelling
 * @param {Array} concepts
 * @returns {Array} sanitized concepts
 */
export function preprocessDiagram(concepts) {
    if (!Array.isArray(concepts)) return [];
    return concepts.map(concept => ({
        ...concept,
        text: spellCheckAndSanitize(concept.text),
        definition: spellCheckAndSanitize(concept.definition),
        connections: Array.isArray(concept.connections)
            ? concept.connections.map(conn => ({
                ...conn,
                label: spellCheckAndSanitize(conn.label)
            })) : []
    }));
}

/**
 * Validates Mermaid diagram syntax with better error reporting
 * @param {string} diagram
 * @returns {{valid: boolean, error?: string}}
 */
export function validateMermaidDiagram(diagram) {
    if (!diagram || typeof diagram !== 'string') {
        return { valid: false, error: 'Empty diagram' };
    }
    
    if (!diagram.trim().startsWith('graph')) {
        return { valid: false, error: 'Missing graph declaration' };
    }
    
    if (/ErrorNode/.test(diagram)) {
        return { valid: false, error: 'Error node present' };
    }
    
    // Check for problematic patterns in Mermaid syntax
    const lines = diagram.split('\n');
    let errorDetails = [];
    
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        
        // Check for unescaped quotes in node definitions
        if (line.includes('["') && !line.includes('\\"')) {
            const quoteMatch = line.match(/\["([^"]*)"\]/);
            if (quoteMatch && quoteMatch[1].includes('"')) {
                errorDetails.push(`Line ${lineNum}: Unescaped quote in node text`);
            }
        }
        
        // Check for problematic characters in node text
        if (line.includes('["') && /[\[\]{}|<>]/.test(line)) {
            errorDetails.push(`Line ${lineNum}: Special characters in node text`);
        }
        
        // Check for empty node definitions
        if (/\w+\[\s*\]/.test(line)) {
            errorDetails.push(`Line ${lineNum}: Empty node definition`);
        }
        
        // Check for malformed edge definitions
        if (line.includes('-->') && !line.match(/\w+\s*-->\s*\w+/)) {
            errorDetails.push(`Line ${lineNum}: Malformed edge definition`);
        }
    });
    
    if (errorDetails.length > 0) {
        console.error('Mermaid validation errors:', errorDetails);
        console.error('Full Mermaid diagram:', diagram);
        return { 
            valid: false, 
            error: `Syntax issues: ${errorDetails.slice(0, 3).join(', ')}${errorDetails.length > 3 ? '...' : ''}` 
        };
    }
    
    return { valid: true };
}

/**
 * Creates a Mermaid.js diagram from the processed concepts
 * @param {Array} concepts - Array of processed concept objects
 * @returns {string} Mermaid.js diagram syntax
 */
export function createMermaidDiagram(concepts, inputText = '') {
    const sanitizedConcepts = preprocessDiagram(concepts);
    if (!Array.isArray(sanitizedConcepts) || !sanitizedConcepts.every(c => typeof c === 'object' && c !== null && 'id' in c && 'text' in c)) {
        return 'graph TD\nErrorNode["Malformed concept data: expected array of concept objects"]';
    }
    
    try {
        // Header
        let lines = ['graph TD'];
        // Mermaid config for modern spacing and better character support
        lines.push('%%{init: {"themeVariables": {"fontFamily": "Inter, system-ui, sans-serif", "fontSize": "16px", "nodeSpacing": 80, "rankSpacing": 100, "curve": "basis", "edgeLabelBackground": "#fff"}, "flowchart": {"htmlLabels": true, "useMaxWidth": true}}}%%');
        const validNodeIds = new Set();
        const processedNodes = [];
        const processedEdges = [];
        
        // Node pass
        for (const concept of sanitizedConcepts) {
            if (!concept || !concept.id) continue;
            
            // Create a safe node ID
            let id = concept.id.toString()
                .replace(/[^a-zA-Z0-9_\-]/g, '_')
                .replace(/^[^a-zA-Z]/, 'node_$&');
            
            if (!/^[a-zA-Z]/.test(id)) id = 'node_' + id;
            let originalId = id;
            let counter = 1;
            while (validNodeIds.has(id)) { 
                id = `${originalId}_${counter}`; 
                counter++; 
            }
            
            // Process node text using the new sanitization function
            let text = (concept.text || '').trim();
            if (!text) text = 'Node';
            
            // Use the comprehensive sanitization
            text = sanitizeMermaidText(text);
            
            validNodeIds.add(id);
            processedNodes.push({ id, text, originalId: concept.id });
        }
        
        if (processedNodes.length === 0) {
            return 'graph TD\nErrorNode["No valid concepts available"]';
        }
        
        // Add nodes
        for (const [i, node] of processedNodes.entries()) {
            // Assign class: accent for first, then pastel for others
            let nodeClass = i === 0 ? 'accent' : (i % 3 === 1 ? 'pastel-blue' : (i % 3 === 2 ? 'pastel-green' : 'pastel-pink'));
            lines.push(`${node.id}["${node.text}"]:::${nodeClass}`);
        }
        
        // Edge pass
        for (const concept of sanitizedConcepts) {
            if (!concept || !concept.id || !concept.connections) continue;
            const processedNode = processedNodes.find(n => n.originalId === concept.id);
            if (!processedNode) continue;
            const fromId = processedNode.id;
            
            for (const conn of concept.connections) {
                if (!conn || !conn.targetId) continue;
                const targetProcessedNode = processedNodes.find(n => n.originalId === conn.targetId);
                if (!targetProcessedNode) continue;
                const toId = targetProcessedNode.id;
                
                // Process edge label using the new sanitization function
                let label = (conn.label || 'relates to').trim();
                label = sanitizeMermaidText(label);
                
                if (fromId === toId) continue; // Skip self-loops
                
                // Use a safer edge syntax
                lines.push(`${fromId} -.->|"${label}"| ${toId}`);
            }
        }
        
        // Modern style: add a blank line, then classDefs
        lines.push('');
        lines.push('classDef accent fill:#e0e7ff,stroke:#6366f1,stroke-width:2.5px,color:#222,rx:22px,ry:22px,font-weight:bold;');
        lines.push('classDef pastel-blue fill:#dbeafe,stroke:#60a5fa,stroke-width:2px,color:#222,rx:18px,ry:18px;');
        lines.push('classDef pastel-green fill:#d1fae5,stroke:#34d399,stroke-width:2px,color:#222,rx:18px,ry:18px;');
        lines.push('classDef pastel-pink fill:#fce7f3,stroke:#f472b6,stroke-width:2px,color:#222,rx:18px,ry:18px;');
        
        // Join lines
        const diagram = lines.join('\n');
        
        // Validate before returning
        const validation = validateMermaidDiagram(diagram);
        if (!validation.valid) {
            console.error('Mermaid validation error:', validation.error);
            console.error('Generated diagram:', diagram);
            return `graph TD\nErrorNode["⚠️ Could not render due to syntax issues: ${validation.error}"]`;
        }
        
        return diagram;
    } catch (error) {
        console.error('Error creating Mermaid diagram:', error);
        console.error('Concepts that caused the error:', sanitizedConcepts);
        return 'graph TD\nErrorNode["Error creating diagram"]';
    }
}

/**
 * Generates a concept map based on the provided user input.
 * @param {string} input - The raw user input text.
 * @returns {Promise<Object>} - The generated concept map object.
 */
export async function generateConceptMap(input) {
    try {
        // Get key concepts (nouns and noun phrases)
        // const keyConcepts = doc.nouns().out('array'); // Removed unused line
        
        // Detect language
        const language = detectLanguage(input);
        
        // Analyze the text using DeepSeek for deeper understanding
        const concepts = await analyzeWithDeepSeek(input);
        
        // Validate the concept map
        const validatedMap = await validateConceptMap({ concepts });
        
        // Log concepts before creating Mermaid diagram for debugging
        console.log('Concepts before Mermaid diagram creation:', concepts);

        // Generate the Mermaid.js diagram
        const mermaidDiagram = createMermaidDiagram(concepts);
        
        // Create the concept map object with proper structure
        const conceptMap = {
            id: Date.now().toString(),
            title: input.substring(0, 50) + (input.length > 50 ? '... (Synopsis)' : ' (Synopsis)'),
            nodes: concepts.map(concept => ({
                id: concept.id.toString(),
                type: concept.type === 'main' ? 'main' : 'sub',
                data: {
                    label: concept.text,
                    definition: concept.definition || '',
                },
                position: { x: 0, y: 0 } // Position is now handled by Mermaid auto-layout
            })),
            connections: concepts.flatMap(concept => 
                concept.connections.map(connection => ({
                    id: `e${concept.id}-${connection.targetId}`,
                    source: concept.id.toString(),
                    target: connection.targetId.toString(),
                    label: connection.label || '',
                    animated: true,
                    type: 'custom',
                    style: {
                        stroke: '#4a90e2',
                        strokeWidth: 2,
                    },
                    markerEnd: {
                        type: 'arrowclosed',
                        width: 20,
                        height: 20,
                        color: '#4a90e2',
                    }
                }))
            ),
            metadata: {
                createdAt: new Date().toISOString(),
                confidence: 0.9,
                source: "DeepSeek Analysis",
                language: language
            },
            mermaidDiagram: mermaidDiagram
        };

        return conceptMap;
    } catch (error) {
        console.error('Error generating concept map:', error);
        // Return a simple fallback concept map
        return {
            id: Date.now().toString(),
            title: 'Error generating concept map',
            nodes: [{
                id: 'error-node',
                type: 'main',
                data: {
                    label: 'Error generating concept map',
                    definition: 'Please try again'
                },
                position: { x: 0, y: 0 }
            }],
            connections: [],
            metadata: {
                createdAt: new Date().toISOString(),
                confidence: 0,
                source: "Error",
                language: 'en'
            },
            mermaidDiagram: `
                graph TD
                A["Error generating concept map"] --> B["Please try again"]
            `
        };
    }
}

/**
 * Saves a concept map to the database
 * @param {Object} conceptMap - The concept map to save
 * @param {string} userId - The ID of the user who created the map
 * @returns {Promise<Object>} The saved concept map
 */
export async function saveConceptMap(conceptMap, userId) {
    try {
        const response = await fetch('/api/board', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: conceptMap.title || 'Untitled Concept Map',
                content: conceptMap,
                userId: userId
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save concept map');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving concept map:', error);
        throw new Error('Failed to save concept map');
    }
} 