"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { toast } from "react-hot-toast";
import { createMermaidDiagram } from '@/services/conceptMapGenerator';

function MermaidRenderer({ diagram, onNodeClick, selectedNodeId, onNodeDoubleClick }) {
    const hostRef = useRef(null);
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        if (!hostRef.current || !diagram) return;

        let isMounted = true;
        setIsRendering(true);

        mermaid.render('concept-map', diagram)
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
                            onNodeClick(node.id);
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
                console.error("Mermaid render error:", err);
                toast.error('Error rendering concept map');
            })
            .finally(() => {
                if (isMounted) {
                    setIsRendering(false);
                }
            });

        return () => {
            isMounted = false;
            if (hostRef.current) {
                // Clean up listeners when component unmounts or diagram changes
                hostRef.current.innerHTML = '';
            }
        };
    }, [diagram, onNodeClick, selectedNodeId]);

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

function FormattingToolbar({ onFormat, onUndo, onRedo, canUndo, canRedo }) {
    return (
        <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-md flex gap-2 p-2 top-[-2.5rem] left-1/2 -translate-x-1/2">
            <button className="font-bold px-2" onMouseDown={e => { e.preventDefault(); onFormat('bold'); }} title="Bold"><b>B</b></button>
            <button className="italic px-2" onMouseDown={e => { e.preventDefault(); onFormat('italic'); }} title="Italic"><i>I</i></button>
            <button className="underline px-2" onMouseDown={e => { e.preventDefault(); onFormat('underline'); }} title="Underline"><u>U</u></button>
            <button className="bg-yellow-200 px-2 rounded" onMouseDown={e => { e.preventDefault(); onFormat('hiliteColor', '#fef08a'); }} title="Highlight">H</button>
            <button className="px-2" onMouseDown={e => { e.preventDefault(); onUndo(); }} disabled={!canUndo} title="Undo">⎌</button>
            <button className="px-2" onMouseDown={e => { e.preventDefault(); onRedo(); }} disabled={!canRedo} title="Redo">↻</button>
        </div>
    );
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
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [editHistory, setEditHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const editRef = useRef(null);

    // Debug logging to understand data structure
    useEffect(() => {
        // Debug logging removed for production
    }, [conceptMap]);

    // Ensure editedMap is always in sync with conceptMap prop
    useEffect(() => {
        setEditedMap(conceptMap);
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
        if (conceptMap) {
            let concepts = conceptMap.concepts;
            let mermaidDiagram = conceptMap.mermaidDiagram;
            
            // If only nodes exist, convert them to concepts format
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
            }
            
            // If no concepts or nodes, but we have a mermaidDiagram, try to extract concepts
            if ((!concepts || concepts.length === 0) && mermaidDiagram) {
                // Create a basic concept from the diagram
                concepts = [{
                    id: 'extracted-concept',
                    text: 'Concept from Diagram',
                    type: 'main',
                    definition: 'Concept extracted from existing diagram',
                    connections: [],
                    class: 'main-idea'
                }];
            }
            
            // If still no concepts, create a basic structure
            if (!concepts || concepts.length === 0) {
                concepts = [{
                    id: 'default-concept',
                    text: 'Main Concept',
                    type: 'main',
                    definition: 'No concept data available',
                    connections: [],
                    class: 'main-idea'
                }];
            }
            
            // Generate mermaid diagram if missing
            if (!mermaidDiagram && concepts && concepts.length > 0) {
                mermaidDiagram = createMermaidDiagram(concepts);
            }
            
            // Update the edited map with processed data
            const processedMap = {
                ...conceptMap,
                concepts,
                mermaidDiagram
            };
            
            setEditedMap(processedMap);
        }
    }, [conceptMap]);

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

    const handleNodeClick = (nodeId) => {
        if (!isEditing) return;
        
        // Add null checks for editedMap and concepts
        if (!editedMap || !editedMap.concepts || !Array.isArray(editedMap.concepts)) {
            return;
        }
        
        const node = editedMap.concepts.find(c => c.id === nodeId);
        if (node) {
            setSelectedNode(node);
        }
    };

    const handleNodeEdit = (field, value) => {
        if (!selectedNode || !editedMap || !editedMap.concepts) return;
        
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
            // Validate the Mermaid code
            mermaid.parse(mermaidCode);
            
            // Update the diagram
            setEditedMap(prev => ({
                ...prev,
                mermaidDiagram: mermaidCode
            }));
            
            toast.success('Diagram updated successfully');
        } catch (error) {
            toast.error('Invalid Mermaid syntax: ' + error.message);
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
        if (!isEditing) {
            // Check if we have valid data before enabling editing
            if (!hasValidConceptData()) {
                toast.error('No concept data available for editing. Please generate a concept map first.');
                return;
            }
        }
        
        setIsEditing(!isEditing);
        setSelectedNode(null);
        setShowCodeEditor(false);
    };

    // Inline edit handlers
    const handleNodeDoubleClick = (nodeId) => {
        const node = conceptMap.nodes?.find(n => n.id === nodeId);
        if (node) {
            setEditingNodeId(nodeId);
            setEditValue(node.data.label);
            setEditHistory([node.data.label]);
            setRedoStack([]);
            setTimeout(() => {
                if (editRef.current) editRef.current.focus();
            }, 50);
        }
    };
    const handleEditInput = (e) => {
        setEditValue(e.currentTarget.innerHTML);
    };
    const handleEditBlur = () => {
        if (editingNodeId) {
            // Update node label and re-render
            const updatedNodes = conceptMap.nodes.map(n =>
                n.id === editingNodeId ? { ...n, data: { ...n.data, label: editValue } } : n
            );
            const updatedConcepts = updatedNodes.map(n => ({
                id: n.id,
                text: n.data.label,
                connections: conceptMap.connections.filter(c => c.source === n.id).map(c => ({ targetId: c.target, label: c.label }))
            }));
            const newDiagram = createMermaidDiagram(updatedConcepts);
            onSave({ ...conceptMap, nodes: updatedNodes, mermaidDiagram: newDiagram });
            setEditingNodeId(null);
        }
    };
    const handleFormat = (cmd, value) => {
        document.execCommand(cmd, false, value);
        setEditValue(editRef.current.innerHTML);
        setEditHistory(h => [...h, editRef.current.innerHTML]);
        setRedoStack([]);
    };
    const handleUndo = () => {
        setEditHistory(h => {
            if (h.length > 1) {
                const newHistory = h.slice(0, -1);
                setEditValue(newHistory[newHistory.length - 1]);
                setRedoStack(r => [h[h.length - 1], ...r]);
                return newHistory;
            }
            return h;
        });
    };
    const handleRedo = () => {
        setRedoStack(r => {
            if (r.length > 0) {
                setEditHistory(h => [...h, r[0]]);
                setEditValue(r[0]);
                return r.slice(1);
            }
            return r;
        });
    };

    return (
        <div className="w-full">
            <div className="flex justify-end mb-4 gap-2">
                {/* Enhanced Edit Mode button with proper toggle behavior */}
                <div className="tooltip tooltip-bottom" data-tip={isEditing ? "Disable edit mode to return to view-only" : "Enable edit mode to modify concept map content"}>
                    <button
                        onClick={handleEditToggle}
                        className={`btn ${isEditing ? 'btn-warning' : 'btn-primary'}`}
                        disabled={isSaving}
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
                            key={editedMap?.mermaidDiagram || 'empty-diagram'} 
                            diagram={editedMap?.mermaidDiagram}
                            onNodeClick={handleNodeClick}
                            onNodeDoubleClick={handleNodeDoubleClick}
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
            {editingNodeId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/10 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-[90vw] relative">
                        <FormattingToolbar
                            onFormat={handleFormat}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={editHistory.length > 1}
                            canRedo={redoStack.length > 0}
                        />
                        <div
                            ref={editRef}
                            className="border border-gray-300 rounded-lg p-3 min-h-[48px] outline-none focus:ring-2 focus:ring-blue-400 text-lg font-sans"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditInput}
                            onBlur={handleEditBlur}
                            tabIndex={0}
                            aria-label="Edit node text"
                            dangerouslySetInnerHTML={{ __html: editValue }}
                        />
                        <div className="flex justify-end mt-2">
                            <button className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onMouseDown={e => { e.preventDefault(); handleEditBlur(); }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 