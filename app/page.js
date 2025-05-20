import ButtonLogin from "@/components/ButtonLogin";
import ListItem from "@/components/ListItems";
import FAQListItem from "@/components/FAQListItem";
import Image from "next/image";
import productDemo from "./productDemo.jpeg"


export default function Home() {
  const isLoggedIn = true;
  const name = "Ramiro";

 const pricingFeaturesList = [
  "Feature 1",
  "Feature 2",
  "Feature 3",
  "Feature 4",
 ];
 

  return (
   <main>
    {/*HEADER*/}
    <section className="bg-base-200">
     <div className="max-w-5xl mx-auto flex justify-between items-center px-8 py-2">
      <div className="font-bold">ConceptMapSaaS</div>
      <div className="space-x-4 max-md:hidden">
        <a className="link link-hover" href="#pricing">Pricing</a>
        <a className="link link-hover" href="#FAQ">FAQ</a>
      </div>
      <div>
        <ButtonLogin isLoggedIn={isLoggedIn} name={name} />
      </div>
     </div>  
    </section>
    {/*HERO*/}
    <section className="text-center lg:text-left py-32 px-8 max-w-5xl mx-auto flex flex-col lg:flex-row gap-14 items-center lg:items-start">

      <Image src={productDemo} alt="Product demo" className="w-96 rounded-xl" />

    <div>
      <h1 className="text-4xl lg:text-5xl font-extrabold mb-6"> Turn Your Ideas Into Smart, Stunning Concept Maps — Instantly </h1>
      <div className="opacity-90 mb-10"> Instantly turn any text into a clear, AI-powered concept map — fast, smart, and effortless. </div>

      <ButtonLogin isLoggedIn={isLoggedIn} name={name} />
    </div>
    
    </section>
    {/*PRICING*/}
    <section className="bg-base-200" id="pricing">
      <div className="py-32 px-8 max-w-3xl mx-auto">
        <p className="text-sm uppercase font-medium text-center text-primary mb-4">Pricing</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold mb-12 text-center">
          Structured understanding with simple pricing
        </h2>
        
        <div className="p-8 bg-base-100 max-w-96 rounded-3xl mx-auto space-y-6">
          <div className="flex gap-2 items-baseline">
            <div className="text-4xl font-black">$4.99</div>
            <div className="uppercase text-sm font-medium opacity-60">/month</div>
          </div>
        
          <ul className="space-y-2">
            {
              pricingFeaturesList.map(
                (priceItem) => {
                  return <li className="flex gap-2 items-center" key={priceItem}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-green-600 size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {priceItem}</li>
                }
              )
            }
            
          </ul>

          <ButtonLogin isLoggedIn={isLoggedIn} name={name} extraStyle="w-full" />
        </div>
      </div>
    </section>
    {/* FAQ */}
    <section className="bg-base-200" id="FAQ">
      <div className="py-32 px-8 max-w-3xl mx-auto">
        <p className="text-sm uppercase font-medium text-center text-primary mb-4">FAQ</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold mb-12 text-center">
          Frecuently Asked Questions
        </h2>

        <ul className="max-w-lg mx-auto">
          {
            [
              { question : "Question 1", answer: "Answer 1", },
              { question : "Question 2", answer: "Answer 2", },
              { question : "Question 3", answer: "Answer 3", },
            ].map((qa) => (
              <FAQListItem key={qa.question} qa={qa} />
            )
              
            )
          }
        </ul>
      </div>
    </section>
   </main>
   
  );
}
