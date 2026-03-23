import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dungeon from './pages/Dungeon/Dungeon'
import Grimoire from './pages/Grimoire/Grimoire'
import Armory from './pages/Armory/Armory'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dungeon" element={<Dungeon />} />
        <Route path="/grimoire" element={<Grimoire />} />
        <Route path="/armory" element={<Armory />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
