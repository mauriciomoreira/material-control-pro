import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Check, X, Clock, User, FileText, Loader2 } from 'lucide-react';

export default function Aprovacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [submetendo, setSubmetendo] = useState(null); 
  const [mensagem, setMensagem] = useState('');
  
  // 🌟 PEGA O GESTOR LOGADO DO LOCALSTORAGE
  const gestorEmail = localStorage.getItem('gestor_email') || '';
  
  // Descobre o nome do setor baseado no email
  const obterSetor = () => {
    if (gestorEmail.includes('smd')) return 'SMD';
    if (gestorEmail.includes('facilities')) return 'Facilities';
    return 'SESMT'; // Padrão caso seja gestor.sesmt
  };

  const setorAtual = obterSetor();
  // Se for do setor Facilities, o nível é 'Facilities'. Se for SMD ou SESMT, é 'Direto'.
  const nivelGestor = setorAtual === 'Facilities' ? 'Facilities' : 'Direto';

  // Busca as solicitações dependendo do nível real do gestor logado
  const buscarPendentes = async () => {
    setCarregando(true);
    const statusAlvo = nivelGestor === 'Direto' ? 'Aguardando_Gestor' : 'Aguardando_Facilities';

    try {
      // 🌟 CONSTRUÇÃO DA QUERY DINÂMICA
      let query = supabase
        .from('solicitacoes')
        .select('*')
        .eq('status', statusAlvo);

      // 🔥 SE FOR GESTOR DIRETO (SMD ou SESMT), FILTRA APENAS O SEU PRÓPRIO SETOR
      // Nota: Certifique-se de que o nome da coluna no seu banco seja exatamente 'setor'
      if (nivelGestor === 'Direto') {
        query = query.eq('setor', setorAtual);
      }

      const { data, error } = await query.order('data_hora', { ascending: true });

      if (!error && data) {
        setSolicitacoes(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Supabase:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarPendentes();
  }, [gestorEmail]); // Executa ao detectar o e-mail do gestor

  // Função para Processar a Decisão (Aprovar ou Reprovar)
  const processarAprovacao = async (id, acao) => {
    setSubmetendo(id);
    const dataAtual = new Date().toISOString();
    let novoStatus = '';
    let dadosAtualizacao = {};

    if (acao === 'aprovar') {
      if (nivelGestor === 'Direto') {
        novoStatus = 'Aguardando_Facilities'; 
        dadosAtualizacao = {
          status: novoStatus,
          aprovacao_gestor_por: `Gestor ${setorAtual}`, // 🌟 Assinatura Dinâmica!
          aprovacao_gestor_data: dataAtual
        };
      } else {
        novoStatus = 'Aprovado_Saida'; 
        dadosAtualizacao = {
          status: novoStatus,
          aprovacao_facilities_por: `Gestor ${setorAtual}`, // 🌟 Assinatura Dinâmica!
          aprovacao_facilities_data: dataAtual
        };
      }
    } else {
      novoStatus = 'Reprovado'; 
      dadosAtualizacao = {
        status: novoStatus,
        ...(nivelGestor === 'Direto' 
          ? { aprovacao_gestor_por: `Gestor ${setorAtual} (Reprovou)`, aprovacao_gestor_data: dataAtual }
          : { aprovacao_facilities_por: `Gestor ${setorAtual} (Reprovou)`, aprovacao_facilities_data: dataAtual }
        )
      };
    }

    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update(dadosAtualizacao)
        .eq('id', id);

      if (error) throw error;

      setMensagem(`Solicitação ${acao === 'aprovar' ? 'aprovada' : 'reprovada'} com sucesso!`);
      setTimeout(() => setMensagem(''), 4000);
      
      setSolicitacoes(solicitacoes.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao processar aprovação.');
    } finally {
      setSubmetendo(null);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      {/* CABEÇALHO DA TELA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>
            Painel de Aprovações Pendentes
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Analise e despache os pedidos da esteira de saída.
          </p>
        </div>

        {/* INDICADOR REAL DE QUEM ESTÁ LOGADO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
          <span>Painel do Setor:</span>
          <span style={{ backgroundColor: '#0072db', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            {setorAtual}
          </span>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {mensagem && (
        <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '8px', marginBottom: '16px', fontWeight: '500', fontSize: '14px' }}>
          {mensagem}
        </div>
      )}

      {/* ESTADO DE CARREGANDO */}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
          <Loader2 className="animate-spin" size={24} /> <span style={{ marginLeft: '8px' }}>Buscando solicitações...</span>
        </div>
      ) : solicitacoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
          <Clock size={40} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>Nenhuma solicitação aguardando aprovação para o setor {setorAtual}.</p>
        </div>
      ) : (
        
        /* GRID DE SOLICITAÇÕES */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {solicitacoes.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              
              <div style={{ width: '100%', height: '140px', backgroundColor: '#f8fafc', position: 'relative' }}>
                {item.foto_url ? (
                  <img src={item.foto_url} alt={item.material} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                    <FileText size={32} />
                  </div>
                )}
                <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#0f172a', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                  {item.codigo}
                </span>
              </div>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '600' }}>{item.material}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>Qtd: <strong style={{ color: '#0f172a' }}>{item.quantidade}</strong></p>
                </div>

                {/* 🌟 IDENTIFICADOR VISUAL DO SETOR DO ITEM (Para conferência) */}
                <div style={{ fontSize: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Setor de Origem: </span>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', color: '#475569' }}>
                    {item.setor}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Motivo da Saída</span>
                  {item.motivo_saida || item.motivo || 'Não informado'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Destino:</span>
                    <strong style={{ color: '#334155' }}>{item.destino}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Solicitante:</span>
                    <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> {item.solicitante}
                    </span>
                  </div>
                </div>

                {item.anexo_url && (
                  <a href={item.anexo_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0072db', fontWeight: '600', textDecoration: 'none', marginTop: '4px' }}>
                    <FileText size={14} /> Ver Documento Anexo / OS
                  </a>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                  <button 
                    disabled={submetendo === item.id}
                    onClick={() => processarAprovacao(item.id, 'reprovar')}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <X size={16} /> Reprovar
                  </button>
                  
                  <button 
                    disabled={submetendo === item.id}
                    onClick={() => processarAprovacao(item.id, 'aprovar')}
                    style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(22,163,74,0.15)' }}
                  >
                    {submetendo === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} /> Aprovar
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}