import React from 'react';
import Aprovacoes from './Aprovacoes'; // Ou o caminho correto para o seu arquivo de aprovações

export default function AprovacaoGestor() {
  // 🌟 Captura o e-mail do gestor logado no localStorage
  const gestorEmail = localStorage.getItem('gestor_email') || '';

  // Determina o setor de forma dinâmica baseado no e-mail digitado
  const obterSetor = () => {
    if (gestorEmail.includes('smd')) return 'SMD';
    if (gestorEmail.includes('facilities')) return 'Facilities';
    return 'SESMT';
  };

  const setorExibido = obterSetor();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* CABEÇALHO PRINCIPAL DO CONTAINER */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '20px 40px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '700' }}>
          Painel de Aprovação de Área
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#64748b' }}>
          Bem-vindo, <strong style={{ color: '#334155' }}>Gestor</strong> | Setor:{' '}
          <span style={{ backgroundColor: '#0072db', color: 'white', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', marginLeft: '4px' }}>
            {setorExibido}
          </span>
        </p>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (ONDE FICA O GRID) */}
      <div style={{ padding: '40px' }}>
        <Aprovacoes />
      </div>

    </div>
  );
}