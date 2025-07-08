"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { generateConceptMap, saveConceptMap } from "@/services/conceptMapGenerator";
// Removed useSession import

/**
 * FormNewBoard Component
 * Handles the creation of new concept maps
 * Features:
 * - Form validation
 * - Loading states
 * - Error handling
 * - Success notifications
 * - Automatic page refresh after creation
 */
const FormNewBoard = () => {
    const router = useRouter();
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Removed session/status logic

    /**
     * Handles form submission:
     * 1. Prevents default form behavior
     * 2. Validates loading state
     * 3. Generates concept map from text
     * 4. Saves the concept map
     * 5. Shows success/error toast
     * 6. Resets form and refreshes page
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isLoading || !text.trim()) {
            return;
        }

        setIsLoading(true);

        try {
            // Generate the concept map
            const conceptMap = await generateConceptMap(text);
            console.log('Generated conceptMap:', conceptMap);
            // Validación robusta de sesión
            // Save the concept map
            const saveResult = await saveConceptMap(conceptMap);
            console.log('Save result:', saveResult);
            setText("");
            toast.success("Concept map created successfully!");
            router.refresh();
        } catch (error) {
            const errorMessage = error.message || "Something went wrong";
            if (error.message && error.message.toLowerCase().includes('unauthorized')) {
                toast.error("You must be logged in to create a concept map.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Text area for concept map input */}
            <div className="form-control">
                <textarea
                    required
                    placeholder="Paste your text here..."
                    className="textarea textarea-bordered w-full h-32"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                />
            </div>
            {/* Submit button with loading state */}
            <button 
                className="btn btn-primary w-full" 
                type="submit"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Generating Concept Map...
                    </>
                ) : (
                    "Generate Map"
                )}
            </button>
        </form>
    );
};

export default FormNewBoard;