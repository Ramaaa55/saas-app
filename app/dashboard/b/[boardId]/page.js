import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Board from "@/app/models/Board";
import { auth } from "@/auth";
import Link from "next/link";
import CardBoardLink from "@/components/CardBoardLink";
import ButtonDeleteBoard from "@/components/ButtonDeleteBoard";

async function getBoard(boardId) {
  const session = await auth();

  await connectMongo();

  const board = await Board.findOne({
    _id: boardId,
    userId: session?.user?.id,
  });

  if (!board) {
    redirect("/dashboard");
  }

  return board;
}

export default async function FeedbackBoard({ params }) {
  if (!params?.boardId) {
    // fallback in case params is undefined
    redirect("/dashboard");
  }

  const boardId = decodeURIComponent(params.boardId); // ensure valid string
  const board = await getBoard(boardId);

  return (
    <main className="bg-base-200 min-h-screen">
      {/* 🧠 Board name displayed in the header and below */}
      <section className="bg-base-100">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
            Back
          </Link>
          <h1 className="font-extrabold text-xl">{board.name}</h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-12 space-y-12">
        {/* 🔗 Enlace visual del board */}
        <CardBoardLink boardId={board._id.toString()} />

        {/* 🗑️ Botón para eliminar el board */}
        <ButtonDeleteBoard boardId={board._id.toString()} />
      </section>
    </main>
  );
}
