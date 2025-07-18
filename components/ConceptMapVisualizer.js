"use client";

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const ConceptMapVisualizer = ({ conceptMap }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Configure mermaid with aesthetic settings
        mermaid.initialize({
            startOnLoad: true,
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