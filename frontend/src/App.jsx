import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL

  useEffect(() => {
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiUrl])

  return (
    <div className="container">
      <header>
        <h1>Questly</h1>
        <p className="subtitle">Hello World from React!</p>
      </header>

      <main>
        <div className="status-card">
          <h2>Backend Status Check</h2>
          {loading && <p className="loading">Checking backend...</p>}
          {error && <p className="error">❌ Error: {error}</p>}
          {data && (
            <div className="success">
              <p>✅ Backend is <strong>{data.status}</strong></p>
              <p className="small">Message: {data.message}</p>
            </div>
          )}
          <p className="small url">API URL: {apiUrl}</p>
        </div>

        <div className="info-section">
          <h3>How to Deploy Update:</h3>
          <code>git add .</code><br/>
          <code>git commit -m "Test deploy"</code><br/>
          <code>git push origin main</code>
        </div>
      </main>

      <footer>
        <p>&copy; 2026 Questly Team</p>
      </footer>
    </div>
  )
}

export default App
