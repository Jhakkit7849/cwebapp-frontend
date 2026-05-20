import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import ResetRequest from "./pages/ResetRequest.jsx";
import ResetConfirm from "./pages/ResetConfirm.jsx";

import Lessons from "./pages/Lessons.jsx";
import LessonDetail from "./pages/LessonDetail.jsx";
import Quizzes from "./pages/Quizzes.jsx";
import QuizDetail from "./pages/QuizDetail.jsx";
import QuizResult from "./pages/QuizResult.jsx";
import Challenges from "./pages/Challenges.jsx";
import ChallengeDetail from "./pages/ChallengeDetail.jsx";
import Community from "./pages/Community.jsx";
import Compiler from "./pages/Compiler.jsx";
import Rankings from "./pages/Rankings.jsx";
import Profile from "./pages/Profile.jsx";

import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminLessons from "./pages/admin/AdminLessons.jsx";
import AdminQuizzes from "./pages/admin/AdminQuizzes.jsx";
import AdminChallenges from "./pages/admin/AdminChallenges.jsx";
import AdminComments from "./pages/admin/AdminComments.jsx";
import AdminBoard from "./pages/admin/AdminBoard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminLogs from "./pages/admin/AdminLogs.jsx";

import { RequireAuth, RequireAdmin, RequireGuest } from "./components/Protected.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="" element={<Home />} />

          {/* guest-only */}
          <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
          <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
          <Route path="/verify-otp" element={<RequireGuest><VerifyOtp /></RequireGuest>} />
          <Route path="/reset" element={<RequireGuest><ResetRequest /></RequireGuest>} />
          <Route path="/reset/confirm" element={<RequireGuest><ResetConfirm /></RequireGuest>} />

          {/* public content */}
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:slug" element={<LessonDetail />} />
          {/*<Route path="/quizzes" element={<Quizzes />} />*/}
          <Route path="/quizzes/:id" element={<QuizDetail />} />
          <Route path="/quizzes/:id/result" element={<QuizResult />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/sandbox" element={<Compiler />} />
          <Route path="/rankings" element={<Rankings />} />

          {/* auth-only */}
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

          {/* admin-only */}
          <Route path="/admin" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
          <Route path="/admin/lessons" element={<RequireAdmin><AdminLessons /></RequireAdmin>} />
          <Route path="/admin/quizzes" element={<RequireAdmin><AdminQuizzes /></RequireAdmin>} />
          <Route path="/admin/challenges" element={<RequireAdmin><AdminChallenges /></RequireAdmin>} />
          <Route path="/admin/comments" element={<RequireAdmin><AdminComments /></RequireAdmin>} />
          <Route path="/admin/board" element={<RequireAdmin><AdminBoard /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="/admin/audit-logs" element={<RequireAdmin><AdminLogs /></RequireAdmin>} />
          {/* fallback */}
          <Route
            path="*"
            element={
              <div>
                <h2>Not Found</h2>
                <Link to="/">กลับหน้าแรก</Link>
              </div>
            }
          />
        </Routes>
        <footer className="text-center">© C WebApp</footer>
      </div>
    </>
  );
}
