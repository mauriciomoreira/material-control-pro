import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import NovaSolicitacao from './NovaSolicitacao';
import Portaria from './Portaria'; 
import AprovacaoGestor from './AprovacaoGestor';
import AprovacaoFacilities from './AprovacaoFacilities';

export default function Dashboard({ onLogout }) {
  /**
   * CONTROLE DE PERFIL:
   * Altere a string abaixo para testar cada uma das telas de celular limpas:
   * 'Colaborador' -> Tela de Nova Solicitação
   * 'Gestor'      -> Aprovação do Gestor do Colaborador (Sem valor estimado / sem OS)
   * 'Facilities'  -> Aprovação do Gestor de Facilities
   * 'Portaria'    -> Tela da Portaria (Apenas o que foi aprovado por Facilities)
   */
  const [funcaoUsuario, setFuncaoUsuario] = useState('Colaborador'); 
  const [solicitacoes, setSolicitacoes] = useState([]);

  // Busca geral apenas para manter sincronismo ou logs, se necessário
  const buscarDadosGerais = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('data_hora', { ascending: false });

      if (!error && data) {
        setSolicitacoes(data);
      }
    } catch (err) {
      console.error("Erro ao conectar com o Supabase:", err);
    }
  };

  useEffect(() => {
    buscarDadosGerais(); // <-- Corrigido aqui! Sem o "r" extra.
  }, [funcaoUsuario]);

  // Estilo padrão para centralizar o mockup do celular perfeitamente na tela
  const containerCelularEstilo = {
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh', 
    backgroundColor: '#f1f5f9', 
    fontFamily: 'sans-serif',
    padding: '20px'
  };

  // 1️⃣ VISÃO: COLABORADOR (SOLICITAÇÃO DE MATERIAL)
  if (funcaoUsuario === 'Colaborador') {
    return (
      <div style={containerCelularEstilo}>
        <NovaSolicitacao onLogout={onLogout} />
      </div>
    );
  }

  // 2️⃣ VISÃO: GESTOR DO COLABORADOR
  if (funcaoUsuario === 'Gestor') {
    return (
      <div style={containerCelularEstilo}>
        <AprovacaoGestor onLogout={onLogout} />
      </div>
    );
  }

  // 3️⃣ VISÃO: GESTOR DE FACILITIES
  if (funcaoUsuario === 'Facilities') {
    return (
      <div style={containerCelularEstilo}>
        <AprovacaoFacilities onLogout={onLogout} />
      </div>
    );
  }

  // 4️⃣ VISÃO: PORTARIA
  if (funcaoUsuario === 'Portaria') {
    return (
      <div style={containerCelularEstilo}>
        <Portaria onLogout={onLogout} />
      </div>
    );
  }

  // Caso não caia em nenhuma função válida, exibe uma segurança amigável
  return (
    <div style={containerCelularEstilo}>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Perfil ou função não identificada no sistema.</p>
      <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Sair
      </button>
    </div>
  );
}