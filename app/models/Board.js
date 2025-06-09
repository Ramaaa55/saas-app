import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: Object, // Stores the concept map object (nodes, connections, etc.)
        required: false,
    }
}, { timestamps: true }); 

export default mongoose.models.Board || mongoose.model("Board", boardSchema);