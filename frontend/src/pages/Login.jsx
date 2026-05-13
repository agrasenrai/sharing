import React, {useState} from 'react'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('')

  async function submit(e){
    e.preventDefault();
    const url = mode === 'login' ? '/auth/login' : '/auth/signup';
    setStatus('working...')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password, name })
      });
      const j = await res.json();
      if (j.error) return setStatus('error: '+j.error);
      localStorage.setItem('ss_token', j.token);
      localStorage.setItem('ss_user', JSON.stringify(j.user));
      setStatus('ok');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  return (
    <div style={{marginBottom:20}}>
      <h2>{mode === 'login' ? 'Login' : 'Sign up'}</h2>
      <form onSubmit={submit}>
        {mode === 'signup' && (
          <div>
            <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          </div>
        )}
        <div>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <div style={{marginTop:8}}>
          <button type="submit">{mode === 'login' ? 'Login' : 'Sign up'}</button>
          <button type="button" onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')} style={{marginLeft:8}}>{mode === 'login' ? 'Create account' : 'Have account? Login'}</button>
        </div>
      </form>
      <div>{status}</div>
    </div>
  )
}
