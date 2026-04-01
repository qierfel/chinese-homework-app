import { useState } from 'react'
import Home from './pages/Home'
import CharacterDetail from './pages/CharacterDetail'
import './App.css'

function App() {
  const [currentChar, setCurrentChar] = useState(null)

  return (
    <div className="app">
      {currentChar === null ? (
        <Home onSelect={setCurrentChar} />
      ) : (
        <CharacterDetail char={currentChar} onBack={() => setCurrentChar(null)} />
      )}
    </div>
  )
}

export default App
