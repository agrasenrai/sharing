import React, {useEffect, useState} from 'react'

export default function Gallery(){
  const [items, setItems] = useState([])
  const [folder, setFolder] = useState('my-uploads')
  const [hoveredId, setHoveredId] = useState(null)

  // Load folder from localStorage on mount
  useEffect(()=>{
    const saved = localStorage.getItem('ss-folder')
    if (saved) setFolder(saved)
  }, [])

  useEffect(()=>{
    function load(folder){
      const q = folder ? `?folder=${encodeURIComponent(folder)}` : ''
      fetch('/cloud/list'+q)
        .then(r=>r.json())
        .then(data => {
          if (Array.isArray(data)) return setItems(data)
          if (data && Array.isArray(data.resources)) return setItems(data.resources)
          return setItems([])
        })
        .catch(()=>setItems([]))
    }
    load(folder)
    const onRefresh = ()=> load(folder)
    window.addEventListener('ss:refresh-gallery', onRefresh)
    return () => { window.removeEventListener('ss:refresh-gallery', onRefresh) }
  },[folder])

  const handleDelete = async (publicId) => {
    if (!confirm('Delete this file? This action cannot be undone.')) return
    try {
      const q = folder ? `?folder=${encodeURIComponent(folder)}` : ''
      const res = await fetch('/cloud/delete/'+encodeURIComponent(publicId)+q, { method: 'DELETE' })
      const j = await res.json()
      if (j && j.ok) {
        window.dispatchEvent(new Event('ss:refresh-gallery'))
      } else {
        alert('Delete failed: '+(j && j.error ? j.error : JSON.stringify(j)))
      }
    } catch (e) { 
      alert('Delete error: '+e.message)
    }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  return (
    <div style={{padding: isMobile ? '24px 16px' : '45px 40px'}}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: 24,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 8 : 0
      }}>
        <h2 style={{
          fontSize: isMobile ? 18 : 22,
          fontWeight: 600,
          margin: 0,
          color: '#2D2D2D',
          letterSpacing: '-0.3px'
        }}>
          Your Gallery
        </h2>
        {items.length > 0 && (
          <div style={{
            fontSize: isMobile ? 12 : 13,
            color: '#999',
            fontWeight: 500
          }}>
            {items.length} file{items.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Folder Input */}
      <div style={{marginBottom: 24}}>
        <label style={{
          display: 'block',
          fontSize: isMobile ? 11 : 12,
          fontWeight: 600,
          color: '#777',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8
        }}>
          Folder
        </label>
        <input 
          type="text"
          placeholder="e.g., my-uploads"
          value={folder}
          onChange={e=>setFolder(e.target.value)}
          style={{
            padding: isMobile ? '10px 12px' : '11px 14px',
            fontSize: isMobile ? 13 : 14,
            border: '1px solid #E8E6E1',
            borderRadius: 8,
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '100%' : 300,
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            outline: 'none',
            background: '#FAFAF8',
            boxSizing: 'border-box'
          }}
          onFocus={e => {e.target.style.borderColor = '#F0D9E8'; e.target.style.background = 'white'}}
          onBlur={e => {e.target.style.borderColor = '#E8E6E1'; e.target.style.background = '#FAFAF8'}}
        />
      </div>

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '50px 20px' : '70px 20px',
          color: '#BBB'
        }}>
          <div style={{fontSize: isMobile ? 36 : 48, marginBottom: 12}}>📭</div>
          <p style={{
            fontSize: isMobile ? 14 : 16,
            margin: 0,
            color: '#999'
          }}>
            No files in this folder yet
          </p>
          <p style={{
            fontSize: isMobile ? 12 : 13,
            color: '#CCC',
            margin: '8px 0 0 0'
          }}>
            Upload your first file to get started
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: isMobile ? 16 : 24
        }}>
          {items.map((m, idx)=> (
            <div 
              key={m.public_id || idx}
              onMouseEnter={() => setHoveredId(m.public_id || idx)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: 'white',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #E8E6E1',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: hoveredId === (m.public_id || idx) ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                transform: hoveredId === (m.public_id || idx) ? 'translateY(-3px)' : 'translateY(0)'
              }}
            >
              {/* Image */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#F8F7F4',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <a href={m.secure_url} target="_blank" rel="noreferrer" style={{width: '100%', height: '100%'}}>
                  <img 
                    src={m.secure_url}
                    alt={m.original_filename || m.public_id}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                </a>
              </div>

              {/* Info */}
              <div style={{padding: isMobile ? 10 : 14}}>
                <div style={{
                  fontSize: isMobile ? 10 : 11,
                  color: '#999',
                  marginBottom: 10,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  title: m.original_filename || m.public_id,
                  fontWeight: 500
                }}>
                  {m.original_filename || m.public_id}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: isMobile ? 6 : 8
                }}>
                  <a 
                    href={`/cloud/download/${encodeURIComponent(m.public_id)}`}
                    style={{
                      flex: 1,
                      padding: isMobile ? '6px 8px' : '8px 12px',
                      fontSize: isMobile ? 10 : 12,
                      fontWeight: 600,
                      background: '#D9F0E8',
                      color: '#2D2D2D',
                      border: 'none',
                      borderRadius: 6,
                      textAlign: 'center',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-block',
                      minHeight: isMobile ? 28 : 'auto'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = '#CAE5DD'
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = '#D9F0E8'
                    }}
                  >
                    ⬇️ Download
                  </a>
                  <button 
                    onClick={() => handleDelete(m.public_id)}
                    style={{
                      flex: 1,
                      padding: isMobile ? '6px 8px' : '8px 12px',
                      fontSize: isMobile ? 10 : 12,
                      fontWeight: 600,
                      background: '#F0D9E8',
                      color: '#2D2D2D',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: isMobile ? 28 : 'auto'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = '#E8CDE0'
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = '#F0D9E8'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
