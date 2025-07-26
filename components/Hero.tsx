import Image from "next/image";

import config from "@/config";

import TestimonialsAvatars from "./TestimonialsAvatars";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight">
          Launch your Agentic SaaS in days, not weeks
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          FeNAgO empowers students, developers, startups, and entrepreneurs to
          build fully agentic SaaS solutions at lightning speed by handling
          security (logins & registration), database setup, SEO, and
          monetization right out of the box—powered by Next.js, Tailwind, and
          React. All you bring is your idea!
        </p>
        <a href="https://fenago.com" className="btn btn-primary btn-wide">
          Get {config.appName}
        </a>

        <TestimonialsAvatars priority={true} />
      </div>
      <div className="lg:w-full">
        <Image
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop"
          alt="FeNAgO product demo"
          className="w-full"
          priority={true}
          width={500}
          height={500}
        />
      </div>
    </section>
  );
};

export default Hero;
