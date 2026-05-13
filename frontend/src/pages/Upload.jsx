import React, {useState, useEffect, useRef} from 'react'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [folderName, setFolderName] = useState('my-uploads')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('ss-folder')
    if (saved) setFolderName(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('ss-folder', folderName)
  }, [folderName])

  function handleChange(e) {
    const files = e.target.files
    if (files.length > 0) {
      if (files.length === 1) {
        setFile(files[0])
      } else {
        setFile(Array.from(files))
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      if (files.length === 1) {
        setFile(files[0])
      } else {
        setFile(Array.from(files))
      }
    }
  }

  async function upload() {
    if (!file) return
    const filesToUpload = Array.isArray(file) ? file : [file]
    
    try {
      setStatus(`uploading ${filesToUpload.length} file${filesToUpload.length > 1 ? 's' : ''}...`)
      let successCount = 0
      
      for (const f of filesToUpload) {
        try {
          const sigRes = await fetch('/cloud/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: f.name, folder: folderName })
          })
          const sigJson = await sigRes.json()
          if (sigJson.error) {
            console.error('sign error:', sigJson.error)
            continue
          }
          const { signature, timestamp, api_key, cloud_name } = sigJson

          const fd = new FormData()
          fd.append('file', f)
          fd.append('api_key', api_key)
          fd.append('timestamp', timestamp)
          fd.append('signature', signature)
          if (folderName) fd.append('folder', folderName)

          const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, {
            method: 'POST',
            body: fd
          })
          const cloudJson = await cloudRes.json()
          if (cloudJson.error) {
            console.error('upload error:', cloudJson.error)
            continue
          }
          successCount++
        } catch (err) {
          console.error('error:', err)
        }
      }

      setStatus(`✓ uploaded ${successCount}/${filesToUpload.length}`)
      setFile(null)
      setTimeout(() => setStatus(''), 3000)
      window.dispatchEvent(new Event('ss:refresh-gallery'))
    } catch (err) {
      setStatus('error: ' + err.message)
    }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  return (
    <div style={{padding: isMobile ? '24px 16px' : '45px 40px'}}>
      <h2 style={{fontSize: isMobile ? 18 : 22, fontWeight: 600, margin: '0 0 24px 0', color: '#2D2D2D'}}>Upload Files</h2>

      <div style={{marginBottom: 24}}>
        <label style={{display: 'block', fontSize: isMobile ? 11 : 12, fontWeight: 600, color: '#777', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5}}>Organization Folder</label>
        <input type="text" placeholder="e.g., my-uploads" value={folderName} onChange={e => setFolderName(e.target.value)} style={{width: '100%', padding: isMobile ? '10px 12px' : '11px 14px', fontSize: isMobile ? 13 : 14, border: '1px solid #E8E6E1', borderRadius: 8, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', background: '#FAFAF8'}} onFocus={e => {e.target.style.borderColor = '#D9E8F0'; e.target.style.background = 'white'}} onBlur={e => {e.target.style.borderColor = '#E8E6E1'; e.target.style.background = '#FAFAF8'}} />
      </div>

      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{border: isDragging ? '2px solid #D9E8F0' : '2px dashed #E8E6E1', borderRadius: 12, padding: isMobile ? 30 : 50, textAlign: 'center', background: isDragging ? '#F0F8FB' : '#FAFAF8', cursor: 'pointer', marginBottom: 20}}>
        <div onClick={() => fileInputRef.current?.click()} style={{fontSize: isMobile ? 36 : 48, marginBottom: 12, cursor: 'pointer', display: 'inline-block'}} onMouseEnter={e => e.target.style.transform = 'scale(1.1)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
          {file ? '✓' : '📁'}
        </div>
        <label style={{cursor: 'pointer', display: 'block'}}>
          <input ref={fileInputRef} type="file" onChange={handleChange} style={{display: 'none'}} />
          <div style={{fontSize: isMobile ? 14 : 16, fontWeight: 500, color: '#2D2D2D', marginBottom: 6}}>
            {Array.isArray(file) ? `${file.length} files selected` : file ? file.name : 'Click icon or drag files'}
          </div>
          <div style={{fontSize: isMobile ? 12 : 13, color: '#999'}}>Single or multiple files</div>
        </label>
        <button onClick={() => folderInputRef.current?.click()} style={{marginTop: 16, padding: '8px 16px', fontSize: isMobile ? 11 : 12, fontWeight: 500, background: '#F0D9E8', color: '#2D2D2D', border: 'none', borderRadius: 6, cursor: 'pointer'}} onMouseEnter={e => e.target.style.background = '#E8CDE0'} onMouseLeave={e => e.target.style.background = '#F0D9E8'}>📂 Upload Folder</button>
        <input ref={folderInputRef} type="file" multiple webkitdirectory="true" onChange={handleChange} style={{display: 'none'}} />
      </div>

      <div style={{display: 'flex', gap: isMobile ? 12 : 16, alignItems: 'center', flexWrap: 'wrap'}}>
        <button onClick={upload} disabled={!file} style={{padding: isMobile ? '12px 20px' : '11px 28px', fontSize: isMobile ? 13 : 14, fontWeight: 600, background: file ? '#D9E8F0' : '#E8E6E1', color: file ? '#2D2D2D' : '#999', border: 'none', borderRadius: 8, cursor: file ? 'pointer' : 'not-allowed', minHeight: isMobile ? 44 : 'auto'}} onMouseEnter={e => {if (file) e.target.style.background = '#C9DBEA'}} onMouseLeave={e => {if (file) e.target.style.background = '#D9E8F0'}}>Upload File</button>
        {status && <div style={{fontSize: 13, color: status.includes('error') ? '#DC143C' : '#4CAF50', fontWeight: 500}}>{status}</div>}
      </div>
    </div>
  )
}
