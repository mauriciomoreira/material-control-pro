import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { 
  ArrowLeft, 
  Home, 
  Bell, 
  History, 
  User, 
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AprovacaoFacilities({ onLogout }) {
  const [abaAtiva, setAbaAtiva] = useState('pendente'); // 'pendente' ou 'historico'
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Buscar solicitações filtradas especificamente para Facilities
  const buscarSolicitacoesFacilities = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .order('data_hora', { ascending: false });

    if (!error && data) {
      setSolicitacoes(data);
    }
    setCarregando(false);
  };

  useEffect(() => {
    buscarSolicitacoesFacilities();
  }, []);

  // Atualizar status conforme o fluxo correto de Facilities
  const atualizarStatus = async (id, acao) => {
    // Se aprovar, vai para 'Aprovado_Saida' (libera para a portaria)
    // Se reprovar, vai para 'Reprovado'
    const novoStatus = acao === 'Aprovar' ? 'Aprovado_Saida' : 'Reprovado';

    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: novoStatus })
      .eq('id', id);

    if (!error) {
      alert(`Solicitação atualizada! Status atual: ${novoStatus}`);
      buscarSolicitacoesFacilities(); 
    } else {
      alert('Erro ao processar aprovação.');
    }
  };

  // Filtro inteligente para a tela de Facilities
  const filtradas = solicitacoes.filter(s => {
    if (abaAtiva === 'pendente') {
      // Só mostra o que já foi aprovado pelo 1º gestor e aguarda Facilities
      return s.status === 'Aguardando_Facilities';
    } else {
      // Histórico mostra o que o Facilities já liberou para saída ou recusou
      return s.status === 'Aprovado_Saida' || s.status === 'Concluido' || s.status === 'Concluído' || s.status === 'Reprovado';
    }
  });

  return (
    <div style={{
      width: '375px',
      height: '812px',
      backgroundColor: '#f8fafc',
      borderRadius: '40px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      border: '8px solid #000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      {/* STATUS BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px 4px 24px', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff' }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px' }}>📶</span>
          <span style={{ fontSize: '10px' }}>🔋</span>
        </div>
      </div>

      {/* HEADER DA TELA */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={20} color="#000" />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b', marginRight: '24px' }}>
          Aprovação Facilities
        </h1>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setAbaAtiva('pendente')}
          style={{
            flex: 1, padding: '14px', border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            color: abaAtiva === 'pendente' ? '#10b981' : '#64748b',
            borderBottom: abaAtiva === 'pendente' ? '3px solid #10b981' : 'transparent'
          }}
        >
          Pendente
        </button>
        <button 
          onClick={() => setAbaAtiva('historico')}
          style={{
            flex: 1, padding: '14px', border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            color: abaAtiva === 'historico' ? '#10b981' : '#64748b',
            borderBottom: abaAtiva === 'historico' ? '3px solid #10b981' : 'transparent'
          }}
        >
          Histórico
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }}>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="#10b981" />
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px', fontSize: '14px' }}>
            Nenhuma liberação pendente para Facilities.
          </div>
        ) : (
          filtradas.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                  Solicitação #{item.id.toString().slice(-5)}
                </span>
                <span style={{ 
                  backgroundColor: item.status === 'Aguardando_Facilities' ? '#fef3c7' : item.status === 'Aprovado_Saida' || item.status === 'Concluido' ? '#d1fae5' : '#fee2e2', 
                  color: item.status === 'Aguardando_Facilities' ? '#d97706' : item.status === 'Aprovado_Saida' || item.status === 'Concluido' ? '#059669' : '#dc2626',
                  fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '9999px' 
                }}>
                  {item.status === 'Aprovado_Saida' ? 'Aprovado' : item.status}
                </span>
              </div>

              {/* Informações Alinhadas e Foto na Lateral */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', textAlign: 'left' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Solicitante</span>
                    <strong style={{ color: '#334155', fontSize: '13px' }}>{item.solicitante}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Data</span>
                    <strong style={{ color: '#334155' }}>{item.data_hora ? new Date(item.data_hora).toLocaleString('pt-BR') : '—'}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Material</span>
                    <strong style={{ color: '#334155', fontSize: '13px' }}>{item.material}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Quantidade</span>
                    <strong style={{ color: '#334155' }}>{item.quantidade}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Motivo</span>
                    <span style={{ color: '#334155', fontWeight: '600' }}>{item.motivo || '—'}</span>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Destino</span>
                    <span style={{ color: '#334155', fontWeight: '600' }}>{item.destino || '—'}</span>
                  </div>
                </div>

                {/* Foto Lateral Opcional */}
                <div style={{ width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', marginTop: '40px', flexShrink: 0 }}>
                  {item.foto_url ? (
                    <img src={item.foto_url} alt="Material" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px' }}>
                      Sem foto
                    </div>
                  )}
                </div>

              </div>

              {/* BOTÕES DE AÇÃO (Apenas pendente de Facilities) */}
              {abaAtiva === 'pendente' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => atualizarStatus(item.id, 'Aprovar')}
                      style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                      Aprovar Saída
                    </button>
                    <button 
                      onClick={() => atualizarStatus(item.id, 'Reprovar')}
                      style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                      Reprovar
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* TAB BAR DO IPHONE */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '65px', backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
          <Home size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Início</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#10b981', position: 'relative' }}>
          <Bell size={20} color="#10b981" />
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '600' }}>Aprovações</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }} onClick={() => setAbaAtiva('historico')}>
          <History size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Histórico</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }} onClick={onLogout}>
          <User size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Perfil</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '130px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />

    </div>
  );
}