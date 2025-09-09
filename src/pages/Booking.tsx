type BookingTimeRow = { time: string };

import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient"; // Adjust if path differs

export default function Booking() {
  // --- FORM STATE ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [service, setService] = useState("");
  const [serviceFee, setServiceFee] = useState(0);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [earlyLateFee, setEarlyLateFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentType, setPaymentType] = useState<"Deposit" | "Full">("Deposit");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1); // NEW: number of sessions


  // --- UTILS ---
  const updateTotal = (serviceFeeValue = serviceFee, earlyLate = earlyLateFee) => {
    setTotal(serviceFeeValue + earlyLate);
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    const [hour] = value.split(":").map(Number);
    const fee = hour < 9 || hour >= 17 ? 15 : 0;
    setEarlyLateFee(fee);
    updateTotal(serviceFee, fee);
  };

  const handleServiceChange = (value: string) => {
    setService(value);
  const fee = value === "Soft Glam" ? 50 : value === "Full Glam" ? 60 : 0;
    setServiceFee(fee);
    updateTotal(fee, earlyLateFee);
  };

  // Generate half-hour slots from 06:00 to 21:00
  const generateHalfHourSlots = () => {
    const slots: string[] = [];
    for (let h = 6; h <= 21; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 21) slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    return slots;
  };

  // Build a blocked set with 1.5h rule
  const buildBlockedSet = (times: string[]) => {
    const blocked = new Set<string>();
    times.forEach((t) => {
      const [hour, minute] = t.split(":").map(Number);
      const mins = hour * 60 + minute;
      for (let offset = 0; offset <= 90; offset += 30) {
        const totalMins = mins + offset;
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        blocked.add(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    });
    return blocked;
  };

  // --- FETCH BOOKINGS ---
  useEffect(() => {
    const fetchForDate = async () => {
      if (!date) {
        setBookedTimes([]);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("time")
        .eq("date", date)
        .returns<BookingTimeRow[]>();

      if (error) {
        console.error("Fetch bookings error:", error);
        setBookedTimes([]);
        return;
      }

      // Normalize, de-dupe, sort
      const times = Array.from(
        new Set((data ?? []).map((r) => r.time.slice(0, 5)))
      ).sort((a, b) => {
        const [ah, am] = a.split(":").map(Number);
        const [bh, bm] = b.split(":").map(Number);
        return ah * 60 + am - (bh * 60 + bm);
      });

      setBookedTimes(times);
    };

    fetchForDate();
  }, [date]);

  const allSlots = generateHalfHourSlots();
  const blocked = buildBlockedSet(bookedTimes);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;

  // Honeypot (spam bot trap)
  if ((form.elements.namedItem("honeypot") as HTMLInputElement)?.value) return;

  if (!date || !time) {
    alert("Please select date & time");
    return;
  }

  // Conflict check (1.5 hr overlap)
  const [hour, minute] = time.split(":").map(Number);
  const startMins = hour * 60 + minute;
  const conflictTimes: string[] = [];
  for (let offset = 0; offset <= 90; offset += 30) {
    const totalMins = startMins + offset;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    conflictTimes.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  const { data: clash } = await supabase
    .from("bookings")
    .select("time")
    .eq("date", date)
    .in("time", conflictTimes);

  if (clash && clash.length > 0) {
    alert("That time overlaps an existing booking.");
    return;
  }

  // Build booking payload
  const payload = {
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  email: email.trim(),
  mobile: mobile.trim(),        // <-- use 'phone' to match your table
  location: location.trim(),
  service,
  date,                        // 'YYYY-MM-DD'
  time,                        // 'HH:MM' (stored as text in your table)
  total: Number(total) || 0,
  created_at: new Date().toISOString(),
};

  // Insert into Supabase
  const { data: inserted, error: insertErr } = await supabase
    .from("bookings")
    .insert(payload)
    .select()
    .single();

  if (insertErr) {
    console.error("Supabase insert error:", insertErr);
    const msg =
      insertErr.message?.includes("row-level security")
        ? "Permission denied by database policy (RLS)."
        : insertErr.details || insertErr.message || "Unknown error";
    alert(`Error saving booking: ${msg}`);
    return;
  }

  console.log("Inserted booking:", inserted);

  // EmailJS details (include bookingId)
  const bookingDetails = {
    firstName,
    lastName,
    email,
    mobile,
    service,
    location,
    date,
    time,
    earlyLateFee,
    total,
    paymentType,
    bookingId: inserted.id, // NEW: send booking ID in the email
  };

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_CUSTOMER,
      bookingDetails,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_EPM,
      bookingDetails,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
  } catch (err) {
    console.error("EmailJS error:", err);
  }

  // Reset form state
  form.reset();
  setFirstName("");
  setLastName("");
  setEmail("");
  setMobile("");
  setLocation("");
  setDate("");
  setTime("");
  setService("");
  setEarlyLateFee(0);
  setServiceFee(0);
  setTotal(0);
  setPaymentType("Deposit");

  alert("Booking request sent!");
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#e6dac0] to-[#f9f7f2] flex flex-col items-center px-4 py-10">
      <img src="/epm-logo-optimized.png" alt="EPM Makeup" className="w-60 md:w-72 mb-6" />
      <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-800 mb-8">
        Book an Appointment
      </h2>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-[#fef9f1] border border-[#d9c08b] rounded-2xl p-8 shadow-xl space-y-6"
      >
        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="First Name" className="input-style" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <input placeholder="Last Name (optional)" className="input-style" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input placeholder="Email" className="input-style" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="tel" placeholder="Mobile" className="input-style" value={mobile} onChange={(e) => setMobile(e.target.value)} pattern="^[0-9+\\s]*$" required />
          <select className="input-style bg-[#FEF9F1]" value={service} onChange={(e) => handleServiceChange(e.target.value)} required>
            <option value="">Select Service</option>
            <option value="Soft Glam">Soft Glam (€50)</option>
            <option value="Full Glam">Full Glam (€60)</option>
          </select>
          <input placeholder="Location" className="input-style" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>

{/* Date, Time & Quantity */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label htmlFor="date" className="block text-sm text-gray-600 mb-1">Select Date</label>
    <input
      id="date"
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      className="input-style bg-[#FEF9F1]"
      required
    />
  </div>
  <div>
    <label htmlFor="time" className="block text-sm text-gray-600 mb-1">Select Time</label>
    <select
      id="time"
      className="input-style bg-[#FEF9F1]"
      value={time}
      onChange={(e) => handleTimeChange(e.target.value)}
      required
    >
      <option value="">Select Time</option>
      {allSlots.map((slot) => (
        <option key={slot} value={slot} disabled={blocked.has(slot)}>
          {slot} {blocked.has(slot) ? "(Booked)" : ""}
        </option>
      ))}
    </select>
  </div>
  <div>
    <label htmlFor="qty" className="block text-sm text-gray-600 mb-1">Quantity (sessions)</label>
    <select
      id="qty"
      className="input-style bg-[#FEF9F1]"
      value={quantity}
      onChange={(e) => setQuantity(Number(e.target.value))}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <option key={i + 1} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  </div>
</div>


        {/* Fee Summary */}
        <div className="flex justify-between text-gray-700 font-medium">
          <span>Service Fee</span><span>€{serviceFee}</span>
        </div>
        <div className="flex justify-between text-gray-700 font-medium">
          <span>Early/Late Fee</span><span>€{earlyLateFee}</span>
        </div>
        <div className="flex justify-between text-gray-800 font-bold text-lg">
          <span>Total</span><span>€{total}</span>
        </div>

        {/* Payment Option */}
        <div className="flex gap-8 text-sm">
          <label className="gold-radio">
            <input type="radio" name="payment" value="Deposit" checked={paymentType === "Deposit"} onChange={() => setPaymentType("Deposit")} /> Pay Deposit
          </label>
          <label className="gold-radio">
            <input type="radio" name="payment" value="Full" checked={paymentType === "Full"} onChange={() => setPaymentType("Full")} /> Pay in Full
          </label>
        </div>

        <input type="text" name="honeypot" className="hidden" autoComplete="off" />
        <button type="submit" className="bg-[#d4af37] hover:bg-[#c7a233] text-white font-bold py-3 px-6 rounded-xl w-full transition duration-300 shadow-md">
          Book Now
        </button>
      </form>

      {/* Footer */}
      <div className="mt-10 text-center text-sm text-gray-700 space-y-2">
        <div className="flex justify-center gap-6 text-2xl">
          <a href="https://www.instagram.com/eunicepmakeup" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:text-[#c7a233]"><FaInstagram /></a>
          <a href="https://www.tiktok.com/@epmmakeup" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:text-[#c7a233]"><FaTiktok /></a>
        </div>
        <div>© {new Date().getFullYear()} Vic - IT. All rights reserved.</div>
      </div>
    </div>
  );
}
