import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Check, X, Clock, FileText, Loader2, ChevronLeft } from 'lucide-react';

export default function Aprovacoes() {
  const [abaAtiva, setAbaAtiva] = useState('pendente'); // 'pendente' ou 'historico'
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [submetendo, setSubmetendo] = useState(null);
  const [mensagem, setMensagem] = useState('');

  // PEGA O GESTOR LOGADO DO LOCALSTORAGE
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
        // Histórico mostra o que já foi processado
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
    <div style={{ maxWidth: '450px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER DO MOBILE */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0f172a' }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 auto', transform: 'translateX(-12px)' }}>
          Aprovação do Gestor
        </h2>
      </div>

      {/* ABAS: PENDENTE / HISTÓRICO */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setAbaAtiva('pendente')}
          style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            color: abaAtiva === 'pendente' ? '#16a34a' : '#64748b',
            borderBottom: abaAtiva === 'pendente' ? '3px solid #16a34a' : '3px solid transparent'
          }}
        >
          Pendente
        </button>
        <button 
          onClick={() => setAbaAtiva('historico')}
          style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            color: abaAtiva === 'historico' ? '#16a34a' : '#64748b',
            borderBottom: abaAtiva === 'historico' ? '3px solid #16a34a' : '3px solid transparent'
          }}
        >
          Histórico
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div style={{ padding: '16px' }}>
        {mensagem && (
          <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '8px', marginBottom: '16px', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
            {mensagem}
          </div>
        )}

        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : solicitacoes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: 'white' }}>
            <Clock size={36} style={{ marginBottom: '8px', color: '#cbd5e1' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma solicitação em {abaAtiva}.</p>
          </div>
        ) : (
          solicitacoes.map((item) => (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              
              {/* CÓDIGO DA SOLICITAÇÃO E TAG */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1s1f2a' }}>
                  Solicitação #{item.codigo || `2026-${item.id}`}
                </span>
                <span style={{ backgroundColor: item.status === 'Reprovado' ? '#fee2e2' : '#fef3c7', color: item.status === 'Reprovado' ? '#dc2626' : '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  {item.status === 'Aguardando_Gestor' ? 'Pendente' : item.status.replace('_', ' ')}
                </span>
              </div>

              {/* CAMPOS EM GRID IGUAL À IMAGEM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Solicitante</span>
                  <span style={{ fontWeight: '500', color: '#0f172a' }}>{item.solicitante}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Data</span>
                  <span style={{ fontWeight: '500', color: '#0f172a' }}>{formatarData(item.data_hora)}</span>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Material</span>
                  <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{item.material}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Quantidade</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{item.quantidade}</span>
                </div>

                {/* VISUALIZAÇÃO COM IMAGEM SE HOUVER */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '12px' }}>Motivo</span>
                      <span style={{ fontWeight: '500', color: '#0f172a' }}>{item.motivo_saida || item.motivo || 'Não informado'}</span>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '12px' }}>Destino</span>
                      <span style={{ fontWeight: '500', color: '#0f172a' }}>{item.destino}</span>
                    </div>
                  </div>
                  {item.foto_url && (
                    <img src={item.foto_url} alt="Material" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Valor estimado</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{item.valor_estimado ? `R$ ${item.valor_estimado}` : 'Não informado'}</span>
                </div>

                {/* ANEXOS */}
                <div style={{ marginTop: '6px' }}>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Anexos</span>
                  {item.anexo_url ? (
                    <a href={item.anexo_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', color: '#334155', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
                      <FileText size={14} style={{ color: '#64748b' }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Documento Anexo / OS.pdf</span>
                    </a>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic' }}>Nenhum anexo</span>
                  )}
                </div>
              </div>

              {/* BOTÕES DE AÇÃO (SÓ APARECEM NA ABA PENDENTE) */}
              {abaAtiva === 'pendente' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button 
                      disabled={submetendo === item.id}
                      onClick={() => processarAprovacao(item.id, 'aprovar')}
                      style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Aprovar
                    </button>
                    <button 
                      disabled={submetendo === item.id}
                      onClick={() => processarAprovacao(item.id, 'reprovar')}
                      style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Reprovar
                    </button>
                  </div>
                  
                  {/* BOTÃO ADICIONAL DA IMAGEM */}
                  <button 
                    onClick={() => alert('Função para solicitar mais detalhes enviada ao solicitante.')}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #0072db', backgroundColor: 'transparent', color: '#0072db', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Solicitar informação
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}