import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import JobDetailPage from './pages/JobDetailPage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<HomePage />} />
          <Route path="/job/:name" element={<JobDetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
