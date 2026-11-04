import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LandPlot, LogOut, Menu, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [user, setUser] = useState(null);
	const [loggingOut, setLoggingOut] = useState(false);
	const { pathname, hash } = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		let isMounted = true;

		// 1. Fetch current session on mount
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (isMounted) {
				setUser(session?.user ?? null);
			}
		});

		// 2. Listen for auth changes (sign in, sign out, token refresh)
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_OUT") {
				if (isMounted) setUser(null);
			} else if (isMounted) {
				setUser(session?.user ?? null);
			}
		});

		// 3. Clean up subscription on unmount
		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	async function handleLogout() {
		setLoggingOut(true);
		try {
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error("Logout error:", error.message);
				return;
			}
			setMenuOpen(false);
			navigate("/");
		} catch (err) {
			console.error("Unexpected logout error:", err);
		} finally {
			setLoggingOut(false);
		}
	}

	const baseLinks = [
		{ label: "Home", to: "/" },
		{ label: "Book a Pitch", to: "/book" },
		{ label: "My Bookings", to: "/my-bookings" },
		{ label: "About Us", to: "/about" },
		{ label: "Contact", to: "/#contact" },
	];

	function isActive(to) {
		if (to === "/#contact") {
			return pathname === "/" && hash === to.slice(1);
		}

		return pathname === to;
	}

	return (
		<header className="w-full bg-green-950 px-4 py-4 sm:px-6">
			<div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
				<Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
					<span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500">
						<LandPlot size={25} className="text-white" />
					</span>
					<span>
						<span className="block text-lg font-bold leading-tight text-white">
							Franco Pitch Booking
						</span>
						<span className="block text-xs font-medium tracking-wide text-green-400">
							Book • Play • Enjoy.
						</span>
					</span>
				</Link>

				<button
					type="button"
					className="rounded-lg p-2 text-white transition hover:bg-green-900 lg:hidden"
					onClick={() => setMenuOpen(!menuOpen)}
					aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
					aria-expanded={menuOpen}
				>
					{menuOpen ? <X size={23} /> : <Menu size={23} />}
				</button>

				<nav
					className={`${menuOpen ? "block" : "hidden"} order-3 w-full border-t border-white/10 pt-3 lg:order-none lg:block lg:w-auto lg:border-0 lg:pt-0`}
					aria-label="Main navigation"
				>
					<ul className="flex flex-col gap-1 text-sm font-semibold text-white lg:flex-row lg:items-center lg:gap-7">
						{baseLinks.map(({ label, to }) => (
							<li key={to}>
								<Link
									to={to}
									onClick={() => setMenuOpen(false)}
									aria-current={isActive(to) ? "page" : undefined}
									className={`block rounded-md px-3 py-2 transition hover:bg-green-900 hover:text-green-300 lg:px-0 lg:py-1 lg:hover:bg-transparent ${
										isActive(to) ? "text-green-300" : "text-white"
									}`}
								>
									{label}
								</Link>
							</li>
						))}

						{user ? (
							<li>
								<button
									type="button"
									onClick={handleLogout}
									disabled={loggingOut}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-green-900 hover:text-green-300 disabled:opacity-50 lg:w-auto lg:px-0 lg:py-1 lg:hover:bg-transparent"
								>
									<LogOut size={16} />
									<span>{loggingOut ? "Logging out..." : "Logout"}</span>
								</button>
							</li>
						) : (
							<>
								<li>
									<Link
										to="/login"
										onClick={() => setMenuOpen(false)}
										aria-current={isActive("/login") ? "page" : undefined}
										className={`block rounded-md px-3 py-2 transition hover:bg-green-900 hover:text-green-300 lg:px-0 lg:py-1 lg:hover:bg-transparent ${
											isActive("/login") ? "text-green-300" : "text-white"
										}`}
									>
										Login
									</Link>
								</li>
								<li>
									<Link
										to="/register"
										onClick={() => setMenuOpen(false)}
										aria-current={isActive("/register") ? "page" : undefined}
										className={`block rounded-md px-3 py-2 transition hover:bg-green-900 hover:text-green-300 lg:px-0 lg:py-1 lg:hover:bg-transparent ${
											isActive("/register") ? "text-green-300" : "text-white"
										}`}
									>
										Register
									</Link>
								</li>
							</>
						)}
					</ul>
				</nav>
			</div>
		</header>
	);
}

// import { useState } from "react";
// import topBackground from "../assets/top-background.jpg";
// 
// import { Calendar, Clock, LandPlot, UserRound, Users } from "lucide-react";
// 
// export default function BookPitch() {
//   const [selectedPitch, setSelectedPitch] = useState("");
//   const [date, setDate] = useState("");
//   const [time, setTime] = useState("");
//   const [eventName, setEventName] = useState("");
//   const [contactName, setContactName] = useState("");
// 
//   const pitches = [
//     {
//       id: "A",
//       name: "Pitch A",
//       type: "Main Pitch • Large size",
//       status: "Available",
//     },
//     {
//       id: "B",
//       name: "Pitch B",
//       type: "Standard Pitch • Medium size",
//       status: "Available",
//     },
//     {
//       id: "C",
//       name: "Pitch C",
//       type: "Turf Pitch • Medium size",
//       status: "Booked",
//     },
//     {
//       id: "D",
//       name: "Pitch D",
//       type: "Futsal Court • Small size",
//       status: "Available",
//     },
//     {
//       id: "E",
//       name: "Pitch E",
//       type: "Multipurpose Court • Medium size",
//       status: "Available",
//     },
//     {
//       id: "F",
//       name: "Pitch F",
//       type: "Training Ground • Large size",
//       status: "Available",
//     },
//     {
//       id: "G",
//       name: "Pitch G",
//       type: "Standard Pitch • Medium size",
//       status: "Booked",
//     },
//     {
//       id: "H",
//       name: "Pitch H",
//       type: "Turf Pitch • Medium size",
//       status: "Available",
//     },
//   ];
// 
//   const handleSubmit = (e) => {
//     e.preventDefault();
// 
//     if (!selectedPitch || !date || !time || !eventName || !contactName) {
//       alert("Please fill in all the booking details.");
//       return;
//     }
// 
//     alert("Booking request submitted successfully!");
// 
//     console.log({
//       selectedPitch,
//       date,
//       time,
//       eventName,
//       contactName,
//     });
//   };
// 
//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* =========================
//           NAVIGATION
//       ========================== */}
// 
//       <header className="bg-green-950 px-6 py-4">
//         <div className="mx-auto flex max-w-[1500px] items-center justify-between">
//           {/* LOGO */}
//           <div className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500">
//               <LandPlot size={25} className="text-white" />
//             </div>
// 
//             <div>
//               <h1 className="text-lg font-bold text-white">
//                 Franco Pitch Booking
//               </h1>
// 
//               <p className="text-xs text-green-400">Book • Play • Enjoy.</p>
//             </div>
//           </div>
// 
//           {/* NAVIGATION LINKS */}
//           <nav className="hidden md:block">
//             <div className="flex gap-9 text-sm font-bold text-white">
//               <a href="/" className="hover:text-green-400">
//                 Home
//               </a>
// 
//               <a
//                 href="/book"
//                 className="border-b-2 border-green-400 pb-2 text-green-400"
//               >
//                 Book a Pitch
//               </a>
// 
//               <a href="#" className="hover:text-green-400">
//                 My Bookings
//               </a>
// 
//               <a href="#" className="hover:text-green-400">
//                 About Us
//               </a>
// 
//               <a href="#" className="hover:text-green-400">
//                 Contact
//               </a>
//             </div>
//           </nav>
// 
//           {/* LOGIN */}
//           <button className="flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-900">
//             <UserRound size={18} />
//             Login
//           </button>
//         </div>
//       </header>
// 
//       {/*HERO*/}
// 
//       <section
//         className="relative bg-cover bg-center"
//         style={{
//           backgroundImage: ` url(${topBackground})`,
//         }}
//       >
//         <div className="mx-auto max-w-[1500px] px-8 py-16">
//           <a className="mb-2 text-sm font-bold text-green-400 " href="/">
//             ← Back to Home
//           </a>
// 
//           <h2 className="text-4xl font-black my-[10px] text-white md:text-5xl">
//             Book a Pitch
//           </h2>
// 
//           <p className="mt-3 text-white">
//             Fill in the details below to book your preferred pitch, date and
//             time.
//           </p>
//         </div>
//       </section>
// 
//       {/*MAIN CONTENT*/}
// 
//       <main className="mx-auto max-w-[1200px] px-6 py-10">
//         <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
//           {/*BOOKING FORM*/}
// 
//           <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//             <h2 className="mb-2 text-2xl font-bold text-gray-900">
//               Select Your Pitch
//             </h2>
// 
//             <p className="mb-6 text-sm text-gray-500">
//               Choose an available pitch for your match or event.
//             </p>
// 
//             {/* PITCHES */}
// 
//             <div className="grid gap-4 sm:grid-cols-2">
//               {pitches.map((pitch) => (
//                 <button
//                   key={pitch.id}
//                   type="button"
//                   disabled={pitch.status === "Booked"}
//                   onClick={() => setSelectedPitch(pitch.name)}
//                   className={`rounded-lg border-2 p-4 text-left transition
// 
//                     ${
//                       selectedPitch === pitch.name
//                         ? "border-green-500 bg-green-50"
//                         : "border-gray-200 bg-white"
//                     }
// 
//                     ${
//                       pitch.status === "Booked"
//                         ? "cursor-not-allowed opacity-50"
//                         : "hover:border-green-400"
//                     }
//                   `}
//                 >
//                   <div className="flex items-center justify-between">
//                     <h3 className="font-bold text-gray-900">{pitch.name}</h3>
// 
//                     <span
//                       className={`rounded-full px-2 py-1 text-xs font-bold
// 
//                         ${
//                           pitch.status === "Available"
//                             ? "bg-green-100 text-green-700"
//                             : "bg-red-100 text-red-600"
//                         }
//                       `}
//                     >
//                       {pitch.status}
//                     </span>
//                   </div>
// 
//                   <p className="mt-2 text-xs text-gray-500">{pitch.type}</p>
//                 </button>
//               ))}
//             </div>
// 
//             {/* DATE */}
// 
//             <div className="mt-7">
//               <label className="mb-2 block text-sm font-bold text-gray-700">
//                 Date
//               </label>
// 
//               <div className="relative">
//                 <Calendar
//                   size={19}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
//                 />
// 
//                 <input
//                   type="date"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                   className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-green-500"
//                 />
//               </div>
//             </div>
// 
//             {/* TIME */}
// 
//             <div className="mt-5">
//               <label className="mb-2 block text-sm font-bold text-gray-700">
//                 Time
//               </label>
// 
//               <div className="relative">
//                 <Clock
//                   size={19}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
//                 />
// 
//                 <input
//                   type="time"
//                   value={time}
//                   onChange={(e) => setTime(e.target.value)}
//                   className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-green-500"
//                 />
//               </div>
//             </div>
// 
//             {/* EVENT NAME */}
// 
//             <div className="mt-5">
//               <label className="mb-2 block text-sm font-bold text-gray-700">
//                 Event / Team Name
//               </label>
// 
//               <div className="relative">
//                 <Users
//                   size={19}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
//                 />
// 
//                 <input
//                   type="text"
//                   placeholder="e.g. Computer Science FC"
//                   value={eventName}
//                   onChange={(e) => setEventName(e.target.value)}
//                   className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 outline-none focus:border-green-500"
//                 />
//               </div>
//             </div>
// 
//             {/* CONTACT NAME */}
// 
//             <div className="mt-5">
//               <label className="mb-2 block text-sm font-bold text-gray-700">
//                 Contact Name
//               </label>
// 
//               <div className="relative">
//                 <UserRound
//                   size={19}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
//                 />
// 
//                 <input
//                   type="text"
//                   placeholder="Enter your name"
//                   value={contactName}
//                   onChange={(e) => setContactName(e.target.value)}
//                   className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 outline-none focus:border-green-500"
//                 />
//               </div>
//             </div>
// 
//             {/* SUBMIT */}
// 
//             <button
//               onClick={handleSubmit}
//               className="mt-7 w-full rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-500"
//             >
//               Submit Booking Request
//             </button>
//           </div>
// 
//           {/* =========================
//               BOOKING SUMMARY
//           ========================== */}
// 
//           <aside>
//             <div className="sticky top-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//               <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
//                 <Calendar size={21} className="text-green-600" />
//                 Booking Summary
//               </h2>
// 
//               {/* SELECTED PITCH */}
// 
//               <div className="mb-5 rounded-lg bg-green-50 p-4">
//                 <p className="text-xs text-gray-500">Selected Pitch</p>
// 
//                 <h3 className="mt-1 text-lg font-bold text-green-700">
//                   {selectedPitch || "Not selected"}
//                 </h3>
//               </div>
// 
//               {/* DATE */}
// 
//               <div className="mb-5 flex gap-3">
//                 <Calendar size={20} className="text-green-600" />
// 
//                 <div>
//                   <p className="text-xs text-gray-500">Date</p>
// 
//                   <p className="font-semibold">{date || "Not selected"}</p>
//                 </div>
//               </div>
// 
//               {/* TIME */}
// 
//               <div className="mb-5 flex gap-3">
//                 <Clock size={20} className="text-green-600" />
// 
//                 <div>
//                   <p className="text-xs text-gray-500">Time</p>
// 
//                   <p className="font-semibold">{time || "Not selected"}</p>
//                 </div>
//               </div>
// 
//               {/* EVENT */}
// 
//               <div className="mb-5 flex gap-3">
//                 <Users size={20} className="text-green-600" />
// 
//                 <div>
//                   <p className="text-xs text-gray-500">Event / Team</p>
// 
//                   <p className="font-semibold">
//                     {eventName || "Not specified"}
//                   </p>
//                 </div>
//               </div>
// 
//               {/* CONTACT */}
// 
//               <div className="flex gap-3">
//                 <UserRound size={20} className="text-green-600" />
// 
//                 <div>
//                   <p className="text-xs text-gray-500">Contact Name</p>
// 
//                   <p className="font-semibold">
//                     {contactName || "Not specified"}
//                   </p>
//                 </div>
//               </div>
// 
//               {/* INFORMATION */}
// 
//               <div className="mt-7 rounded-lg bg-gray-50 p-4">
//                 <p className="text-xs leading-relaxed text-gray-500">
//                   Your booking request will be sent to the Franco Committee for
//                   approval. You will be notified when your booking is approved
//                   or rejected.
//                 </p>
//               </div>
//             </div>
//           </aside>
//         </div>
//       </main>
// 
//       {/* =========================
//           FOOTER
//       ========================== */}
// 
//       <footer className="bg-green-950 px-6 py-7">
//         <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 md:flex-row">
//           <div>
//             <h3 className="font-bold text-white">Franco Pitch Booking</h3>
// 
//             <p className="text-xs text-green-400">Book • Play • Enjoy.</p>
//           </div>
// 
//           <p className="text-xs text-gray-400">
//             © 2026 Franco Pitch Booking System. All rights reserved.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }
