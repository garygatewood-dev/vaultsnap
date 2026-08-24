import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import VaultLock from './components/VaultLock'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Vault from './pages/Vault'
import ResetPassword from './pages/ResetPassword'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <VaultLock>
                  <Vault />
                </VaultLock>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
