import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DirectorLogin from './pages/DirectorLogin'
import TeamLeaderLogin from './pages/TeamLeaderLogin'
import TeamLeaderDashboard from './pages/TeamLeaderDashboard'
import DirectorDashboard from './pages/DirectorDashboard'
import Leaderboard from './pages/Leaderboard'
import MonthlyPerformance from './pages/MonthlyPerformance'
import ManageTasks from './pages/ManageTasks'
import DataCleanup from './pages/DataCleanup'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/director-login" element={<DirectorLogin />} />
      <Route path="/team-leader-login" element={<TeamLeaderLogin />} />
      <Route path="/team-leader-dashboard" element={<TeamLeaderDashboard />} />
      <Route path="/director-dashboard" element={<DirectorDashboard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/monthly-performance" element={<MonthlyPerformance />} />
      <Route path="/manage-tasks" element={<ManageTasks />} />
      <Route path="/data-cleanup" element={<DataCleanup />} />
    </Routes>
  )
}

export default App