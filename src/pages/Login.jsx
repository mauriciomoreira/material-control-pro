import React, { useState } from 'react';
import { supabase } from '../config/supabase';
// Importando a sua logo real da pasta assets
import logoM from '../assets/logo-m.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const lidarComLogin = async (e) => {
    e.preventDefault();
    setMensagem('');
    setCarregando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      setMensagem('Sucesso! Login efetuado.');
    } catch (err) {
      setMensagem('Erro: E-mail ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        {/* CARTÃO AZUL (LOGO + FRASE INTEGRADOS) */}
        <div style={{ backgroundColor: '#0072db', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ marginBottom: '1px' }}>
            {/* Sua logo M (Certifique-se de que ela seja a versão com a letra M em branco/transparente) */}
            <img src={logoM} alt="Logo M" style={{ width: '140px', height: 'auto', display: 'block' }} />
          </div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 'bold', lineHeight: '1.4' }}>
            Controle de Saída<br />de Material
          </h2>
        </div>

        {/* CORPO DO FORMULÁRIO (ESPAÇO BRANCO) */}
        <div style={{ padding: '30px' }}>
          
          {mensagem && (
            <div style={{ padding: '12px', backgroundColor: mensagem.includes('Erro') ? '#fee2e2' : '#dcfce7', color: mensagem.includes('Erro') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
              {mensagem}
            </div>
          )}

          <form onSubmit={lidarComLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>E-mail Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@empresa.com"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '14px' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Senha</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Função de recuperação em breve!'); }} style={{ fontSize: '12px', color: '#0072db', textDecoration: 'none', fontWeight: '600' }}>
                  Esqueci minha senha
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '14px' }}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              style={{ width: '100%', marginTop: '8px', padding: '12px', backgroundColor: '#0072db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {carregando ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
              Não tem uma conta?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); alert('O cadastro de novos usuários é feito pelo administrador no painel do Supabase.'); }} style={{ color: '#0072db', textDecoration: 'none', fontWeight: '600' }}>
                Cadastrar-se
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}