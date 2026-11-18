import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomCursor from './components/Layout/Cursor';
import PortfolioLayout from './components/Layout/PortfolioLayout';

function App() {
  return (
    <BrowserRouter>
      <main className="relative w-full min-h-screen bg-bg text-ink">
        <CustomCursor />
        <Routes>
          <Route path="/" element={<PortfolioLayout />} />
          <Route path="/projects" element={<PortfolioLayout />} />
          <Route path="/projects/:projectId" element={<PortfolioLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
