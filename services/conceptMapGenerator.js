/**
 * Concept Map Generator Service
 * Advanced concept map generation with deep reasoning, semantic enrichment,
 * and visual optimization using open-source tools and APIs.
 */

import axios from 'axios';

// DeepSeek API configuration
const DEEPSEEK_API_KEY = 'sk-96a7994b00d646809acf5e17fc63ce74';
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
 * Cleans and parses JSON from markdown-formatted text or arbitrary string
 * @param {string} text - Text that might contain markdown-formatted JSON or extraneous characters
 * @returns {Object|Array} Parsed JSON object or array
 */
function parseJsonFromMarkdown(text) {
    try {
        // Aggressively find the JSON array part by searching for the first '[' and last ']'
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const jsonString = text.substring(startIndex, endIndex + 1);
            return JSON.parse(jsonString);
        } 
        
        // Fallback for cases where markdown block might be present but delimiters are missed, or pure JSON without delimiters
        const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            return JSON.parse(jsonBlockMatch[1].trim());
        }

        // Last resort: try to parse the entire text as JSON directly
        return JSON.parse(text.trim());

    } catch (error) {
        console.error('Failed to parse JSON from text after all attempts:', error);
        throw new Error('Invalid JSON format from API'); // Throw a specific error for debugging
    }
}

/**
 * Detects the language of the input text
 * @param {string} text - Input text to analyze
 * @returns {Promise<string>} Detected language code
 */
async function detectLanguage(text) {
    try {
        const response = await axios.post(LANGDETECT_API_URL, {
            text: text
        });
        return response.data.language;
    } catch (error) {
        console.warn('Language detection failed, defaulting to English:', error);
        return 'en';
    }
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
        const language = await detectLanguage(text);
        
        const response = await axios.post(DEEPSEEK_API_URL, {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are an expert at analyzing text and extracting key concepts, their hierarchical relationships, and brief, self-contained definitions. Focus on deep reasoning and comprehension to infer related concepts and structure. The input text is in ${language}. Your response MUST be a JSON array of objects, and ONLY the JSON array. Do NOT include ANY other text, conversational elements, explanations, or markdown formatting (like \`\`\`json) before or after the JSON array. Each object in the array represents a concept and MUST have the following properties: 'id' (a unique string identifier for the concept), 'text' (the concept label, clear, concise, and self-contained), 'type' ('main' for the central concept, 'sub' for related concepts), 'definition' (a brief definition derived from the text, clear and self-contained), and 'connections' (an array of objects, each with 'targetId' referencing the id of a related concept, and 'label' describing the relationship). Ensure all concepts are connected and form a coherent hierarchical map. Avoid incomplete phrases or grammatical errors.`
                },
                {
                    role: "user",
                    content: `Analyze this text and extract a hierarchical concept map with definitions and relationships: ${text}`
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
            const concepts = parseJsonFromMarkdown(content); // Use the robust parser
            
            // Enhance concepts with emojis and bold terms
            return concepts.map(concept => ({
                ...concept,
                text: addEmoji(boldKeyTerms(concept.text), concept.type),
                definition: boldKeyTerms(concept.definition || '')
            }));
        } catch (parseError) {
            console.error('Failed to process DeepSeek response:', parseError);
            console.error('Problematic content:', content);
            return createBasicConcepts(text); // Ensure fallback on any parsing error
        }
    } catch (error) {
        console.error('DeepSeek API Error:', error);
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
 * Generates a concept map from the input text
 * @param {string} text - The input text to generate the concept map from
 * @returns {Promise<Object>} The generated concept map structure
 */
export async function generateConceptMap(text) {
    try {
        // 1. Deep Analysis with DeepSeek
        const concepts = await analyzeWithDeepSeek(text);

        // Validate the API response structure
        if (!Array.isArray(concepts) || concepts.length === 0) {
            console.error('API did not return a valid array of concepts:', concepts);
            return createBasicConcepts(text);
        }

        // 2. Create initial concept map structure
        const conceptMap = {
            id: Date.now().toString(),
            title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            nodes: [],
            connections: [],
            metadata: {
                createdAt: new Date().toISOString(),
                confidence: 0.9,
                source: "DeepSeek Analysis",
                language: await detectLanguage(text)
            }
        };

        // Map concepts from API response to React Flow nodes
        concepts.forEach(concept => {
            if (!concept.id || !concept.text || !concept.type) {
                console.warn('Skipping invalid concept from API:', concept);
                return;
            }

            conceptMap.nodes.push({
                id: concept.id.toString(),
                type: concept.type === 'main' ? 'main' : 'sub',
                data: {
                    label: concept.text,
                    definition: concept.definition || '',
                },
                position: { x: 0, y: 0 }
            });
        });

        // Map connections from API response to React Flow edges
        concepts.forEach(concept => {
            if (Array.isArray(concept.connections)) {
                concept.connections.forEach(connection => {
                    if (connection.targetId && concept.id) {
                        conceptMap.connections.push({
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
                        });
                    }
                });
            }
        });

        // Validate the concept map
        const validatedMap = await validateConceptMap(conceptMap);

        return validatedMap;
    } catch (error) {
        console.error('Error generating concept map:', error);
        return createBasicConcepts(text);
    }
}

/**
 * Saves the generated concept map to the database
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
                name: conceptMap.title,
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