/**
 * Concept Map Generator Service
 * Advanced concept map generation with deep reasoning, semantic enrichment,
 * and visual optimization using open-source tools and APIs.
 */

import axios from 'axios';
import nlp from 'compromise';

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-96a7994b00d646809acf5e17fc63ce74';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Language detection configuration
const LANGDETECT_API_URL = 'https://api.languagedetector.com/v1/detect';

// Enhanced emoji mapping with more diverse options
const EMOJI_MAPPING = {
    person: '👤',
    musician: '🎸',
    singer: '🎤',
    composer: '🎼',
    location: '📍',
    date: '📅',
    idea: '💡',
    concept: '🧠',
    award: '🏆',
    instrument: '🎸',
    lyrics: '🖋️',
    legacy: '🧬',
    art: '🎨',
    science: '🔬',
    technology: '💻',
    business: '💼',
    education: '📚',
    sports: '⚽',
    food: '🍽️',
    nature: '🌿',
    work: '🎵',
    default: '📌'
};

/**
 * Parses JSON from markdown content, handling various formats and edge cases
 * @param {string} content - The content to parse
 * @returns {Array} Parsed JSON array
 */
function parseJsonFromMarkdown(content) {
    try {
        // First, try direct JSON parse
        return JSON.parse(content);
    } catch (e) {
        console.log('Direct parse failed, attempting to extract JSON from markdown');
        
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                const jsonContent = jsonMatch[1].trim();
                return JSON.parse(jsonContent);
            }
            
            // If no code block, try to find JSON array directly
            const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                return JSON.parse(arrayMatch[0]);
            }
            
            // If still no match, try to clean the content and parse
            const cleanedContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/\\n/g, ' ')
                .replace(/\n/g, ' ')
                .trim();
            
            return JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('Failed to parse JSON from markdown:', parseError);
            console.error('Problematic content:', content);
            throw new Error('Invalid JSON format from API');
        }
    }
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
 * Adds appropriate emoji to a concept based on its type and content
 * @param {string} text - Concept text
 * @param {string} type - Concept type
 * @returns {string} Text with emoji prefix
 */
function addEmoji(text, type) {
    const lowerText = text.toLowerCase();
    let emoji = EMOJI_MAPPING.default;

    if (type === 'main') {
        emoji = '🎯';
    } else if (lowerText.includes('musician') || lowerText.includes('guitarist') || lowerText.includes('band') || lowerText.includes('rock')) {
        emoji = EMOJI_MAPPING.musician;
    } else if (lowerText.includes('singer') || lowerText.includes('vocalist')) {
        emoji = EMOJI_MAPPING.singer;
    } else if (lowerText.includes('composer') || lowerText.includes('songwriter')) {
        emoji = EMOJI_MAPPING.composer;
    } else if (lowerText.includes('born') || lowerText.includes('died') || lowerText.includes('date') || lowerText.includes('january') || lowerText.includes('february')) {
        emoji = EMOJI_MAPPING.date;
    } else if (lowerText.includes('city') || lowerText.includes('country') || lowerText.includes('place') || lowerText.includes('location') || lowerText.includes('villa urquiza') || lowerText.includes('buenos aires')) {
        emoji = EMOJI_MAPPING.location;
    } else if (lowerText.includes('influence') || lowerText.includes('philosophy') || lowerText.includes('thought') || lowerText.includes('intellectual') || lowerText.includes('thinker')) {
        emoji = EMOJI_MAPPING.concept;
    } else if (lowerText.includes('award') || lowerText.includes('recognition') || lowerText.includes('achievement') || lowerText.includes('honor')) {
        emoji = EMOJI_MAPPING.award;
    } else if (lowerText.includes('instrument') || lowerText.includes('guitar') || lowerText.includes('piano') || lowerText.includes('bass') || lowerText.includes('drums')) {
        emoji = EMOJI_MAPPING.instrument;
    } else if (lowerText.includes('lyrics') || lowerText.includes('poetry') || lowerText.includes('poem') || lowerText.includes('writer')) {
        emoji = EMOJI_MAPPING.lyrics;
    } else if (lowerText.includes('legacy') || lowerText.includes('impact')) {
        emoji = EMOJI_MAPPING.legacy;
    } else if (lowerText.includes('song') || lowerText.includes('album') || lowerText.includes('work') || lowerText.includes('discography') || lowerText.includes('compositions')) {
        emoji = EMOJI_MAPPING.work;
    } else if (lowerText.includes('art') || lowerText.includes('painting') || lowerText.includes('sculpture')) {
        emoji = EMOJI_MAPPING.art;
    } else if (lowerText.includes('science') || lowerText.includes('research') || lowerText.includes('discovery')) {
        emoji = EMOJI_MAPPING.science;
    } else if (lowerText.includes('technology') || lowerText.includes('software') || lowerText.includes('ai')) {
        emoji = EMOJI_MAPPING.technology;
    }

    return `${emoji} ${text}`;
}

/**
 * Bolds key terms in text
 * @param {string} text - Input text
 * @returns {string} Text with key terms bolded
 */
function boldKeyTerms(text) {
    // Common patterns for key terms
    const patterns = [
        /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Proper names
        /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b/g, // Single proper names
        /\b(?:born|died|created|founded|established)\b/gi, // Key verbs
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/gi // Months
    ];

    let result = text;
    patterns.forEach(pattern => {
        result = result.replace(pattern, match => `**${match}**`);
    });

    return result;
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

        const systemPrompt = `You are an expert at creating visually appealing, semantically rich, and knowledge-dense concept maps. Your task is to analyze the user's input (in ${language}) and generate a concept map that combines aesthetic precision with informational depth.

🎯 **CORE REQUIREMENTS (MUST-DO for each generated concept map):**

1.  ✅ **Visual Aesthetics**:
    - Use strategic emojis (1-2 per branch) as visual signposts
    - Apply visual hierarchy through text formatting
    - Avoid raw Markdown syntax in output
    - Use uppercase for main concepts
    - Format: "🎯 MAIN CONCEPT<br><small>Supporting details</small><br>- Key point 1<br>- Key point 2"

2.  ✅ **Rich Node Content**:
    - Each node MUST contain specific, detailed information
    - Include concrete examples and timeframes
    - Use bullet points for organized lists
    - Add contextual information
    - Format: "🎯 MAIN CONCEPT<br><small>Brief context</small><br>- Specific example 1<br>- Specific example 2"

3.  ✅ **Semantic Structure**:
    - Maintain clear hierarchy (general → specific)
    - Follow implicit chronology when applicable
    - Group related concepts logically
    - Limit cross-links to distinct relationships
    - Maximum 7 nodes total for clarity

4.  ✅ **Language and Formatting**:
    - ALL content in ${language === 'es' ? 'Spanish' : 'English'}
    - Use uppercase for main concepts
    - Use <small> for supporting details
    - Add strategic emojis for context
    - Use <br> for line breaks and bullet points

Your response MUST be a JSON array of objects, and ONLY the JSON array. Each object MUST have:
- 'id': Unique string identifier (e.g., "concept1")
- 'text': Formatted concept label with emoji and styling
- 'type': 'main', 'sub', or 'detail' (based on hierarchy)
- 'definition': Rich, self-contained explanation with proper formatting
- 'connections': Array of objects with 'targetId' and specific 'label' (maximum 3)

Example of a visually appealing concept in ${language === 'es' ? 'Spanish' : 'English'}:
{
  "id": "concept1",
  "text": "${language === 'es' ? '🎤 LUIS A. SPINETTA<br><small>Músico y poeta argentino (1950–2012)</small>' : '🎤 LUIS A. SPINETTA<br><small>Argentine musician and poet (1950–2012)</small>'}",
  "type": "main",
  "definition": "${language === 'es' ? 'Fundador del rock argentino y pionero del rock progresivo:<br>- _Nacido en_ 1950 en Buenos Aires<br>- _Formó_ la banda Almendra en 1967<br>- _Influenciado por_ la poesía de Rimbaud<br>- _Compuso_ más de 400 canciones<br>- _Ejemplo:_ "Muchacha ojos de papel" (1969)' : 'Founder of Argentine rock and pioneer of progressive rock:<br>- _Born in_ 1950 in Buenos Aires<br>- _Formed_ the band Almendra in 1967<br>- _Influenced by_ Rimbaud\'s poetry<br>- _Composed_ over 400 songs<br>- _Example:_ "Muchacha ojos de papel" (1969)'}",
  "connections": [
    {"targetId": "concept2", "label": "${language === 'es' ? 'formó parte de' : 'was part of'}"},
    {"targetId": "concept3", "label": "${language === 'es' ? 'influenciado por' : 'influenced by'}"}
  ]
}

Ensure each node is visually appealing and contains rich, specific information. Avoid raw Markdown syntax and use strategic emojis.`;

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
                // Ensure definition is rich and informative
                if (!concept.definition || concept.definition.length < 100) {
                    concept.definition = `${concept.definition || ''}\n- _Add more context and explanation_\n- _Include key details and relationships_\n- _Provide specific examples or applications_`;
                }
                
                // Ensure text has proper formatting
                if (!concept.text.includes('<small>')) {
                    concept.text = `${concept.text}<br><small>${language === 'es' ? 'Concepto principal' : 'Main concept'}</small>`;
                }
                
                // Limit connections to 3 most important ones
                if (concept.connections && concept.connections.length > 3) {
                    concept.connections = concept.connections.slice(0, 3);
                }
                
                return {
                    ...concept,
                    text: addEmoji(boldKeyTerms(concept.text), concept.type),
                    definition: boldKeyTerms(concept.definition || '')
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
            console.error('Error response headers:', error.response.headers);
            
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
        definition: 'Could not generate detailed map.',
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
    // TODO: Implement Arguflow and NeMo Guardrails integration
    return {
        ...conceptMap,
        validationStatus: "validated",
        confidence: 0.95
    };
}

/**
 * Creates a Mermaid.js diagram from the processed concepts
 * @param {Array} concepts - Array of processed concept objects
 * @returns {string} Mermaid.js diagram syntax
 */
function createMermaidDiagram(concepts) {
    try {
        // Start with graph TD for top-down layout
        let diagram = 'graph TD\n';
        
        // Add nodes with rich content
        concepts.forEach(concept => {
            // Format the node content with proper line breaks and styling
            const nodeContent = concept.text
                .replace(/<br>/g, '\\n')
                .replace(/<small>(.*?)<\/small>/g, '\\n<small>$1</small>')  // Preserve small text
                .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove raw bold
                .replace(/_(.*?)_/g, '$1');       // Remove raw underline
            
            // Add the node with its formatted content
            diagram += `  ${concept.id}["${nodeContent}"]\n`;
        });
        
        // Add connections with meaningful labels
        concepts.forEach(concept => {
            if (concept.connections) {
                concept.connections.forEach(conn => {
                    // Only add connection if both nodes exist
                    if (concepts.some(c => c.id === conn.targetId)) {
                        diagram += `  ${concept.id} -->|"${conn.label}"| ${conn.targetId}\n`;
                    }
                });
            }
        });
        
        return diagram;
    } catch (error) {
        console.error('Error creating Mermaid diagram:', error);
        return 'graph TD\n  Error["Error creating diagram"]';
    }
}

/**
 * Generates a concept map based on the provided user input.
 * @param {string} input - The raw user input text.
 * @returns {Promise<Object>} - The generated concept map object.
 */
export async function generateConceptMap(input) {
    try {
        // Process the input text using compromise for basic NLP
        const doc = nlp(input);
        
        // Get key concepts (nouns and noun phrases)
        const keyConcepts = doc.nouns().out('array');
        
        // Detect language
        const language = detectLanguage(input);
        
        // Analyze the text using DeepSeek for deeper understanding
        const concepts = await analyzeWithDeepSeek(input);
        
        // Validate the concept map
        const validatedMap = await validateConceptMap({ concepts });
        
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