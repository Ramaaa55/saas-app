import ButtonLogin from "@/components/ButtonLogin";


export default function Home() {
  const isLoggedIn = true;
  const name = "Ramiro";

  return (
   <main>
    <section className="bg-base-200">
     <div className="max-w-3xl mx-auto flex justify-between items-center px-8 py-2">
      <div className="font-bold">ConceptMapSaaS</div>
      <div className="space-x-4 max-md:hidden">
        <a>Pricing</a>
        <a>FAQ</a>
      </div>
      <div>
        <ButtonLogin isLoggedIn={isLoggedIn} name={name} />
      </div>
     </div>  
    </section>
    <section className="text-center py-32 px-8 max-w-3xl mx-auto">
    <h1 className="text-4xl font-extrabold mb-6"> Turn Your Ideas Into Smart, Stunning Concept Maps — Instantly </h1>
      <div className="opacity-90 mb-10"> Instantly turn any text into a clear, AI-powered concept map — fast, smart, and effortless. </div>

      <ButtonLogin isLoggedIn={isLoggedIn} name={name} />
    
    </section>
   </main>
   
  );
}
