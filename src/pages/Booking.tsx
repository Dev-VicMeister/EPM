import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { FaInstagram, FaTiktok } from 'react-icons/fa';


export default function Booking() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [service, setService] = useState('');
  const [serviceFee, setServiceFee] = useState(0);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [earlyLateFee, setEarlyLateFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentType, setPaymentType] = useState('Deposit');

  const updateTotal = (serviceFeeValue = serviceFee, earlyLate = earlyLateFee) => {
    const totalValue = serviceFeeValue + earlyLate;
    setTotal(totalValue);
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    const [hour] = value.split(':').map(Number);
    const fee = hour < 9 || hour >= 17 ? 15 : 0;
    setEarlyLateFee(fee);
    updateTotal(serviceFee, fee);
  };

  const handleServiceChange = (value: string) => {
    setService(value);
    let fee = 0;
    if (value === 'Soft Glam') fee = 50;
    if (value === 'Full Glam') fee = 60;
    setServiceFee(fee);
    updateTotal(fee, earlyLateFee);
  };

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const form = e.target as HTMLFormElement;
  const honeypot = (form.elements.namedItem("honeypot") as HTMLInputElement)?.value;

  if (honeypot) {
    console.warn("Spam bot detected");
    return;
  }

  const bookingDetails = {
    name,
    email,
    mobile,
    service,
    location,
    date,
    time,
    earlyLateFee,
    total,
    paymentType,
  };

  emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_CUSTOMER,
  bookingDetails,
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
);

emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_EPM,
  bookingDetails,
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
);

(e.target as HTMLFormElement).reset();

setName('');
setEmail('');
setMobile('');
setLocation('');
setDate('');
setTime('');
setService('');


  alert('Booking request sent!');
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#e6dac0] to-[#f9f7f2] flex flex-col items-center justify-start px-4 py-10">
      {/* Logo */}
      <img
        src="/epm-logo-optimized.png"
        alt="EPM Makeup"
        className="w-60 md:w-72 mb-6 mx-auto"
      />

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-800 mb-8">
        Book an Appointment
      </h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-[#fef9f1] border border-[#d9c08b] rounded-2xl p-8 shadow-xl space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Name"
            className="input-style"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            placeholder="Email"
            className="input-style"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Mobile"
            className="input-style"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            pattern="^\+?[0-9\s]*$"
            title="Please enter a valid mobile number with optional country code"
            required
         />

          <select
            className="input-style"
            value={service}
            onChange={(e) => handleServiceChange(e.target.value)}
            required
          >
            <option value=""> Select Service</option>
            <option value="Soft Glam">Soft Glam (€50)</option>
            <option value="Full Glam">Full Glam (€60)</option>
          </select>
          <input
            placeholder=" Location"
            className="input-style"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <input
            type="date"
            className="input-style"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="time"
            className="input-style"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            required
          />
        </div>

        <div className="text-sm text-gray-700">
           Early (before 9 AM) or Late (after 5 PM) adds €15
        </div>

        <div className="flex justify-between text-gray-700 font-medium">
          <span> Service Fee</span>
          <span>€{serviceFee}</span>
        </div>
        
        <div className="flex justify-between text-gray-700 font-medium">
          <span> Early/Late Fee</span>
          <span>€{earlyLateFee}</span>
        </div>
        <div className="flex justify-between text-gray-800 font-bold text-lg">
          <span> Total</span>
          <span>€{total}</span>
        </div>

        <div className="flex gap-8 text-sm">
          <label className="gold-radio">
            <input
              type="radio"
              name="payment"
              value="Deposit"
              checked={paymentType === 'Deposit'}
              onChange={() => setPaymentType('Deposit')}
            />{' '}
            Pay Deposit
          </label>
          <label className="gold-radio">
            <input
              type="radio"
              name="payment"
              value="Full"
              checked={paymentType === 'Full'}
              onChange={() => setPaymentType('Full')}
            />{' '}
            Pay in Full
          </label>
          
        </div>

        <input
         type="text"
         name="honeypot"
         className="hidden"
         autoComplete="off"
        />


        <button
          type="submit"
          className="bg-[#d4af37] hover:bg-[#c7a233] text-white font-bold py-3 px-6 rounded-xl w-full transition duration-300 shadow-md"
        >
          Book Now
        </button>
      </form>

      {/* Social + Copyright Footer */}
      <div className="mt-10 text-center text-sm text-gray-700 space-y-2">
        <div className="flex justify-center gap-6 text-2xl">
          <a
            href="https://www.instagram.com/eunicepmakeup?igsh=MTZkeThxbGF3Zmpxcw=="
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37] hover:text-[#c7a233] transition"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
          <a
            href="https://www.tiktok.com/@epmmakeup?_t=ZN-8ycye0hGno6&_r=1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37] hover:text-[#c7a233] transition"
            aria-label="TikTok"
          >
            <FaTiktok />
          </a>
        </div>
        <div>© {new Date().getFullYear()} Vic - IT. All rights reserved.</div>
      </div>
    </div>
  );
}
