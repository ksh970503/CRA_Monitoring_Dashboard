import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WorkLogPage } from './pages/WorkLog';
import { TrainingPage } from './pages/Training';
import { StudiesPage } from './pages/Studies';
import { StudyDetailPage } from './pages/StudyDetailPage';
import { IssuesPage } from './pages/Issues';

// Auth Guard component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, guestUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user && !guestUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// DataProvider를 AuthContext 하위에서 사용하기 위한 래퍼
// userId가 바뀌면(로그인/로그아웃/계정 전환) DataProvider가 해당 유저의 데이터를 로드합니다.
const AppWithData: React.FC = () => {
  const { user, guestUser } = useAuth();

  return (
    <DataProvider userId={user?.id ?? null} isGuest={guestUser}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/worklog" element={<WorkLogPage />} />
                  <Route path="/training" element={<Navigate to="/trainings" replace />} />
                  <Route path="/trainings" element={<TrainingPage />} />
                  <Route path="/studies" element={<StudiesPage />} />
                  <Route path="/studies/:id" element={<StudyDetailPage />} />
                  <Route path="/issues" element={<IssuesPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </DataProvider>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWithData />
      </AuthProvider>
    </Router>
  );
}

export default App;
