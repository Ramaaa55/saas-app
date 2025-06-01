import mongoose from "mongoose";
import User from "@/app/models/User";
import Board from "@/app/models/Board";


const connectMongo = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
    } catch (e) {
        console.error("Mongose error: " + e.message);
    }
};

export default connectMongo