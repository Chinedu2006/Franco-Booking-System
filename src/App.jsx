
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Booking from "./component/Booking";
import BookPitch from "./component/BookPitch";
import MyBookings from "./component/MyBookings";
import AdminDashboard from "./component/AdminDashboard";
import Login from "./component/Login";
import Register from "./component/Register";
import About from "./component/About";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Booking />} />
        <Route path="/book" element={<BookPitch />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
