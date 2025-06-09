"use client";

import { ReactFlowProvider } from 'reactflow';
import ConceptMapVisualizer from './ConceptMapVisualizer';

const ClientConceptMapWrapper = ({ conceptMap }) => {
  return (
    <ReactFlowProvider>
      <ConceptMapVisualizer conceptMap={conceptMap} />
    </ReactFlowProvider>
  );
};

export default ClientConceptMapWrapper; 