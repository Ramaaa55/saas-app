import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/app/models/User";
import Board from "@/app/models/Board";

export async function POST(req){
    try {
        const body = await req.json();
        
        if (!body.name) {
            return NextResponse.json(
                { error: "Board name is required"},
                { status: 400}
            );
        }   

        const session = await auth();

        if(!session) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        await connectMongo();

        console.log('API received content:', body.content);
        const user = await User.findById(session.user.id);

        const board = await Board.create({
            userId: user._id,
            name: body.name,
            content: body.content,
        });
        
        user.boards.push(board._id);
        await user.save();

        return NextResponse.json(board);

    } catch (e) {
        return NextResponse.json({ error: e.message },{ status: 500} );
    }
}


export async function DELETE(req){
    try {
        const { searchParams } = req.nextUrl;
        const boardId = searchParams.get("boardId");

        if (!boardId) {
            return NextResponse.json(
                { error: "boardId is required" },
                { status: 400 }
            );
        }

        const session = await auth();

        if (!session) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 401}
            );
        }

        await Board.deleteOne({
            _id: boardId,
            userId: session?.user?.id,
        });

        const user = await User.findById(session?.user?.id);
        user.boards = user.boards.filter((id) => id.toString() !== boardId);
        await user.save();

    } catch (e){
        return NextResponse.json({ error: e.message }, { status: 500}); 
    }
}