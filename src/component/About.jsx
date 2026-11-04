import { Link } from "react-router-dom";
import { LandPlot, ShieldCheck, Users } from "lucide-react";
import Navbar from "./Navbar";
import topBackground from "../assets/top-background.jpg";

const values = [
  {
    title: "Simple booking",
    description: "Find a pitch and send a booking request in a few clear steps.",
    icon: LandPlot,
  },
  {
    title: "Built for teams",
    description: "Support matches, training sessions, and community events.",
    icon: Users,
  },
  {
    title: "Clear availability",
    description: "Review pitch status before choosing where to play.",
    icon: ShieldCheck,
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <section
        className="bg-cover bg-center px-6 py-20 sm:py-28"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 30, 20, 0.72), rgba(0, 30, 20, 0.72)), url(${topBackground})`,
        }}
      >
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-bold uppercase text-green-300">About Us</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black text-white sm:text-5xl">
            Franco Pitch Booking
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-gray-100">
            A convenient way for teams and players to find a pitch and request a time to play.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-extrabold">Book. Play. Enjoy.</h2>
          <p className="mt-4 leading-7 text-gray-600">
            Franco Pitch Booking brings pitch availability and booking requests together in one place. Browse the available facilities, choose a pitch that suits your game, and submit your request for review.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {values.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-gray-200 bg-white p-5">
              <Icon size={25} className="text-green-700" />
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">
            About the Developer
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Chinedu Gabriel Ebubechukwu
              </h2>
              <p className="mt-1 text-sm font-semibold text-green-700">
                Software Developer
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Computer Science Student
              </p>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Interested in building useful software solutions that make
              everyday tasks simpler and more accessible.
            </p>
          </div>
        </section>

        <Link
          to="/book"
          className="mt-9 inline-flex rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
        >
          Browse pitches
        </Link>
      </main>

      <footer className="bg-green-950 px-6 py-7 text-center text-sm text-gray-300">
        <p>Franco Pitch Booking · Book · Play · Enjoy.</p>
        <p className="mt-2 text-xs text-gray-400">
          Designed &amp; Developed by Chinedu Gabriel Ebubechukwu
        </p>
      </footer>
    </div>
  );
}



// .counter {
//   font-size: 16px;
//   padding: 5px 10px;
//   border-radius: 5px;
//   color: var(--accent);
//   background: var(--accent-bg);
//   border: 2px solid transparent;
//   transition: border-color 0.3s;
//   margin-bottom: 24px;

//   &:hover {
//     border-color: var(--accent-border);
//   }
//   &:focus-visible {
//     outline: 2px solid var(--accent);
//     outline-offset: 2px;
//   }
// }

// .hero {
//   position: relative;

//   .base,
//   .framework,
//   .vite {
//     inset-inline: 0;
//     margin: 0 auto;
//   }

//   .base {
//     width: 170px;
//     position: relative;
//     z-index: 0;
//   }

//   .framework,
//   .vite {
//     position: absolute;
//   }

//   .framework {
//     z-index: 1;
//     top: 34px;
//     height: 28px;
//     transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
//       scale(1.4);
//   }

//   .vite {
//     z-index: 0;
//     top: 107px;
//     height: 26px;
//     width: auto;
//     transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
//       scale(0.8);
//   }
// }

// #center {
//   display: flex;
//   flex-direction: column;
//   gap: 25px;
//   place-content: center;
//   place-items: center;
//   flex-grow: 1;

//   @media (max-width: 1024px) {
    // padding: 32px 20px 24px;
//     gap: 18px;
//   }
// }

// #next-steps {
//   display: flex;
//   border-top: 1px solid var(--border);
//   text-align: left;

//   & > div {
//     flex: 1 1 0;
//     padding: 32px;
//     @media (max-width: 1024px) {
//       padding: 24px 20px;
//     }
//   }

//   .icon {
//     margin-bottom: 16px;
//     width: 22px;
//     height: 22px;
//   }

//   @media (max-width: 1024px) {
//     flex-direction: column;
//     text-align: center;
//   }
// }

// #docs {
//   border-right: 1px solid var(--border);

//   @media (max-width: 1024px) {
//     border-right: none;
//     border-bottom: 1px solid var(--border);
//   }
// }

// #next-steps ul {
//   list-style: none;
//   padding: 0;
//   display: flex;
//   gap: 8px;
//   margin: 32px 0 0;

//   .logo {
//     height: 18px;
//   }

//   a {
//     color: var(--text-h);
//     font-size: 16px;
//     border-radius: 6px;
//     background: var(--social-bg);
//     display: flex;
//     padding: 6px 12px;
//     align-items: center;
//     gap: 8px;
//     text-decoration: none;
//     transition: box-shadow 0.3s;

//     &:hover {
//       box-shadow: var(--shadow);
//     }
//     .button-icon {
//       height: 18px;
//       width: 18px;
//     }
//   }

//   @media (max-width: 1024px) {
//     margin-top: 20px;
//     flex-wrap: wrap;
//     justify-content: center;

//     li {
//       flex: 1 1 calc(50% - 8px);
//     }

//     a {
//       width: 100%;
//       justify-content: center;
//       box-sizing: border-box;
//     }
//   }
// }

// #spacer {
//   height: 88px;
//   border-top: 1px solid var(--border);
//   @media (max-width: 1024px) {
//     height: 48px;
//   }
// }

// .ticks {
//   position: relative;
//   width: 100%;

//   &::before,
//   &::after {
//     content: '';
//     position: absolute;
//     top: -4.5px;
//     border: 5px solid transparent;
//   }

//   &::before {
//     left: 0;
//     border-left-color: var(--border);
//   }
//   &::after {
//     right: 0;
//     border-right-color: var(--border);
//   }
// }
//  -->