"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const FormNewBoard = () => {
    const router = useRouter();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            const data = await axios.post("/api/board", { name });

            
            setName("");

            toast.success("Board created!");

            router.refresh();

        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || "Someting went wrong"

            toast.error(errorMessage); 
        } finally {
            setIsLoading(false);
        }


    };

    return (
    <form className="bg-base-100 p-8 rounded-3xl space-y-8"
        onSubmit={handleSubmit}

    >
        <p className="font-bold text-lg">Create a new feedback board</p>
        <input required type="text" placeholder="Type here" className="input" value={name} onChange={(event) => {
            const newName = event.target.value;
            setName(newName);
        }} />
    
     <button className="btn btn-primary btn-block" type="submit">{isLoading && <span className="loading loading-spinner loading-xs"></span>}Create Board</button>
    </form>    
   );
};

    export default FormNewBoard;