"use client";

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const ConceptMapVisualizer = ({ conceptMap }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Configure mermaid with aesthetic settings
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
                htmlLabels: true,
                curve: 'basis',
                padding: 20,
                nodeSpacing: 50,
                rankSpacing: 50,
                useMaxWidth: true,
                diagramPadding: 8,
            },
            themeVariables: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                primaryColor: '#8C9EFF',
                primaryTextColor: '#2C3E50',
                primaryBorderColor: '#6B7A9F',
                lineColor: '#6B7A9F',
                secondaryColor: '#F0F4F8',
                tertiaryColor: '#E8F0FE',
                nodeBorder: '#6B7A9F',
                nodeTextColor: '#2C3E50',
                clusterBkg: '#DAE2E9',
                clusterBorder: '#AAB7C4',
                edgeLabelBackground: '#FFFFFF',
                tertiaryTextColor: '#2C3E50',
                noteBkg: '#FFFACD',
                noteBorder: '#DAA520',
                noteTextColor: '#333333',
                fillType0: '#DAE2E9',
                fillType1: '#C2D1E3',
                fillType2: '#A9C0D7',
            }
        });

        // Render the diagram
        if (containerRef.current && conceptMap?.mermaidDiagram) {
            mermaid.render('concept-map', conceptMap.mermaidDiagram).then(({ svg }) => {
                containerRef.current.innerHTML = svg;
            });
        }
    }, [conceptMap]);

    if (!conceptMap) {
        return (
            <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
                <p className="text-gray-500">No concept map to display</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto bg-base-100 rounded-lg p-4">
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