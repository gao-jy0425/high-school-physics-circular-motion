import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PhETHomePage from "@/pages/PhETHomePage";
import SimulationPage from "@/pages/SimulationPage";
import QuizPage from "@/pages/QuizPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PhETHomePage />} />
        <Route path="/phet" element={<PhETHomePage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </Router>
  );
}
