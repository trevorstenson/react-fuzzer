import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Fuzzer } from './fuzzer/fuzzer.ts'

// set up access to window.Fuzzer
declare global {
  interface Window {
    Fuzzer: Fuzzer;
  }
}

window.Fuzzer = new Fuzzer();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
