import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [sessao, setSessao] = useState(null);

  useEffect(() => {
    // Verifica se já existe um usuário conectado ao abrir o sistema
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
    });

    // Escuta mudanças de login/logout em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função para deslogar do sistema
  const lidarComLogout = async () => {
    await supabase.auth.signOut();
  };

  // Se o usuário estiver logado, mostra o Dashboard. Se não, mostra o Login.
  return (
    <div>
      {sessao ? (
        <Dashboard onLogout={lidarComLogout} />
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;