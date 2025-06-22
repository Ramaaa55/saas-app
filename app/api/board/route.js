import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/app/models/User";
import Board from "@/app/models/Board";

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, content, userId } = await request.json();

        await connectMongo();

        const board = await Board.create({
            userId: session.user.id,
            name,
            content,
        });

        await User.findByIdAndUpdate(
            session.user.id,
            { $push: { boards: board._id } }
        );

        return NextResponse.json(board);
    } catch (error) {
        console.error("Error creating board:", error);
        return NextResponse.json(
            { error: "Failed to create board" },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const boardId = searchParams.get("boardId");

        if (boardId) {
            // Get specific board
            await connectMongo();
            const board = await Board.findOne({
                _id: boardId,
                userId: session.user.id,
            });

            if (!board) {
                return NextResponse.json({ error: "Board not found" }, { status: 404 });
            }

            return NextResponse.json(board);
        } else {
            // Get all boards for user
            await connectMongo();
            const boards = await Board.find({ userId: session.user.id }).sort({
                createdAt: -1,
            });

            return NextResponse.json(boards);
        }
    } catch (error) {
        console.error("Error fetching boards:", error);
        return NextResponse.json(
            { error: "Failed to fetch boards" },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { boardId, content } = await request.json();

        if (!boardId || !content) {
            return NextResponse.json(
                { error: "Board ID and content are required" },
                { status: 400 }
            );
        }

        await connectMongo();

        const board = await Board.findOneAndUpdate(
            {
                _id: boardId,
                userId: session.user.id,
            },
            {
                content: content,
            },
            { new: true }
        );

        if (!board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        return NextResponse.json(board);
    } catch (error) {
        console.error("Error updating board:", error);
        return NextResponse.json(
            { error: "Failed to update board" },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const boardId = searchParams.get("boardId");

        if (!boardId) {
            return NextResponse.json(
                { error: "Board ID is required" },
                { status: 400 }
            );
        }

        await connectMongo();

        const board = await Board.findOneAndDelete({
            _id: boardId,
            userId: session.user.id,
        });

        if (!board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Board deleted successfully" });
    } catch (error) {
        console.error("Error deleting board:", error);
        return NextResponse.json(
            { error: "Failed to delete board" },
            { status: 500 }
        );
    }
}