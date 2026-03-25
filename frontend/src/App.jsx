import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dungeon from './pages/Dungeon/Dungeon'
import Grimoire from './pages/Grimoire/Grimoire'
import Armory from './pages/Armory/Armory'
import CharacterSelection from './pages/Auth/CharacterSelection'
import WardenIntro from './pages/Auth/WardenIntro'
import PathSelection from './pages/Auth/PathSelection'

import GrimoireStudy from './pages/Grimoire/GrimoireStudy'
import Aptitude from './pages/Aptitude/Aptitude'
import Shop from './pages/Shop/Shop'
import Pricing from './pages/Pricing/Pricing'
import PaymentResult from './pages/Pricing/PaymentResult'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/warden-intro" element={<WardenIntro />} />
        <Route path="/character-selection" element={<CharacterSelection />} />
        <Route path="/path-selection" element={<PathSelection />} />
        <Route path="/dungeon" element={<Dungeon />} />
        <Route path="/grimoire" element={<Grimoire />} />
        <Route path="/grimoire/:id/study" element={<GrimoireStudy />} />
        <Route path="/armory" element={<Armory />} />
        <Route path="/aptitude" element={<Aptitude />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
