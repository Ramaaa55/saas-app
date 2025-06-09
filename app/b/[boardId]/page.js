import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Board from "@/app/models/Board";
import { auth } from "@/auth";
import Link from "next/link";
import ButtonDeleteBoard from "@/components/ButtonDeleteBoard";
import ConceptMapVisualizer from "@/components/ConceptMapVisualizer";
import { ReactFlowProvider } from 'reactflow';
import ClientConceptMapWrapper from '@/components/ClientConceptMapWrapper';

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
    redirect("/dashboard");
  }
  const boardId = decodeURIComponent(params.boardId);
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

      <section className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        {/* Concept Map Visualization */}
        <div className="bg-base-100 p-8 rounded-3xl min-h-[500px]" data-testid="mapa-generado">
          <h2 className="text-xl font-bold mb-6">Concept Map</h2>
          {board.content ? (
            <ClientConceptMapWrapper conceptMap={board.content} />
          ) : (
            <p className="text-center text-gray-500">No concept map data available.</p>
          )}
        </div>

        {/* Board Actions */}
        <div className="flex gap-4 justify-end">
          <ButtonDeleteBoard boardId={board._id.toString()} />
        </div>
      </section>
    </main>
  );
}
