"use client";

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    Panel,
    getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from '@dagrejs/dagre';
import { toast } from 'react-hot-toast';

// Initialize dagre graph
const g = new dagre.graphlib.Graph();
g.setDefaultEdgeLabel(() => ({}));

// Node dimensions
const nodeWidth = 250; // Adjusted for better text display
const nodeHeight = 120; // Adjusted for better text display

/**
 * Calculates the layout for nodes and edges using dagre
 * @param {Array} nodes - Array of nodes
 * @param {Array} edges - Array of edges
 * @returns {Object} Layouted nodes and edges
 */
const getLayoutedElements = (nodes, edges) => {
    console.log('getLayoutedElements: Input nodes:', nodes);
    console.log('getLayoutedElements: Input edges:', edges);

    g.setGraph({ rankdir: 'TB', nodesep: 150, ranksep: 150 }); // Adjusted spacing

    // Clear previous graph data before adding new nodes/edges
    g.nodes().forEach(nodeId => g.removeNode(nodeId));
    g.edges().forEach(edgeObj => g.removeEdge(edgeObj.v, edgeObj.w));

    // Add nodes to the graph
    nodes.forEach((node) => {
        if (!node.id) {
            console.warn('getLayoutedElements: Node missing ID, skipping:', node);
            return;
        }
        g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Add edges to the graph
    edges.forEach((edge) => {
        if (!edge.source || !edge.target) {
            console.warn('getLayoutedElements: Edge missing source or target, skipping:', edge);
            return;
        }
        // Ensure source and target nodes exist in the graph before adding edge
        if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
            g.setEdge(edge.source, edge.target);
        } else {
            console.warn(`getLayoutedElements: Skipping edge ${edge.id}: source or target node not found in dagre graph. Source: ${edge.source}, Target: ${edge.target}`);
        }
    });

    try {
        // Calculate the layout
        dagre.layout(g);
        console.log('getLayoutedElements: Dagre layout successful.');
    } catch (error) {
        console.error("Error during dagre layout: ", error);
        // Return original nodes and edges if layout fails
        return { nodes, edges };
    }

    // Get the layouted nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        if (!nodeWithPosition || typeof nodeWithPosition.x === 'undefined' || typeof nodeWithPosition.y === 'undefined') {
            console.warn(`getLayoutedElements: Dagre layout did not provide position for node ${node.id}. Using default.`);
            return { ...node, position: node.position || { x: 0, y: 0 } };
        }
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
            type: node.type || 'sub', // Ensure type is set
        };
    });

    console.log('getLayoutedElements: Output layouted nodes:', layoutedNodes);
    console.log('getLayoutedElements: Output layouted edges (original edges passed through):', edges);

    return { nodes: layoutedNodes, edges };
};

// Custom Node Components
const MainNode = ({ data }) => (
    <div className="px-4 py-3 shadow-md rounded-lg bg-white border-2 border-blue-500 flex flex-col items-center justify-center text-center" style={{ width: nodeWidth, height: nodeHeight }}>
        <div className="font-bold text-lg w-full px-2 text-wrap break-words" dangerouslySetInnerHTML={{ __html: data.label.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        {data.definition && (
            <div className="text-sm text-gray-600 mt-1 w-full px-2 text-wrap break-words" dangerouslySetInnerHTML={{ __html: data.definition.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        )}
    </div>
);

const SubNode = ({ data }) => (
    <div className="px-3 py-2 shadow-sm rounded-lg bg-white border-2 border-gray-400 flex flex-col items-center justify-center text-center" style={{ width: nodeWidth * 0.8, height: nodeHeight * 0.8 }}>
        <div className="font-medium w-full px-1 text-wrap break-words" dangerouslySetInnerHTML={{ __html: data.label.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        {data.definition && (
            <div className="text-xs text-gray-600 mt-1 w-full px-1 text-wrap break-words" dangerouslySetInnerHTML={{ __html: data.definition.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        )}
    </div>
);

// Custom Edge Component
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label }) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3,
    });

    return (
        <>
            <path
                id={id}
                style={{
                    ...style,
                    strokeWidth: 2,
                }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            {label && (
                <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="text-xs fill-gray-600 font-medium"
                    style={{ 
                        pointerEvents: 'all',
                        background: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                    }}
                >
                    {label}
                </text>
            )}
        </>
    );
};

// Register custom node types
const nodeTypes = {
    main: MainNode,
    sub: SubNode,
};

// Register custom edge types
const edgeTypes = {
    custom: CustomEdge,
};

/**
 * ConceptMapVisualizer Component
 * Renders the concept map using React Flow with advanced visualization features
 */
const ConceptMapVisualizer = ({ conceptMap, onDelete }) => {
    console.log('ConceptMapVisualizer: Received conceptMap:', conceptMap);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    // Update the delete handler
    const handleDelete = async () => {
        if (!conceptMap?.id) {
            console.error('No concept map ID available for deletion');
            return;
        }

        try {
            // First, clear the current map immediately for better UX
            setNodes([]);
            setEdges([]);
            
            const response = await fetch(`/api/board/${conceptMap.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete concept map: ${response.status}`);
            }

            // Show success message
            toast.success('✅ Concept map deleted successfully');
            
            // Notify parent component to refresh the list
            if (onDelete) {
                onDelete(conceptMap.id);
            }
        } catch (error) {
            console.error('Error deleting concept map:', error);
            // Restore the map if deletion failed
            setNodes(conceptMap.nodes || []);
            setEdges(conceptMap.connections || []);
            toast.error('Failed to delete concept map. Please try again.');
        }
    };

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Update the useEffect that processes the concept map
    useEffect(() => {
        console.log('ConceptMapVisualizer useEffect: Running due to conceptMap change.', conceptMap);
        if (!conceptMap || !conceptMap.nodes || conceptMap.nodes.length === 0) {
            console.log('ConceptMapVisualizer: No valid concept map data, clearing states.');
            setNodes([]);
            setEdges([]);
            return;
        }

        // Extract nodes and edges from the concept map
        const extractedNodes = conceptMap.nodes.map(node => ({ ...node, type: node.type || 'sub' })); // Ensure type is always set
        const extractedEdges = conceptMap.connections || [];

        console.log('ConceptMapVisualizer useEffect: Extracted nodes for layout:', extractedNodes);
        console.log('ConceptMapVisualizer useEffect: Extracted edges for layout:', extractedEdges);

        // Get layouted elements
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            extractedNodes,
            extractedEdges
        );

        console.log('ConceptMapVisualizer useEffect: Layouted nodes:', layoutedNodes);
        console.log('ConceptMapVisualizer useEffect: Layouted edges:', layoutedEdges);

        // Set nodes and edges with layout
        setNodes(layoutedNodes);
        setEdges(layoutedEdges.map(edge => ({
            ...edge,
            type: edge.type || 'custom', // Ensure custom type for rendering
            animated: true,
            style: {
                stroke: '#4a90e2',
                strokeWidth: 2,
            },
            markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#4a90e2',
            },
        })));

        // Fit view after a short delay to ensure nodes are rendered
        setTimeout(() => {
            console.log('ConceptMapVisualizer useEffect: Calling fitView...');
            fitView({ 
                padding: 0.2,
                duration: 800,
                minZoom: 0.5,
                maxZoom: 2
            });
        }, 150);
    }, [conceptMap, fitView]); // Removed setNodes and setEdges from dependencies

    if (!conceptMap?.nodes || conceptMap.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No concept map data available or the map could not be generated from the text.</p>
            </div>
        );
    }

    console.log('ConceptMapVisualizer: Rendering ReactFlow with current nodes state:', nodes, 'and edges state:', edges);

    return (
        <div style={{ width: '100%', height: '100%' }} className="border rounded-lg" data-testid="mapa-generado">
            <ReactFlow
                key={conceptMap.id} 
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{
                    type: 'custom',
                    animated: true,
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
                }}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right">
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Delete Map
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default ConceptMapVisualizer; 