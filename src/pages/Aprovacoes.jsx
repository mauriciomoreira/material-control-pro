import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Check, X, Clock, FileText, Loader2, ChevronLeft, Home, Bell, History, User } from 'lucide-react';

export default function Aprovacoes() {
  const [abaAtiva, setAbaAtiva] = useState('pendente'); 
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [submetendo, setSubmetendo] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const gestorEmail = localStorage.getItem('gestor_email') || '';

  const obterSetor = () => {
    if (gestorEmail.includes('smd')) return 'SMD';
    if (gestorEmail.includes('facilities')) return 'Facilities';
    return 'SESMT';
  };

  const setorAtual = obterSetor();
  const nivelGestor = setorAtual === 'Facilities' ? 'Facilities' : 'Direto';

  const buscarDados = async () => {
    setCarregando(true);
    try {
      let query = supabase.from('solicitacoes').select('*');

      if (abaAtiva === 'pendente') {
        const statusAlvo = nivelGestor === 'Direto' ? 'Aguardando_Gestor' : 'Aguardando_Facilities';
        query = query.eq('status', statusAlvo);
      } else {
        query = query.not('status', 'in', '("Aguardando_Gestor","Aguardando_Facilities")');
      }

      if (nivelGestor === 'Direto') {
        query = query.eq('setor', setorAtual);
      }

      const { data, error } = await query.order('data_hora', { ascending: false });
      if (!error && data) setSolicitacoes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, [gestorEmail, abaAtiva]);

  const processarAprovacao = async (id, acao) => {
    setSubmetendo(id);
    const dataAtual = new Date().toISOString();
    let dadosAtualizacao = {};

    if (acao === 'aprovar') {
      if (nivelGestor === 'Direto') {
        dadosAtualizacao = {
          status: 'Aguardando_Facilities',
          aprovacao_gestor_por: `Gestor ${setorAtual}`,
          aprovacao_gestor_data: dataAtual
        };
      } else {
        dadosAtualizacao = {
          status: 'Aprovado_Saida',
          aprovacao_facilities_por: `Gestor ${setorAtual}`,
          aprovacao_facilities_data: dataAtual
        };
      }
    } else {
      dadosAtualizacao = {
        status: 'Reprovado',
        ...(nivelGestor === 'Direto'
          ? { aprovacao_gestor_por: `Gestor ${setorAtual} (Reprovou)`, aprovacao_gestor_data: dataAtual }
          : { aprovacao_facilities_por: `Gestor ${setorAtual} (Reprovou)`, aprovacao_facilities_data: dataAtual }
        )
      };
    }

    try {
      const { error } = await supabase.from('solicitacoes').update(dadosAtualizacao).eq('id', id);
      if (error) throw error;

      setMensagem(`Solicitação ${acao === 'aprovar' ? 'aprovada' : 'reprovada'} com sucesso!`);
      setTimeout(() => setMensagem(''), 3000);
      setSolicitacoes(solicitacoes.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao processar.');
    } finally {
      setSubmetendo(null);
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '';
    const d = new Date(dataString);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#f1f5f9', 
      zIndex: 9999, 
      overflowY: 'auto',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '430px', 
        backgroundColor: '#fdfdfd', 
        minHeight: '100vh', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
        paddingBottom: '80px', 
        position: 'relative', 
        boxShadow: '0 0 20px rgba(0,0,0,0.1)' 
      }}>
        
        {/* HEADER DO MOBILE */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: 'white', position: 'relative' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#000' }}>
            <ChevronLeft size={24} />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 auto', transform: 'translateX(-12px)' }}>
            Aprovação do Gestor
          </h2>
        </div>

        {/* ABAS: PENDENTE / HISTÓRICO */}
        <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #eaeaea', marginBottom: '16px' }}>
          <button 
            onClick={() => setAbaAtiva('pendente')}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              color: abaAtiva === 'pendente' ? '#22c55e' : '#888',
              borderBottom: abaAtiva === 'pendente' ? '2px solid #22c55e' : '2px solid transparent'
            }}
          >
            Pendente
          </button>
          <button 
            onClick={() => setAbaAtiva('historico')}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              color: abaAtiva === 'historico' ? '#22c55e' : '#888',
              borderBottom: abaAtiva === 'historico' ? '2px solid #22c55e' : '2px solid transparent'
            }}
          >
            Histórico
          </button>
        </div>

        {/* CORPO DE CARDS */}
        <div style={{ padding: '0 16px' }}>
          {mensagem && (
            <div style={{ padding: '10px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', textAlign: 'center', fontWeight: '500' }}>
              {mensagem}
            </div>
          )}

          {carregando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={24} style={{ color: '#666' }} />
            </div>
          ) : solicitacoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', border: '1px dashed #ddd', borderRadius: '12px', backgroundColor: 'white' }}>
              <Clock size={32} style={{ marginBottom: '8px', color: '#ccc' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma solicitação.</p>
            </div>
          ) : (
            solicitacoes.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#222' }}>
                    Solicitação #{item.codigo || `2026-${item.id}`}
                  </span>
                  <span style={{ backgroundColor: item.status === 'Reprovado' ? '#fee2e2' : '#ffedd5', color: item.status === 'Reprovado' ? '#dc2626' : '#ea580c', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {item.status === 'Aguardando_Gestor' ? 'Pendente' : item.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8c8c8c' }}>Solicitante</span>
                    <span style={{ fontWeight: '600', color: '#222' }}>{item.solicitante}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8c8c8c' }}>Data</span>
                    <span style={{ fontWeight: '500', color: '#222' }}>{formatarData(item.data_hora)}</span>
                  </div>

                  <div>
                    <span style={{ color: '#8c8c8c', display: 'block', marginBottom: '2px' }}>Material</span>
                    <span style={{ fontWeight: '700', color: '#222', fontSize: '14px' }}>{item.material}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8c8c8c' }}>Quantidade</span>
                    <span style={{ fontWeight: '700', color: '#222' }}>{item.quantidade}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '4px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <span style={{ color: '#8c8c8c', display: 'block', marginBottom: '2px' }}>Motivo</span>
                        <span style={{ fontWeight: '600', color: '#222', lineHeight: '1.4' }}>{item.motivo_saida || item.motivo || 'Não informado'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#8c8c8c', display: 'block', marginBottom: '2px' }}>Destino</span>
                        <span style={{ fontWeight: '600', color: '#222' }}>{item.destino}</span>
                      </div>
                    </div>
                    {item.foto_url && (
                      <img src={item.foto_url} alt="Material" style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eaeaea' }} />
                    )}
                  </div>

                  <div style={{ marginTop: '2px' }}>
                    <span style={{ color: '#8c8c8c', display: 'block' }}>Valor estimado</span>
                    <span style={{ fontWeight: '700', color: '#222', fontSize: '14px' }}>{item.valor_estimado ? `R$ ${item.valor_estimado}` : 'R$ 0,00'}</span>
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <span style={{ color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>Anexos</span>
                    {item.anexo_url ? (
                      <a href={item.anexo_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', color: '#333', textDecoration: 'none', border: '1px solid #e8e8e8', fontSize: '13px' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Ordem de Serviço.pdf</span>
                      </a>
                    ) : (
                      <div style={{ padding: '10px', border: '1px solid #e8e8e8', borderRadius: '6px', color: '#ccc', fontStyle: 'italic' }}>Sem anexos</div>
                    )}
                  </div>
                </div>

                {abaAtiva === 'pendente' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button 
                        disabled={submetendo === item.id}
                        onClick={() => processarAprovacao(item.id, 'aprovar')}
                        style={{ padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0fa958', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Aprovar
                      </button>
                      <button 
                        disabled={submetendo === item.id}
                        onClick={() => processarAprovacao(item.id, 'reprovar')}
                        style={{ padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#d13434', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Reprovar
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => alert('Informações complementares solicitadas.')}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #2563eb', backgroundColor: 'transparent', color: '#2563eb', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Solicitar informação
                    </button>
                  </div>
                )}

              </div>
            ))
          )}
        </div>

        {/* FOOTER NAVIGATION */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', height: '65px', backgroundColor: 'white', borderTop: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#888', cursor: 'pointer' }}>
            <Home size={20} />
            <span style={{ fontSize: '11px', marginTop: '2px' }}>Início</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#2563eb', cursor: 'pointer', position: 'relative' }}>
            <Bell size={20} />
            <span style={{ position: 'absolute', top: '-4px', right: '12px', backgroundColor: '#dc2626', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>3</span>
            <span style={{ fontSize: '11px', marginTop: '2px', fontWeight: '600' }}>Aprovações</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#888', cursor: 'pointer' }}>
            <History size={20} />
            <span style={{ fontSize: '11px', marginTop: '2px' }}>Histórico</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#888', cursor: 'pointer' }}>
            <User size={20} />
            <span style={{ fontSize: '11px', marginTop: '2px' }}>Perfil</span>
          </div>
        </div>

      </div>
    </div>
  );
}