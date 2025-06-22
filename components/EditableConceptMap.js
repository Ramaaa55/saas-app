"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { toast } from "react-hot-toast";
import { createMermaidDiagram } from '@/services/conceptMapGenerator';

function MermaidRenderer({ diagram, onNodeClick, selectedNodeId }) {
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

                    // Add click listeners to nodes after rendering
                    const nodes = hostRef.current.querySelectorAll('.node');
                    
                    nodes.forEach(node => {
                        node.addEventListener('click', () => {
                            onNodeClick(node.id);
                        });
                        
                        // Add visual feedback for selected node
                        if (node.id === selectedNodeId) {
                            node.classList.add('selected');
                        } else {
                            node.classList.remove('selected');
                        }
                    });
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
                const nodes = hostRef.current.querySelectorAll('.node');
                nodes.forEach(node => {
                    // It's tricky to remove anonymous functions, but cleanup innerHTML is enough
                });
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

export default function EditableConceptMap({ conceptMap, onSave, isSaving }) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [editedMap, setEditedMap] = useState(conceptMap);
    const [showRenderer, setShowRenderer] = useState(true);
    const lastDiagramRef = useRef(editedMap?.mermaidDiagram);

    // Debug logging to understand data structure
    useEffect(() => {
        // Removed debug logging for production
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

    // If mermaidDiagram is missing but concepts or nodes exist, regenerate it
    useEffect(() => {
        if (conceptMap && !conceptMap.mermaidDiagram) {
            let concepts = conceptMap.concepts;
            
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
                        connections: nodeConnections, // Rebuild connections
                        class: 'main-idea', // Default class
                    };
                });
            }
            
            // If no concepts or nodes, create a basic structure
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
            
            if (concepts && concepts.length > 0) {
                const regenerated = {
                    ...conceptMap,
                    concepts,
                    mermaidDiagram: createMermaidDiagram(concepts)
                };
                setEditedMap(regenerated);
            }
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

    const handleNodeClick = (nodeId) => {
        if (!isEditing) return;
        
        // Add null checks for editedMap and concepts
        if (!editedMap || !editedMap.concepts || !Array.isArray(editedMap.concepts)) {
            console.warn('No concepts available for editing');
            return;
        }
        
        const node = editedMap.concepts.find(c => c.id === nodeId);
        if (node) {
            setSelectedNode(node);
        } else {
            console.warn(`Node with ID "${nodeId}" not found in concepts.`);
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

    const handleSave = async () => {
        const result = await onSave(editedMap);
        if (result.success) {
            toast.success('Changes saved successfully');
            setIsEditing(false);
            setSelectedNode(null);
        } else {
            toast.error(result.error || 'Error saving changes');
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => {
                        // Ensure we have valid concepts before enabling editing
                        if (!isEditing && (!editedMap || !editedMap.concepts || editedMap.concepts.length === 0)) {
                            toast.error('No concept data available for editing');
                            return;
                        }
                        setIsEditing(!isEditing);
                    }}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    {isEditing ? "View Map" : "Edit Map"}
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 ${isEditing ? '' : 'lg:col-span-3'}`}>
                    {showRenderer && (
                        <MermaidRenderer 
                            key={editedMap?.mermaidDiagram || 'empty-diagram'} 
                            diagram={editedMap?.mermaidDiagram}
                            onNodeClick={handleNodeClick}
                            selectedNodeId={selectedNode?.id}
                        />
                    )}
                </div>
                {isEditing && (
                    <div className="edit-panel p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Edit Concept</h3>
                        
                        {(!editedMap || !editedMap.concepts || editedMap.concepts.length === 0) && (
                            <div className="flex items-center justify-center h-full text-center text-gray-500">
                                <div className="space-y-2">
                                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <p className="text-sm">No concept data available for editing</p>
                                </div>
                            </div>
                        )}
                        
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
                                        <span className="label-text">Node Text (HTML)</span>
                                    </label>
                                    <textarea
                                        value={selectedNode.text}
                                        onChange={(e) => handleNodeEdit('text', e.target.value)}
                                        className="textarea textarea-bordered w-full"
                                        rows={4}
                                        disabled={isSaving}
                                        placeholder="Enter node text with HTML formatting..."
                                    />
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
        </div>
    );
} 