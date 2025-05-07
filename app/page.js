import ButtonLogin from "@/components/ButtonLogin";

export default function Home() {
  const isLoggedIn = true;
  const name = "Ramiro";

  return (
   <main>
    <section className="text-center py-32 px-8 max-w-3xl mx-auto">
    <h1 className="text-4xl font-extrabold mb-6"> Turn Your Ideas Into Smart, Stunning Concept Maps — Instantly </h1>
      <div className="opacity-90 mb-10"> Instantly turn any text into a clear, AI-powered concept map — fast, smart, and effortless. </div>

      <ButtonLogin isLoggedIn={isLoggedIn} name={name}><div></div></ButtonLogin>
    
    </section>
   </main>
   
  );
}
