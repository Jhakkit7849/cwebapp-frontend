import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { oneDark } from '@codemirror/theme-one-dark'
import { api } from '../utils/api.js'
import useAuth from '../state/AuthContext.jsx'

export default function Compiler(){
  const { user } = useAuth()
  const [code, setCode] = useState(`#include <stdio.h>\nint main(){ return 0; }`)
  const [input, setInput] = useState('2 3\n')
  const [out, setOut] = useState(null)
  const [err, setErr] = useState('')
  const [running, setRunning] = useState(false)

  const run = async ()=>{
    if (!user) { setErr('ต้องเข้าสู่ระบบก่อน'); return }
    try{
      setRunning(true); setErr(''); setOut(null)
      const r = await api('/sandbox/run', { method: 'POST', body: { code, input } })
      setOut(r)
    }catch(e){ setErr(e.message) } finally { setRunning(false) }
  }

  return (
    <div className="grid">
      <h2>Online C Compiler (Sandbox)</h2>
      {err && <div className="warning">{err}</div>}

      <div className="card">
        <label className="mb-1">Source code (C)</label>
        <CodeMirror
          value={code}
          height="360px"
          extensions={[cpp()]}
          theme={oneDark}
          basicSetup={{ lineNumbers: true }}
          onChange={(v)=>setCode(v)}
        />
      </div>

      <div className="codearea card">
        <label className="mb-1" >Input (stdin)</label>
        <textarea className="input" rows={6} value={input} style={{ resize: "vertical" , whiteSpace: "pre-wrap" }} onChange={e=>setInput(e.target.value) } />
        <button className="btn primary mt-2" onClick={run} disabled={!user || running}>
          {running ? 'กำลังรัน…' : 'Run'}
        </button>
        {!user && <div className="warning mt-2">ต้องเข้าสู่ระบบก่อน</div>}
      </div>

      {out && (
        <div className="card">
          <h3>Result</h3>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            <div>
              <b>STDOUT</b>
              <pre style={{whiteSpace:'pre-wrap'}}>{out.stdout || ''}</pre>
            </div>
            <div>
              <b>STDERR</b>
              <pre className="warning" style={{whiteSpace:'pre-wrap'}}>{out.stderr || ''}</pre>
            </div>
          </div>
          <div className="mt-1 muted">exitCode: {out.exitCode}{out.compileError ? ' (compile error)' : ''}</div>
        </div>
      )}
    </div>
  )
}
