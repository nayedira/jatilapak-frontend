import { Routes, Route } from 'react-router-dom'
import SplashPage from './pages/SplashPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import RequireAuth from './components/RequireAuth'
import CatalogPage from './pages/CatalogPage'
import SearchPage from './pages/SearchPage'
import SearchResultsPage from './pages/SearchResultsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import MessagesPage from './pages/MessagesPage'
import ChatRoomPage from './pages/ChatRoomPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/katalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
      <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
      <Route path="/search/results" element={<RequireAuth><SearchResultsPage /></RequireAuth>} />
      <Route path="/produk/:id" element={<RequireAuth><ProductDetailPage /></RequireAuth>} />
      <Route path="/pesan" element={<RequireAuth><MessagesPage /></RequireAuth>} />
      <Route path="/chat/:roomId" element={<RequireAuth><ChatRoomPage /></RequireAuth>} />
    </Routes>
  )
}