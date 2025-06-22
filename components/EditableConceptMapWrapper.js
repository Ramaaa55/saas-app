"use client";

import { useState } from 'react';
import EditableConceptMap from './EditableConceptMap';
import { updateBoardContent } from '@/app/actions';
import toast from 'react-hot-toast';

const EditableConceptMapWrapper = ({ conceptMap, boardId }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [localMap, setLocalMap] = useState(conceptMap);

    const handleSave = async (updatedMap) => {
        try {
            setIsSaving(true);
            const result = await updateBoardContent(boardId, updatedMap);
            
            if (result.success) {
                toast.success('Changes saved successfully');
                setLocalMap(result.board.content);
                return result;
            } else {
                toast.error(result.error || 'Failed to save changes');
                return { success: false, error: result.error };
            }
        } catch (error) {
            toast.error('Error saving changes');
            console.error('Save error:', error);
            return { success: false, error: error.message };
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <EditableConceptMap 
            conceptMap={localMap}
            onSave={handleSave}
            isSaving={isSaving}
        />
    );
};

export default EditableConceptMapWrapper; 