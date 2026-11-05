import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Corrida {
  id: string;
  status: string;
  origem: string;
  destino: string
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') ?? '');
  const [origem, setOrigem] = useState('Centro');
  const [destino, setDestino] = useState('Barra');
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [seguindo, setSeguindo] = useState('');
  const [statusAoVivo, setStatusAoVivo] = useState('');
  const [idAlvo, setIdAlvo] = useState('');
  const [msg, setMsg] = useState('');

  const headers = {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'};

  async function carregar() {
    const r = await fetch(`${API}/corridas`, { headers });
    if (r.ok) {
      setCorridas(await r.json());
    } else {
      setMsg(`GET /corridas: ${r.status}`);
    }
  };

  async function solicitar() {
    const r = await fetch(`${API}/corridas`, { 
      method: 'POST', 
      headers: {...headers, 'Idempotency-Key': crypto.randomUUID()}, 
      body: JSON.stringify({ origem, destino }) 
    });

    setMsg(`POST /corridas: ${r.status}`);
    carregar();
  };

  async function alterar(status: string) {
    const r = await fetch(`${API}/corridas/${idAlvo}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    });
    setMsg(`PATCH ${status} => ${r.status}`);
  };

  // Lista do passageiro atualizada a cada 5s
  useEffect(() => {
    localStorage.setItem('token', token);
    if(!token) return;
    carregar();
    const t = setInterval(() => carregar(), 5000);
    return () => clearInterval(t);
  }, [token]);

  // Acompanhar uma corrida pelo GET /corridas/:id
  useEffect(() => {
    if(!seguindo) return;
    const t = setInterval(async () => {
      const r = await fetch(`${API}/corridas/${seguindo}`, { headers });
      if (r.ok) {
        setStatusAoVivo((await r.json()).status);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [seguindo, token]);

  return <div style={{maxWidth: 840, margin: '2rem auto', fontFamily: 'sans-serif'}}>
    <h1>Corridas</h1>
    <textarea placeholder="Cole aqui o token JWT" value={token} onChange={(e) => setToken(e.target.value)} rows={3} style={{width: '100%'}}/>
    <p>{msg}</p>

    <h2>Passageiro: Criar corrida</h2>
    <input type="text" placeholder="Origem" value={origem} onChange={(e) => setOrigem(e.target.value)} style={{width: '100%'}}/>
    <input type="text" placeholder="Destino" value={destino} onChange={(e) => setDestino(e.target.value)} style={{width: '100%'}}/>
    <button onClick={solicitar}>Criar</button>

    <ul>
      {corridas.map((c) => (
        <li key={c.id}>
          {c.origem} para {c.destino}: <b>{c.status}</b> <small>({c.id})</small> {' '}
          <button onClick={() => setSeguindo(c.id)}>Acompanhar</button>
        </li>
      ))}
    </ul>
    {seguindo && <p>Acompanhando {seguindo}: <b>{statusAoVivo || '...'}</b></p>}

    <h2>Motorista: Alterar status</h2>
    <input value={idAlvo} onChange={(e) => setIdAlvo(e.target.value)} placeholder="ID da corrida" style={{width: '100%'}}/>
    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginTop: '1rem'}}>
      <button onClick={() => alterar('ACEITA')}>Aceitar</button>
      <button onClick={() => alterar('EM_ANDAMENTO')}>Iniciar</button>
      <button onClick={() => alterar("FINALIZADA")}>Finalizar</button>
    </div>
  </div>;
}