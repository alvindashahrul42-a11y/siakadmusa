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
import PpdbRegister from './pages/PpdbRegister'
import PpdbRegistrations from './pages/PpdbRegistrations'
import PpdbForm from './pages/PpdbForm'
import AcademicYears from './pages/AcademicYears'
import Majors from './pages/Majors'
import Classes from './pages/Classes'
import ClassStudents from './pages/ClassStudents'
import Subjects from './pages/Subjects'
import ClassSubjects from './pages/ClassSubjects'
import ClassSchedules from './pages/ClassSchedules'
import Grades from './pages/Grades'
import Attendance from './pages/Attendance'
import GradesOverview from './pages/GradesOverview'
import AttendanceOverview from './pages/AttendanceOverview'
import Schedules from './pages/Schedules'
import ExamTypes from './pages/ExamTypes'
import Exams from './pages/Exams'
import ExamSchedules from './pages/ExamSchedules'
import QuestionSets from './pages/QuestionSets'
import QuestionEditor from './pages/QuestionEditor'
import ExamTaking from './pages/ExamTaking'
import ExamResults from './pages/ExamResults'
import MyExams from './pages/MyExams'
import ActivityLogs from './pages/ActivityLogs'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/artikel/:slug" element={<ArticleDetail />} />
      <Route path="/ppdb" element={<PpdbRegister />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <DashboardLayout />
            </ErrorBoundary>
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
        <Route path="ppdb" element={<PpdbRegistrations />} />
        <Route path="ppdb-form" element={<PpdbForm />} />
        <Route path="academic-years" element={<AcademicYears />} />
        <Route path="majors" element={<Majors />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:classId/students" element={<ClassStudents />} />
        <Route path="classes/:classId/subjects" element={<ClassSubjects />} />
        <Route path="classes/:classId/subjects/:classSubjectId/schedules" element={<ClassSchedules />} />
        <Route path="classes/:classId/subjects/:classSubjectId/grades" element={<Grades />} />
        <Route path="classes/:classId/subjects/:classSubjectId/attendance" element={<Attendance />} />
        <Route path="classes/:classId/schedules" element={<ClassSchedules />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="grades-overview" element={<GradesOverview />} />
        <Route path="attendance-overview" element={<AttendanceOverview />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="exam-types" element={<ExamTypes />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/:examId/schedules" element={<ExamSchedules />} />
        <Route path="exams/:scheduleId/results" element={<ExamResults />} />
        <Route path="question-sets" element={<QuestionSets />} />
        <Route path="question-sets/:questionSetId/questions" element={<QuestionEditor />} />
        <Route path="exam-taking/:scheduleId" element={<ExamTaking />} />
        <Route path="my-exams" element={<MyExams />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
