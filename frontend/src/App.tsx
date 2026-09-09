import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import HeroSlides from './pages/HeroSlides'
import SchoolProfile from './pages/SchoolProfile'
import SchoolFacilities from './pages/SchoolFacilities'
import Extracurriculars from './pages/Extracurriculars'
import SchoolActivities from './pages/SchoolActivities'
import SchoolAchievements from './pages/SchoolAchievements'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import SchoolPrograms from './pages/SchoolPrograms'
import Users from './pages/Users'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/artikel/:slug" element={<ArticleDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="hero-slides" element={<HeroSlides />} />
        <Route path="school-profile" element={<SchoolProfile />} />
        <Route path="school-facilities" element={<SchoolFacilities />} />
        <Route path="extracurriculars" element={<Extracurriculars />} />
        <Route path="school-activities" element={<SchoolActivities />} />
        <Route path="school-achievements" element={<SchoolAchievements />} />
        <Route path="articles" element={<Articles />} />
        <Route path="school-programs" element={<SchoolPrograms />} />
        <Route path="users" element={<Users />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
