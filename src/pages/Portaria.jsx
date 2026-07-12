import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Bell, CheckCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Portaria() {
  const [solicitacoesAprovadas, setSolicitacoesAprovadas] = useState([]);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [acaoCarregando, setAcaoCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    buscarSolicitacoesAprovadas();
  }, []);

  // Garante que APENAS o que foi aprovado por Facilities apareça para a portaria
  const buscarSolicitacoesAprovadas = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('status', 'Aprovado_Saida') 
        .order('id', { ascending: true });

      if (error) throw error;
      setSolicitacoesAprovadas(data || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleLiberarSaida = async (id) => {
    setAcaoCarregando(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'Concluido' })
        .eq('id', id);

      if (error) throw error;

      setMensagem('Saída liberada com sucesso!');
      setSolicitacaoSelecionada(null);
      buscarSolicitacoesAprovadas(); 
    } catch (err) {
      console.error('Erro ao liberar saída:', err);
    } finally {
      setAcaoCarregando(false);
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  return (
    // O container principal ocupa a tela toda e elimina qualquer menu lateral
    <div style={{ 
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f1f5f9', 
      zIndex: 9999 
    }}>
      
      {/* Celular centralizado isolado na tela */}
      <div style={{
        width: '385px',
        height: '740px',
        backgroundColor: '#ffffff',
        borderRadius: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        border: '10px solid #0f172a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        
        {/* CABEÇALHO */}
        <div style={{ padding: '20px 16px 12px 16px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {solicitacaoSelecionada && (
            <button onClick={() => setSolicitacaoSelecionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} color="#0f172a" />
            </button>
          )}
          <div style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span>Portaria</span>
          </div>
        </div>

        {mensagem && (
          <div style={{ padding: '8px 12px', margin: '10px 16px 0 16px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '12px', fontWeight: '500', textAlign: 'center' }}>
            {mensagem}
          </div>
        )}

        {/* LISTA DO QUE JÁ FOI APROVADO POR FACILITIES */}
        {!solicitacaoSelecionada && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginTop: 0, marginBottom: '12px', textAlign: 'left' }}>
              Solicitações Liberadas ({solicitacoesAprovadas.length})
            </h3>

            {carregando ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}><Loader2 className="animate-spin" color="#10b981" /></div>
            ) : solicitacoesAprovadas.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '40px' }}>Nenhuma liberação pendente de portaria.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {solicitacoesAprovadas.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSolicitacaoSelecionada(item)}
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'left' }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', display: 'block' }}>Nº {item.id}</span>
                      <h4 style={{ margin: '2px 0', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{item.material}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>De: {item.solicitante}</span>
                    </div>
                    <div style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                      Verificar
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TELA IGUAL A IMAGEM 2 DE REFERÊNCIA */}
        {solicitacaoSelecionada && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto' }}>
            
            {/* Banner Verde Superior */}
            <div style={{ 
              backgroundColor: '#e8f7f0', 
              borderRadius: '14px', 
              padding: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              border: '1px solid #ccebdf',
              textAlign: 'left'
            }}>
              <div style={{ backgroundColor: '#10b981', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={18} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', color: '#065f46', fontWeight: '700' }}>Material aprovado para saída!</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#047857' }}>Solicitação #{solicitacaoSelecionada.id}</p>
              </div>
            </div>

            {/* Informações Alinhadas à Esquerda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', flex: 1 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Solicitante</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{solicitacaoSelecionada.solicitante}</div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Material</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{solicitacaoSelecionada.material}</div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Quantidade</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{solicitacaoSelecionada.quantidade}</div>
              </div>

              <div style={{ paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Data/Hora</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  {solicitacaoSelecionada.data_prevista ? new Date(solicitacaoSelecionada.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : 'A confirmar'}
                </div>
              </div>

              {/* Status das Aprovações */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '10px' }}>Aprovações</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                      <CheckCircle size={16} color="#10b981" fill="#dcfce7" />
                      <span>Gestor do Colaborador</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Aprovado</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                      <CheckCircle size={16} color="#10b981" fill="#dcfce7" />
                      <span>Gestor de Facilities</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Aprovado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Liberação de Saída */}
            <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
              <button 
                onClick={() => handleLiberarSaida(solicitacaoSelecionada.id)}
                disabled={acaoCarregando}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: '#10b981', 
                  color: 'white', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px'
                }}
              >
                {acaoCarregando ? <Loader2 size={16} className="animate-spin" /> : 'Liberar saída'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}