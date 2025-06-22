"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { toast } from "react-hot-toast";
import { createMermaidDiagram } from '@/services/conceptMapGenerator';

function MermaidRenderer({ diagram }) {
    const hostRef = useRef(null);
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        if (!hostRef.current) return;

        let isMounted = true;
        setIsRendering(true);

        if (!diagram) {
            setIsRendering(false);
            return;
        }

        mermaid.render('concept-map', diagram)
            .then(({ svg }) => {
                if (isMounted && hostRef.current) {
                    hostRef.current.innerHTML = svg;
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
                hostRef.current.innerHTML = '';
            }
        };
    }, [diagram]);

    return (
        <div className="concept-map-container bg-base-100 p-4 rounded-lg w-full overflow-x-auto overflow-y-visible min-h-[500px] min-w-[350px]">
            {isRendering && (
                <div className="flex justify-center items-center w-full h-full min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )}
            <div ref={hostRef} className="w-full" />
        </div>
    );
}

export default function EditableConceptMap({ conceptMap, onSave, isSaving }) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [editedMap, setEditedMap] = useState(conceptMap);
    const [showRenderer, setShowRenderer] = useState(true);
    const lastDiagramRef = useRef(editedMap?.mermaidDiagram);

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
                        text: node.data?.label || '',
                        type: node.type || 'main',
                        definition: node.data?.definition || '',
                        connections: nodeConnections, // Rebuild connections
                        class: 'main-idea', // Default class
                    };
                });
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

    const handleNodeClick = (event) => {
        if (!isEditing) return;
        const nodeId = event.target.closest('.node').id;
        const node = editedMap.concepts.find(c => c.id === nodeId);
        if (node) setSelectedNode(node);
    };

    const handleNodeEdit = (field, value) => {
        if (!selectedNode) return;
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
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    {isEditing ? "View Map" : "Edit Map"}
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {showRenderer && (
                    <MermaidRenderer key={editedMap?.mermaidDiagram || 'empty-diagram'} diagram={editedMap?.mermaidDiagram} />
                )}
                {isEditing && selectedNode && (
                    <div className="bg-base-100 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-4">Edit Node</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">
                                    <span className="label-text">Node Text</span>
                                </label>
                                <input
                                    type="text"
                                    value={selectedNode.text}
                                    onChange={(e) => handleNodeEdit('text', e.target.value)}
                                    className="input input-bordered w-full"
                                    disabled={isSaving}
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
                                    rows="3"
                                    disabled={isSaving}
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
                                    <option value="concept">Concept</option>
                                    <option value="process">Process</option>
                                    <option value="principle">Principle</option>
                                </select>
                            </div>
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
        </div>
    );
} 