import FormNewBoard from "@/components/FormNewBoard";
import Link from "next/link";

export default function NewConceptMap() {
  return (
    <main className="bg-base-200 min-h-screen">
      {/* HEADER */}
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
            Back to Dashboard
          </Link>
          <h1 className="font-extrabold text-xl">Create New Concept Map</h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-12">
        <div className="bg-base-100 p-8 rounded-3xl">
          <h2 className="font-bold text-xl mb-4">Generate Your Concept Map</h2>
          <p className="opacity-70 mb-8">Enter a topic or idea to create a new concept map. Our AI will help you organize and visualize your thoughts.</p>
          <FormNewBoard />
        </div>
      </section>
    </main>
  );
} 