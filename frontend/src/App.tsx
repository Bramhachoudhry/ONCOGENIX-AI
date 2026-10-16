/**
 * ONCOGENIX AI - Main React Application Router
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DnaAnalysisPage from './pages/DnaAnalysisPage';
import MutationResultsPage from './pages/MutationResultsPage';
import PatientComparisonPage from './pages/PatientComparisonPage';
import PatientReportPage from './pages/PatientReportPage';
import AnalysisHistoryPage from './pages/AnalysisHistoryPage';
import AboutMethodologyPage from './pages/AboutMethodologyPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-dark-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutMethodologyPage />} />

            {/* Protected clinical routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis"
              element={
                <ProtectedRoute>
                  <DnaAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:id"
              element={
                <ProtectedRoute>
                  <MutationResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comparison"
              element={
                <ProtectedRoute>
                  <PatientComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:id"
              element={
                <ProtectedRoute>
                  <PatientReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AnalysisHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
