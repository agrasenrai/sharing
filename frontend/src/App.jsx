import React from 'react'
import Gallery from './pages/Gallery'
import Upload from './pages/Upload'

export default function App(){
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: '#FAFAF8',
      minHeight: '100vh',
      padding: isMobile ? '30px 16px' : '50px 20px'
    }}>
      <div style={{maxWidth: 1000, margin: '0 auto'}}>
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: isMobile ? 35 : 50}}>
          <h1 style={{
            fontSize: isMobile ? 28 : 42,
            fontWeight: 600,
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
            color: '#2D2D2D'
          }}>
            SharingSpace
          </h1>
          <p style={{
            fontSize: isMobile ? 13 : 15,
            margin: 0,
            color: '#777',
            fontWeight: 400
          }}>
            Share moments with ease, elegance, and simplicity.
          </p>
        </div>

        {/* Main Content */}
        <div style={{background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #E8E6E1'}}>
          <Upload />
          <div style={{borderTop: '1px solid #E8E6E1'}} />
          <Gallery />
        </div>
      </div>
    </div>
  )
}
