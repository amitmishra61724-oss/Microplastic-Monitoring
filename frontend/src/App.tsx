import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ImageAnalysis } from './pages/ImageAnalysis';
import { Samples } from './pages/Samples';
import { AnalysisHistory } from './pages/AnalysisHistory';
import { About } from './pages/About';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analysis" element={<ImageAnalysis />} />
          <Route path="samples" element={<Samples />} />
          <Route path="history" element={<AnalysisHistory />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
