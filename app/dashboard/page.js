import ButtonLogout from "@/components/ButtonLogout";
import FormNewBoard from "@/components/FormNewBoard";
import { auth } from "@/auth";
import connectMongo from "@/libs/mongoose";
import User from "../models/User";
import Board from "../models/Board";
import Link from "next/link";
import ButtonDeleteBoard from "@/components/ButtonDeleteBoard";

// Fetch user data including their concept maps
async function getUser() {
  const session = await auth();
  await connectMongo();
  return await User.findById(session.user.id).populate("boards");
}

export default async function Dashboard() {
  const user = await getUser();
  const session = await auth();

  return (
    <main className="bg-base-200 min-h-screen">
      {/* Header Section
          - Displays personalized welcome message with user's name
          - Logout button positioned on the right */}
      <section className="bg-base-100">
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome back, {session.user.name || 'User'}!</h1>
          <ButtonLogout />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        {/* Navigation Menu
            - Primary navigation links for main sections
            - Dashboard is highlighted as active
            - Responsive design with consistent spacing */}
        <div className="flex gap-4 mb-8">
          <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
          <Link href="/dashboard/maps" className="btn btn-ghost">My Maps</Link>
          <Link href="/dashboard/settings" className="btn btn-ghost">Settings</Link>
          <Link href="/dashboard/billing" className="btn btn-ghost">Billing</Link>
        </div>

        {/* Create New Concept Map Section
            - Prominent section for creating new maps
            - Clean, focused form design
            - Clear call-to-action */}
        <div className="bg-base-100 p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-4">Create New Concept Map</h2>
          <FormNewBoard />
        </div>

        {/* Existing Maps Section
            - Grid layout for better organization
            - Responsive design (1 column on mobile, 2 on tablet, 3 on desktop)
            - Each map displayed as a card with:
              * Title
              * Creation date
              * View and Delete actions
            - Empty state message when no maps exist */}
        <div className="bg-base-100 p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-6">Your Concept Maps ({user.boards.length})</h2>
          
          {user.boards.length === 0 ? (
            <p className="text-center text-gray-500">No concept maps yet. Create your first one above!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.boards.map((board) => (
                <div key={board._id} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">{board.name}</h3>
                    <p className="text-sm opacity-70">
                      Created: {new Date(board.createdAt).toLocaleDateString()}
                    </p>
                    <div className="card-actions justify-end mt-4">
                      <Link 
                        href={`/dashboard/b/${board._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        View
                      </Link>
                      <ButtonDeleteBoard boardId={board._id.toString()} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
