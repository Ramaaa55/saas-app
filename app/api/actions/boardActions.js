'use server';

import connectMongo from "@/libs/mongoose";
import Board from "@/app/models/Board";

export async function updateBoardContent(boardId, updatedMap) {
    try {
        await connectMongo();
        const updatedBoard = await Board.findByIdAndUpdate(
            boardId,
            { content: updatedMap },
            { new: true }
        );
        return { success: true, board: updatedBoard };
    } catch (error) {
        console.error('Error updating board:', error);
        return { success: false, error: error.message };
    }
} 