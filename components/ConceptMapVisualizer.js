"use client";

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const ConceptMapVisualizer = ({ conceptMap }) => {
    const containerRef = useRef(null);
    const [renderError, setRenderError] = useState(null);
    const [isRendering, setIsRendering] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);

    // Extract error message if present
    let errorMessage = null;
    if (conceptMap?.mermaidDiagram && /ErrorNode\["([^"]+)"\]/.test(conceptMap.mermaidDiagram)) {
        const match = conceptMap.mermaidDiagram.match(/ErrorNode\["([^"]+)"\]/);
        errorMessage = match ? match[1] : null;
    }

    useEffect(() => {
        // Configure mermaid with aesthetic settings and better error handling
        mermaid.initialize({
            startOnLoad: false, // We'll render manually
            theme: 'base',
            securityLevel: 'loose',
            flowchart: {
                htmlLabels: true,
                curve: 'basis',
                padding: 20,
                nodeSpacing: 50,
                rankSpacing: 80,
                useMaxWidth: true,
                diagramPadding: 20,
            },
            themeVariables: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                primaryTextColor: '#2D3748',
                primaryBorderColor: '#CBD5E0',
                lineColor: '#A0AEC0',
                secondaryColor: '#EDF2F7',
                tertiaryColor: '#E2E8F0',
                nodeBorder: '#CBD5E0',
                nodeTextColor: '#2D3748',
                clusterBkg: '#F7FAFC',
                clusterBorder: '#E2E8F0',
                edgeLabelBackground: '#F7FAFC',
                tertiaryTextColor: '#2D3748',
                noteBkg: '#FEF3C7',
                noteBorder: '#FBBF24',
                noteTextColor: '#4B5563',
                fillType0: '#F7FAFC',
                fillType1: '#EDF2F7',
                fillType2: '#E2E8F0',
            }
        });

        // Render the diagram with comprehensive error handling
        const renderDiagram = async () => {
            if (!containerRef.current || !conceptMap?.mermaidDiagram || errorMessage) {
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }
                setRenderError(null);
                setErrorDetails(null);
                setIsRendering(false);
                return;
            }

            setIsRendering(true);
            setRenderError(null);
            setErrorDetails(null);

            try {
                // First, try to parse the diagram to catch syntax errors early
                mermaid.parse(conceptMap.mermaidDiagram);
                
                // If parsing succeeds, render the diagram
                const { svg } = await mermaid.render('concept-map', conceptMap.mermaidDiagram);
                
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
                
                setRenderError(null);
                setErrorDetails(null);
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                console.error('Diagram that caused the error:', conceptMap.mermaidDiagram);
                
                // Extract specific error information
                let specificError = 'Unknown syntax error';
                let details = null;
                
                if (error.message) {
                    specificError = error.message;
                    
                    // Try to extract line and column information
                    const lineMatch = error.message.match(/line (\d+)/i);
                    const columnMatch = error.message.match(/column (\d+)/i);
                    
                    if (lineMatch || columnMatch) {
                        details = {
                            line: lineMatch ? parseInt(lineMatch[1]) : null,
                            column: columnMatch ? parseInt(columnMatch[1]) : null,
                            message: error.message
                        };
                    }
                }
                
                // Set user-friendly error message
                setRenderError(`⚠️ Unable to generate concept map due to syntax error.`);
                setErrorDetails(details);
                
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }
            } finally {
                setIsRendering(false);
            }
        };

        renderDiagram();
    }, [conceptMap, errorMessage]);

    if (!conceptMap) {
        return (
            <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
                <p className="text-gray-500">No concept map to display</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto bg-base-100 rounded-lg p-4">
            {/* Display validation errors from the diagram generation */}
            {errorMessage && (
                <div className="mb-4 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-800 font-semibold flex items-center gap-2">
                    <span role="img" aria-label="Warning">⚠️</span>
                    {errorMessage}
                </div>
            )}
            
            {/* Display rendering errors */}
            {renderError && (
                <div className="mb-4 p-4 rounded bg-red-100 border border-red-300 text-red-800">
                    <div className="flex items-center gap-2 font-semibold mb-2">
                        <span role="img" aria-label="Error">❌</span>
                        {renderError}
                    </div>
                    {errorDetails && (
                        <div className="text-sm">
                            <p><strong>Details:</strong> {errorDetails.message}</p>
                            {errorDetails.line && (
                                <p><strong>Location:</strong> Line {errorDetails.line}{errorDetails.column ? `, Column ${errorDetails.column}` : ''}</p>
                            )}
                        </div>
                    )}
                    <div className="mt-3 text-xs text-red-600">
                        <p><strong>Original input:</strong> {conceptMap.title || 'No title'}</p>
                        <p><strong>Generated diagram:</strong> Check browser console for full diagram code</p>
                    </div>
                </div>
            )}
            
            {/* Loading state */}
            {isRendering && (
                <div className="mb-4 p-3 rounded bg-blue-100 border border-blue-300 text-blue-800 font-semibold flex items-center gap-2">
                    <span role="img" aria-label="Loading">⏳</span>
                    Rendering concept map...
                </div>
            )}
            
            <div 
                ref={containerRef} 
                className="concept-map-container"
                style={{
                    minHeight: '400px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            />
        </div>
    );
};

export default ConceptMapVisualizer; 