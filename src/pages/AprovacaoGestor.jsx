import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function AprovacaoGestor() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(null);

  // Pega os dados do gestor que foram salvos no Login
  const gestorSetor = localStorage.getItem('user_sector') || 'SESMT'; // SESMT como padrão caso não ache
  const gestorNome = localStorage.getItem('user_name') || 'Gestor';

  // Função para buscar as solicitações pendentes deste setor específico
  const buscarSolicitacoes = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('gestor_area', gestorSetor)
        .eq('status', 'Aguardando_Gestor')
        .order('id', { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarSolicitacoes();

    // 🌟 LOGÍSTICA REALTIME: Escuta se novas notificações entram para este setor
    const canalRealtime = supabase
      .channel('notificacoes-gestores')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload) => {
          // Se a notificação for para o setor desse gestor, avisa na tela!
          if (payload.new.para_setor === gestorSetor) {
            setNotificacaoAtiva(payload.new.mensagem);
            buscarSolicitacoes(); // Atualiza a lista na tela na hora!
            
            // Auto-oculta o alerta flutuante após 6 segundos
            setTimeout(() => setNotificacaoAtiva(null), 6000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [gestorSetor]);

  // Função para Aprovar ou Reprovar a Saída
  const gerenciarStatus = async (id, novoStatus) => {
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      // Remove da lista da tela localmente para ficar rápido
      setSolicitacoes(prev => prev.filter(item => item.id !== id));
      alert(`Solicitação ${novoStatus === 'Aguardando_Facilities' ? 'APROVADA' : 'REPROVADA'} com sucesso!`);
    } catch (error) {
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Banner de Notificação em Tempo Real */}
      {notificacaoAtiva && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10b981', 
          color: '#fff', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000, fontWeight: 'bold', animation: 'slideIn 0.3s ease'
        }}>
          🔔 {notificacaoAtiva}
        </div>
      )}

      <header style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <h2 style={{ color: '#1e293b', margin: 0 }}>Painel de Aprovação de Área</h2>
        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
          Bem-vindo, <strong>{gestorNome}</strong> | Setor: <span style={{ background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>{gestorSetor}</span>
        </p>
      </header>

      {carregando ? (
        <p style={{ color: '#64748b' }}>Carregando solicitações pendentes...</p>
      ) : solicitacoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>Nenhuma solicitação aguardando sua aprovação no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {solicitacoes.map((item) => (
            <div key={item.id} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', 
              padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', 
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'
            }}>
              
              {/* Informações da Solicitação */}
              <div style={{ flex: '1', minWidth: '280px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', block: 'inline-block', marginBottom: '4px' }}>
                  CÓDIGO: {item.codigo}
                </span>
                <h3 style={{ margin: '5px 0', color: '#0f172a', fontSize: '18px' }}>
                  {item.material} <span style={{ color: '#0284c7' }}>(Qtd: {item.quantidade})</span>
                </h3>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#334155' }}>
                  <strong>Colaborador:</strong> {item.solicitante}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#334155' }}>
                  <strong>Motivo:</strong> {item.motivo || item.motivo_saida}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#334155' }}>
                  <strong>Destino:</strong> {item.destino}
                </p>
              </div>

              {/* Botões de Decisão */}
              <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                <button
                  onClick={() => gerenciarStatus(item.id, 'Reprovado_Gestor')}
                  style={{
                    backgroundColor: '#ef4444', color: '#fff', border: 'none', 
                    padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', 
                    cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  Recusar
                </button>
                <button
                  onClick={() => gerenciarStatus(item.id, 'Aguardando_Facilities')}
                  style={{
                    backgroundColor: '#10b981', color: '#fff', border: 'none', 
                    padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', 
                    cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  Aprovar Saída
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}