import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@features/auth/context/AuthProvider'
import AppRouter from './AppRouter'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
