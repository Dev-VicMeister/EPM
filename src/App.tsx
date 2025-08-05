import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Booking from './pages/Booking';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Booking />} />
      </Routes>
    </Router>
  );
}
