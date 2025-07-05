"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { toast } from "react-hot-toast";
import { createMermaidDiagram, validateMermaidDiagram } from '@/services/conceptMapGenerator';
import isEqual from 'lodash.isequal';

function MermaidRenderer({ diagram, onNodeDoubleClick, onNodeHover, onNodeHoverLeave, selectedNodeId }) {
    const hostRef = useRef(null);
    const [isRendering, setIsRendering] = useState(true);
    const [renderError, setRenderError] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

    useEffect(() => {
        if (!hostRef.current || !diagram) return;
        let isMounted = true;
        setIsRendering(true);
        setRenderError(null);
        
        // Sanitize the diagram first
        let sanitizedDiagram = cleanMermaidString(diagram);
        if (!sanitizedDiagram || sanitizedDiagram.trim() === '') {
            setRenderError('Empty or invalid diagram after sanitization');
            setIsRendering(false);
            return;
        }
        
        // If the diagram doesn't start with 'graph', it's probably invalid
        if (!sanitizedDiagram.trim().startsWith('graph')) {
            console.warn('Invalid diagram format, using fallback');
            sanitizedDiagram = 'graph TD\nErrorNode["Invalid diagram format"]';
        }
        
        // Pre-validate the diagram before rendering
        try {
            // If we have a diagram but no concepts, it might be a manually created or legacy diagram
            // In this case, we'll be more lenient with validation
            const validation = validateMermaidDiagram(sanitizedDiagram, 'MermaidRenderer');
            if (!validation.valid) {
                console.warn('Diagram validation failed, but attempting to render anyway:', validation.error);
                // Don't fail immediately - let Mermaid try to parse it
            }
        } catch (validationError) {
            console.error('Validation error:', validationError);
            // Don't fail immediately - let Mermaid try to parse it
        }
        
        try {
            mermaid.render('concept-map', sanitizedDiagram)
                .then(({ svg }) => {
                    if (isMounted && hostRef.current) {
                        hostRef.current.innerHTML = svg;

                        // Enhanced event handling for Mermaid elements
                        const nodes = hostRef.current.querySelectorAll('.node');
                        
                        nodes.forEach(node => {
                            // Add click listener to the node group
                            node.addEventListener('click', (e) => {
                                // Prevent event bubbling to avoid conflicts
                                e.stopPropagation();
                                onNodeDoubleClick(node.id);
                            });
                            
                            // Add visual feedback for selected node
                            if (node.id === selectedNodeId) {
                                node.classList.add('selected');
                            } else {
                                node.classList.remove('selected');
                            }

                            // Prevent text selection on nodes
                            const textElements = node.querySelectorAll('text');
                            textElements.forEach(text => {
                                text.style.userSelect = 'none';
                                text.style.pointerEvents = 'none';
                            });

                            node.addEventListener('mouseenter', () => {
                                node.style.transform = 'scale(1.045)';
                                node.style.boxShadow = '0 4px 16px #b6c7e6';
                                if (window.__clarimapEditMode) {
                                    node.style.cursor = 'pointer';
                                    // Add pencil icon overlay
                                    let pencil = document.createElement('span');
                                    pencil.className = 'clarimap-pencil';
                                    pencil.innerHTML = `<svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z"/></svg>`;
                                    pencil.style.position = 'absolute';
                                    pencil.style.right = '8px';
                                    pencil.style.top = '8px';
                                    pencil.style.pointerEvents = 'none';
                                    pencil.style.zIndex = '10';
                                    node.appendChild(pencil);
                                    // Tooltip
                                    node.setAttribute('title', 'Double-click to edit');
                                }
                            });
                            node.addEventListener('mouseleave', () => {
                                node.style.transform = '';
                                node.style.boxShadow = '';
                                // Remove pencil icon
                                let pencil = node.querySelector('.clarimap-pencil');
                                if (pencil) pencil.remove();
                                node.removeAttribute('title');
                            });
                            // Double-click to edit
                            node.addEventListener('dblclick', (e) => {
                                e.stopPropagation();
                                if (!isRendering) return;
                                onNodeDoubleClick(node.id);
                            });
                        });

                        // Handle edge interactions
                        const edgePaths = hostRef.current.querySelectorAll('.edgePath');
                        edgePaths.forEach(edge => {
                            edge.addEventListener('click', (e) => {
                                e.stopPropagation();
                                // Optional: Add edge click handling here
                            });
                        });

                        // Prevent unwanted text selection on the entire diagram
                        const svgElement = hostRef.current.querySelector('svg');
                        if (svgElement) {
                            svgElement.style.userSelect = 'none';
                            svgElement.style.webkitUserSelect = 'none';
                            svgElement.style.mozUserSelect = 'none';
                            svgElement.style.msUserSelect = 'none';
                        }
                    }
                })
                .catch((err) => {
                    console.error('Mermaid render error:', err, '\nDiagram:', sanitizedDiagram);
                    setRenderError('Mermaid render error: ' + err.message);
                })
                .finally(() => {
                    if (isMounted) {
                        setIsRendering(false);
                    }
                });
        } catch (err) {
            console.error('Mermaid render error (sync):', err, '\nDiagram:', sanitizedDiagram);
            setRenderError('Mermaid render error: ' + err.message);
            setIsRendering(false);
        }
        return () => {
            isMounted = false;
            if (hostRef.current) {
                // Clean up listeners when component unmounts or diagram changes
                hostRef.current.innerHTML = '';
            }
        };
    }, [diagram, onNodeDoubleClick, onNodeHover, onNodeHoverLeave, selectedNodeId]);

    if (renderError) {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-300 mt-4">
                <strong>Error rendering concept map:</strong>
                <pre className="whitespace-pre-wrap text-xs mt-2">{renderError}</pre>
                <details className="mt-2">
                    <summary>Show Mermaid code</summary>
                    <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">{diagram}</pre>
                </details>
            </div>
        );
    }

    return (
        <div className="concept-map-container bg-base-100 p-4 rounded-lg w-full overflow-auto min-h-[500px] min-w-[350px]">
            {isRendering && (
                <div className="flex justify-center items-center w-full h-full min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )}
            <div ref={hostRef} className="w-full h-full" />
        </div>
    );
}

// Utility: Remove all non-ASCII and invalid characters from any Mermaid string (diagram, style, etc.)
// Regex for future validation: /[^\x20-\x7E]/g (matches any non-ASCII printable character)
function cleanMermaidString(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '');
}

export default function EditableConceptMap({ conceptMap, onSave, isSaving }) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [editedMap, setEditedMap] = useState(conceptMap);
    const [showRenderer, setShowRenderer] = useState(true);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [mermaidCode, setMermaidCode] = useState('');
    const [richTextContent, setRichTextContent] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const lastDiagramRef = useRef(editedMap?.mermaidDiagram);
    const [overlayPosition, setOverlayPosition] = useState(null);
    const [showInlineEditor, setShowInlineEditor] = useState(false);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

    // Debug logging to understand data structure
    useEffect(() => {
        // Debug logging removed for production
    }, [conceptMap]);

    // Ensure editedMap is always in sync with conceptMap prop
    useEffect(() => {
        if (!isEqual(conceptMap, editedMap)) {
            setEditedMap(conceptMap);
        }
    }, [conceptMap]);

    // Initialize Mermaid only once
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    }, []);

    // Enhanced data processing and validation
    useEffect(() => {
        if (!isEqual(conceptMap, editedMap)) {
            // Only process if conceptMap is different from editedMap
            let concepts = conceptMap.concepts;
            let mermaidDiagram = conceptMap.mermaidDiagram;
            
            console.log('Processing conceptMap:', { conceptMap, concepts, mermaidDiagram });
            
            if (!concepts && conceptMap.nodes) {
                const allConnections = conceptMap.connections || [];
                concepts = conceptMap.nodes.map(node => {
                    const nodeConnections = allConnections
                        .filter(conn => conn.source === node.id)
                        .map(conn => ({
                            targetId: conn.target,
                            label: conn.label,
                        }));
                    return {
                        id: node.id,
                        text: node.data?.label || node.label || '',
                        type: node.type || 'main',
                        definition: node.data?.definition || node.definition || '',
                        connections: nodeConnections,
                        class: 'main-idea',
                    };
                });
                console.log('Created concepts from nodes:', concepts);
            }
            
            // Only create fallback concepts if we have no concepts AND no mermaidDiagram
            if ((!concepts || concepts.length === 0) && !mermaidDiagram) {
                concepts = [{
                    id: 'default-concept',
                    text: 'Main Concept',
                    type: 'main',
                    definition: 'No concept data available',
                    connections: [],
                    class: 'main-idea'
                }];
                console.log('Created fallback concept:', concepts);
            }
            
            // Only generate mermaidDiagram if we don't have one but we have concepts
            if (!mermaidDiagram && concepts && concepts.length > 0) {
                console.log('Generating mermaidDiagram from concepts:', concepts);
                mermaidDiagram = createMermaidDiagram(concepts);
                console.log('Generated mermaidDiagram:', mermaidDiagram);
            }
            
            const processedMap = {
                ...conceptMap,
                concepts,
                mermaidDiagram
            };
            
            console.log('Final processedMap:', processedMap);
            
            if (!isEqual(processedMap, editedMap)) {
                setEditedMap(processedMap);
            }
        }
    }, [conceptMap, editedMap]);

    // When the diagram changes, unmount the renderer for a tick before remounting
    useEffect(() => {
        if (editedMap?.mermaidDiagram !== lastDiagramRef.current) {
            setShowRenderer(false);
            const timeout = setTimeout(() => {
                setShowRenderer(true);
                lastDiagramRef.current = editedMap?.mermaidDiagram;
            }, 0);
            return () => clearTimeout(timeout);
        }
    }, [editedMap?.mermaidDiagram]);

    // Update mermaid code when diagram changes
    useEffect(() => {
        if (editedMap?.mermaidDiagram) {
            setMermaidCode(editedMap.mermaidDiagram);
        }
    }, [editedMap?.mermaidDiagram]);

    // Update rich text content when selected node changes
    useEffect(() => {
        if (selectedNode) {
            setRichTextContent(selectedNode.text || '');
        }
    }, [selectedNode]);

    // Enhanced validation function
    const hasValidConceptData = () => {
        if (!editedMap) {
            return false;
        }
        
        if (editedMap.concepts && editedMap.concepts.length > 0) {
            return true;
        }
        
        if (editedMap.nodes && editedMap.nodes.length > 0) {
            return true;
        }
        
        if (editedMap.mermaidDiagram) {
            return true;
        }
        
        return false;
    };

    const handleNodeClick = (nodeId, forceEdit = false) => {
        if (!isEditing) return;
        if (!editedMap || !editedMap.concepts || !Array.isArray(editedMap.concepts)) return;
        const node = editedMap.concepts.find(c => c.id === nodeId);
        if (node) {
            setSelectedNode(node);
            if (forceEdit) {
                // Find the SVG node and calculate its position
                const svgNode = document.getElementById(nodeId);
                if (svgNode) {
                    const bbox = svgNode.getBoundingClientRect();
                    const container = document.querySelector('.concept-map-container');
                    const containerBox = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
                    setOverlayPosition({
                        left: bbox.left - containerBox.left,
                        top: bbox.top - containerBox.top,
                        width: bbox.width,
                        height: bbox.height
                    });
                    setShowInlineEditor(true);
                }
            }
        }
    };

    const handleNodeEdit = (field, value) => {
        if (!selectedNode || !editedMap || !editedMap.concepts) {
            toast.error('No node selected or map data missing.');
            return;
        }
        
        const updatedConcepts = editedMap.concepts.map(concept =>
            concept.id === selectedNode.id
                ? { ...concept, [field]: value }
                : concept
        );
        const newMermaidDiagram = createMermaidDiagram(updatedConcepts);
        setEditedMap(prev => ({
            ...prev,
            concepts: updatedConcepts,
            mermaidDiagram: newMermaidDiagram
        }));
    };

    // Rich text formatting functions
    const applyFormatting = (format) => {
        const textarea = document.getElementById('rich-text-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = richTextContent;
        const selectedText = text.substring(start, end);

        let formattedText = '';
        switch (format) {
            case 'bold':
                formattedText = `<strong>${selectedText}</strong>`;
                break;
            case 'underline':
                formattedText = `<u>${selectedText}</u>`;
                break;
            case 'highlight':
                formattedText = `<mark>${selectedText}</mark>`;
                break;
            default:
                return;
        }

        const newText = text.substring(0, start) + formattedText + text.substring(end);
        setRichTextContent(newText);
        
        // Update the selected node with formatted text
        handleNodeEdit('text', newText);
        
        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + formattedText.length);
        }, 0);
    };

    const handleRichTextChange = (e) => {
        const newValue = e.target.value;
        setRichTextContent(newValue);
        handleNodeEdit('text', newValue);
    };

    const handleCodeEdit = () => {
        try {
            // First, validate the Mermaid code using our comprehensive validator
            const validation = validateMermaidDiagram(mermaidCode, 'Manual code edit');
            
            if (!validation.valid) {
                toast.error('Invalid Mermaid syntax: ' + validation.error);
                return;
            }

            // Additional Mermaid parse check for extra safety
            try {
                mermaid.parse(mermaidCode);
            } catch (parseError) {
                toast.error('Mermaid parse error: ' + parseError.message);
                return;
            }
            
            // Update the diagram only if validation passes
            setEditedMap(prev => ({
                ...prev,
                mermaidDiagram: mermaidCode
            }));
            
            toast.success('Diagram updated successfully');
        } catch (error) {
            console.error('Error in handleCodeEdit:', error);
            toast.error('Error updating diagram: ' + error.message);
        }
    };

    const handleSave = async () => {
        const result = await onSave(editedMap);
        if (result.success) {
            toast.success('Changes saved successfully');
            setIsEditing(false);
            setSelectedNode(null);
            setShowCodeEditor(false);
        } else {
            toast.error(result.error || 'Error saving changes');
        }
    };

    const handleEditToggle = () => {
        if (!hasValidConceptData()) {
            toast.error('No concept data available for editing. Please generate a concept map first.');
            return;
        }
        setIsEditing(!isEditing);
        setSelectedNode(null);
        setShowCodeEditor(false);
    };

    // Add handler for inline edit save
    const handleInlineEditSave = (value) => {
        handleNodeEdit('text', value);
        setShowInlineEditor(false);
        setEditingNodeId(null);
    };

    // Add handler for overlay blur/Enter
    const handleInlineEditBlur = (e) => {
        handleInlineEditSave(e.target.value);
    };
    const handleInlineEditKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInlineEditSave(e.target.value);
        }
    };

    // Add outside click handler to close overlay
    useEffect(() => {
        if (!showInlineEditor) return;
        const handleClick = (e) => {
            if (e.target.closest('.inline-editor-overlay')) return;
            setShowInlineEditor(false);
            setEditingNodeId(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showInlineEditor]);

    const handleNodeDoubleClick = (nodeId) => {
        if (!isEditing) return;
        if (!editedMap || !editedMap.concepts) {
            toast.error('No concept map data available.');
            return;
        }
        const node = document.getElementById(nodeId);
        if (!node) {
            toast.error('Node not found in diagram.');
            return;
        }
        const bbox = node.getBoundingClientRect();
        const container = document.querySelector('.concept-map-container');
        if (!container) {
            toast.error('Diagram container not found.');
            return;
        }
        const containerBox = container.getBoundingClientRect();
        setOverlayPosition({
            left: bbox.left - containerBox.left,
            top: bbox.top - containerBox.top,
            width: bbox.width,
            height: bbox.height
        });
        setEditingNodeId(nodeId);
        setShowInlineEditor(true);
        setSelectedNode(editedMap.concepts.find(c => c.id === nodeId));
    };
    const handleNodeHover = (nodeId) => setHoveredNodeId(nodeId);
    const handleNodeHoverLeave = () => setHoveredNodeId(null);

    // In the render, before using selectedNode.position, add a null check and fallback
    const safePosition = selectedNode && selectedNode.position
        ? selectedNode.position
        : { left: 0, top: 0, width: 0, height: 0 };

    // In EditableConceptMap, set window.__clarimapEditMode = isEditing; in a useEffect
    useEffect(() => { window.__clarimapEditMode = isEditing; }, [isEditing]);

    return (
        <div className="w-full">
            <div className="flex justify-end mb-4 gap-2">
                {/* Enhanced Edit Mode button with proper toggle behavior */}
                <div className="tooltip tooltip-bottom" data-tip={isEditing ? "Disable edit mode to return to view-only" : "Enable edit mode to modify concept map content"}>
                    <button
                        onClick={handleEditToggle}
                        className={`btn ${isEditing ? 'btn-warning' : 'btn-primary'}`}
                        disabled={isSaving || !hasValidConceptData()}
                    >
                        {isEditing ? (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Disable edit mode
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Enable edit mode
                            </>
                        )}
                    </button>
                </div>
                
                {/* Code Editor Toggle - only show when in editing mode */}
                {isEditing && (
                    <div className="tooltip tooltip-bottom" data-tip="Edit Mermaid diagram code directly">
                        <button
                            onClick={() => setShowCodeEditor(!showCodeEditor)}
                            className={`btn btn-sm ${showCodeEditor ? 'btn-secondary' : 'btn-outline'}`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            {showCodeEditor ? 'Hide Code' : 'Code Editor'}
                        </button>
                    </div>
                )}
            </div>

            {/* Code Editor Panel */}
            {isEditing && showCodeEditor && (
                <div className="code-editor-panel mb-4 p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-semibold">Mermaid Diagram Code</h4>
                        <div className="tooltip tooltip-bottom" data-tip="Apply changes to the diagram">
                            <button
                                onClick={handleCodeEdit}
                                className="btn btn-sm btn-primary"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={mermaidCode}
                        onChange={(e) => setMermaidCode(e.target.value)}
                        className="textarea textarea-bordered w-full font-mono text-sm"
                        rows={8}
                        placeholder="Edit Mermaid diagram code here..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: Modify the diagram structure, add new nodes, or change styling. Click "Apply Changes" to update the visualization.
                    </p>
                </div>
            )}

            {/* No Data Available Fallback */}
            {!hasValidConceptData() && (
                <div className="mb-4 p-6 bg-base-200 rounded-lg border border-base-300">
                    <div className="text-center space-y-4">
                        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Concept Map Available</h3>
                            <p className="text-gray-600 mb-4">
                                This board doesn't have a concept map yet. To create one, you'll need to generate a concept map from text input.
                            </p>
                            <div className="flex justify-center gap-2">
                                <a href="/dashboard" className="btn btn-primary btn-sm">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create New Map
                                </a>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="btn btn-outline btn-sm"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 ${isEditing ? '' : 'lg:col-span-3'}`}>
                    {showRenderer && hasValidConceptData() && (
                        <MermaidRenderer 
                            key={cleanMermaidString(editedMap?.mermaidDiagram) || 'empty-diagram'}
                            diagram={cleanMermaidString(editedMap?.mermaidDiagram)}
                            onNodeDoubleClick={handleNodeDoubleClick}
                            onNodeHover={handleNodeHover}
                            onNodeHoverLeave={handleNodeHoverLeave}
                            selectedNodeId={selectedNode?.id}
                        />
                    )}
                </div>
                {isEditing && hasValidConceptData() && (
                    <div className="edit-panel p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Edit Concept</h3>
                        
                        {editedMap && editedMap.concepts && editedMap.concepts.length > 0 && !selectedNode && (
                            <div className="flex items-center justify-center h-full text-center text-gray-500">
                                <div className="space-y-2">
                                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                                    </svg>
                                    <p className="text-sm">Click on any node in the map to begin editing</p>
                                </div>
                            </div>
                        )}

                        {selectedNode && (
                            <div className="space-y-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text">Node Text (Rich Text Editor)</span>
                                    </label>
                                    
                                    {/* Rich Text Formatting Toolbar */}
                                    <div className="rich-text-toolbar flex gap-2">
                                        <div className="tooltip tooltip-bottom" data-tip="Make text bold">
                                            <button
                                                onClick={() => applyFormatting('bold')}
                                                className="btn btn-sm btn-ghost"
                                                disabled={isSaving}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="tooltip tooltip-bottom" data-tip="Underline text">
                                            <button
                                                onClick={() => applyFormatting('underline')}
                                                className="btn btn-sm btn-ghost"
                                                disabled={isSaving}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="tooltip tooltip-bottom" data-tip="Highlight text">
                                            <button
                                                onClick={() => applyFormatting('highlight')}
                                                className="btn btn-sm btn-ghost"
                                                disabled={isSaving}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <textarea
                                        id="rich-text-editor"
                                        value={richTextContent}
                                        onChange={handleRichTextChange}
                                        className="textarea textarea-bordered w-full"
                                        rows={4}
                                        disabled={isSaving}
                                        placeholder="Enter node text with rich formatting..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Tip: Select text and use the formatting buttons above to apply bold, underline, or highlight.
                                    </p>
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text">Definition</span>
                                    </label>
                                    <textarea
                                        value={selectedNode.definition}
                                        onChange={(e) => handleNodeEdit('definition', e.target.value)}
                                        className="textarea textarea-bordered w-full"
                                        rows={6}
                                        disabled={isSaving}
                                        placeholder="Enter detailed definition with bullet points using <br>- ..."
                                    />
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text">Type</span>
                                    </label>
                                    <select
                                        value={selectedNode.type}
                                        onChange={(e) => handleNodeEdit('type', e.target.value)}
                                        className="select select-bordered w-full"
                                        disabled={isSaving}
                                    >
                                        <option value="main">Main Idea</option>
                                        <option value="sub">Sub-Concept</option>
                                        <option value="detail">Detail</option>
                                        <option value="example">Example</option>
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={handleSave}
                                        className="btn btn-primary w-full"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Inline Editor Overlay */}
            {isEditing && showInlineEditor && overlayPosition && selectedNode && (
                <div
                    className="inline-editor-overlay absolute z-50 bg-white rounded-2xl shadow-2xl border border-blue-200 p-2 flex flex-col gap-1"
                    style={{
                        left: safePosition.left,
                        top: safePosition.top,
                        width: safePosition.width,
                        height: safePosition.height,
                        pointerEvents: 'auto',
                    }}
                >
                    <div className="flex gap-1 mb-1">
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => applyFormatting('bold')}><b>B</b></button>
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => applyFormatting('underline')}><u>U</u></button>
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => applyFormatting('highlight')}><span style={{ background: '#ffe066' }}>H</span></button>
                    </div>
                    <textarea
                        className="textarea textarea-bordered w-full h-full text-base font-sans bg-white bg-opacity-95 shadow-md rounded-2xl"
                        value={richTextContent}
                        onChange={handleRichTextChange}
                        onBlur={handleInlineEditBlur}
                        onKeyDown={handleInlineEditKeyDown}
                        autoFocus
                        style={{ resize: 'none', minHeight: 40 }}
                    />
                </div>
            )}

            {/* Highlight key words in node text */}
            {isEditing && selectedNode && (
                <div className="absolute z-40 pointer-events-none" style={{ left: safePosition.left, top: safePosition.top, width: safePosition.width, height: safePosition.height }}>
                    <span className="inline-block align-middle mr-1">
                        {selectedNode.text.split(' ').map((word, index) => (
                            <em key={index}>{word} </em>
                        ))}
                    </span>
                </div>
            )}

            {/* Highlight hovered node */}
            {isEditing && hoveredNodeId && (
                <div className="absolute z-40 pointer-events-none" style={{ left: safePosition.left, top: safePosition.top, width: safePosition.width, height: safePosition.height }}>
                    <span className="inline-block align-middle mr-1">
                        <svg className="w-5 h-5 text-yellow-500 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </span>
                </div>
            )}
        </div>
    );
} 