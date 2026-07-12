import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AprovacaoGestor from './pages/AprovacaoGestor'; // 🌟 Importando a tela do gestor

function App() {
  const [sessao, setSessao] = useState(null);
  const [isGestor, setIsGestor] = useState(false);

  // Função para verificar se quem está logado é um gestor no localStorage
  const verificarGestor = () => {
    const role = localStorage.getItem('user_role');
    setIsGestor(role === 'gestor');
  };

  useEffect(() => {
    // Verifica se já existe um gestor logado localmente
    verificarGestor();

    // Verifica se já existe um usuário conectado no Supabase ao abrir o sistema
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
    });

    // Escuta mudanças de login/logout em tempo real do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    // Escuta eventos customizados de login de gestor dentro do próprio app
    window.addEventListener('gestorLoginChange', verificarGestor);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('gestorLoginChange', verificarGestor);
    };
  }, []);

  // Função para deslogar do sistema (serve para Colaborador e Gestor)
  const lidarComLogout = async () => {
    await supabase.auth.signOut(); // Limpa Supabase se houver
    localStorage.clear(); // Limpa os dados do gestor salvos
    setIsGestor(false);
    setSessao(null);
  };

  // 🔀 LÓGICA DE ROTEAMENTO:
  // 1. Se for Gestor -> Vai para a tela de aprovação dele
  // 2. Se for Colaborador (sessao ativa) -> Vai para o Dashboard
  // 3. Se não for nenhum -> Tela de Login
  return (
    <div>
      {isGestor ? (
        <div style={{ position: 'relative' }}>
          {/* Botão flutuante de Logout para o Gestor poder sair do painel */}
          <button 
            onClick={lidarComLogout}
            style={{
              position: 'fixed', top: '20px', right: '20px', zIndex: 1100,
              backgroundColor: '#ef4444', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Sair do Sistema
          </button>
          <AprovacaoGestor />
        </div>
      ) : sessao ? (
        <Dashboard onLogout={lidarComLogout} />
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;