import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { Camera, FileText, Send, Loader2, Home, PlusCircle, History, LogOut } from 'lucide-react';

export default function NovaSolicitacao({ onLogout }) {
  const usuarioLogado = 'João Silva';
  const dataInputRef = useRef(null); 

  const [abaAtual, setAbaAtual] = useState('solicitacao'); 
  const [idAtivo, setIdAtivo] = useState(null);
  const [material, setMaterial] = useState('');
  const [codigoMaterial, setCodigoMaterial] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [destino, setDestino] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [gestorArea, setGestorArea] = useState(''); 
  const [fotoUrl, setFotoUrl] = useState(null);
  const [anexoUrl, setAnexoUrl] = useState(null);
  
  const [passoAtivo, setPassoAtivo] = useState(1);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);

  const [listaHistorico, setListaHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [anexoFile, setAnexoFile] = useState(null);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [erroFoto, setErroFoto] = useState(false);

  useEffect(() => {
    buscarSolicitacaoAtiva();
  }, []);

  const buscarSolicitacaoAtiva = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('solicitante', usuarioLogado)
        .neq('status', 'Concluido') 
        .order('id', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        travarDadosNaTela(data[0]);
      } else {
        resetarFormularioLimpo();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const travarDadosNaTela = (solicitacao) => {
    setIdAtivo(solicitacao.id);
    setMaterial(solicitacao.material);
    setCodigoMaterial(solicitacao.codigo);
    setQuantidade(solicitacao.quantidade);
    setMotivo(solicitacao.motivo_saida);
    setDestino(solicitacao.destino);
    setDataPrevista(solicitacao.data_prevista || '');
    setGestorArea(solicitacao.gestor_area || ''); 
    setFotoUrl(solicitacao.foto_url);
    setAnexoUrl(solicitacao.anexo_url);
    setModoVisualizacao(true);
    setErroFoto(false);

    if (solicitacao.status === 'Aguardando_Gestor') setPassoAtivo(1);
    else if (solicitacao.status === 'Aguardando_Facilities') setPassoAtivo(2);
    else if (solicitacao.status === 'Aprovado_Saida') setPassoAtivo(3);
    else if (solicitacao.status === 'Concluido') setPassoAtivo(4);
  };

  const resetarFormularioLimpo = () => {
    setIdAtivo(null);
    setMaterial('');
    setCodigoMaterial('');
    setQuantidade('1');
    setMotivo('');
    setDestino('');
    setDataPrevista('');
    setGestorArea(''); 
    setFotoUrl(null);
    setAnexoUrl(null);
    setFotoFile(null);
    setFotoPreview(null);
    setAnexoFile(null);
    setPassoAtivo(1);
    setModoVisualizacao(false);
    setErroFoto(false);
  };

  const carregarHistoricoColaborador = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('solicitante', usuarioLogado)
        .order('id', { ascending: false });

      if (error) throw error;
      setListaHistorico(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modoVisualizacao) return;

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const dadosParaSalvar = {
        codigo: codigoMaterial || 'N/A',
        solicitante: usuarioLogado,
        material: material,
        quantidade: parseInt(quantidade, 10),
        motivo: motivo,       
        motivo_saida: motivo, 
        destino: destino,
        data_prevista: dataPrevista,
        gestor_area: gestorArea, // Ex: 'SESMT'
        status: 'Aguardando_Gestor', 
        foto_url: fotoPreview || fotoUrl,
        anexo_url: anexoFile ? 'anexo_enviado.pdf' : null
      };

      // 1. Salva a solicitação
      const { data, error } = await supabase
        .from('solicitacoes')
        .insert([dadosParaSalvar])
        .select();

      if (error) {
        setMensagem({ tipo: 'erro', texto: `Erro no Banco: ${error.message}` });
        return;
      }

      // 2. 🌟 GERA A NOTIFICAÇÃO PARA O GESTOR DA ÁREA
      await supabase
        .from('notificacoes')
        .insert([
          {
            para_setor: gestorArea, // Envia direto para o setor escolhido
            mensagem: `Nova solicitação de ${material} criada por ${usuarioLogado}.`,
            lida: false
          }
        ]);

      setMensagem({ tipo: 'sucesso', texto: 'Solicitação enviada com sucesso!' });
      if (data && data.length > 0) {
        travarDadosNaTela(data[0]);
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: `Falha no envio: ${err.message}` });
    }
  };

  const isInicioAtivo = abaAtual === 'solicitacao' && modoVisualizacao;
  const isNovaAtiva = abaAtual === 'solicitacao' && !modoVisualizacao;
  const isHistoricoAtivo = abaAtual === 'historico';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '10px 0' }}>
      
      {/* Celular Container */}
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
        <div style={{ padding: '14px 24px 8px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' }}>
            Olá, {usuarioLogado}, Veja as <br />
            <span style={{ color: '#10b981' }}>Suas Solicitações</span>
          </div>
        </div>

        {/* CONTEÚDO DA ABA: SOLICITAÇÃO / MONITOR */}
        {abaAtual === 'solicitacao' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 80px 16px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Stepper Fixo - 4 Passos */}
            <div style={{ padding: '2px 0 8px 0', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', width: '100%' }}>
                <div style={{ position: 'absolute', top: '9px', left: '13px', right: '13px', height: '2px', backgroundColor: '#e2e8f0', zIndex: 1 }}></div>
                
                <div style={{ 
                  position: 'absolute', top: '9px', left: '13px', 
                  width: passoAtivo === 1 ? '0%' : passoAtivo === 2 ? '33%' : passoAtivo === 3 ? '66%' : '92%', 
                  height: '2px', backgroundColor: '#10b981', zIndex: 1, transition: 'all 0.4s' 
                }}></div>

                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: passoAtivo >= 1 ? '#10b981' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>1</div>
                  <span style={{ fontSize: '8px', marginTop: '3px', color: passoAtivo >= 1 ? '#10b981' : '#64748b', fontWeight: '600' }}>Solicitação</span>
                </div>
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: passoAtivo >= 2 ? '#10b981' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>2</div>
                  <span style={{ fontSize: '8px', marginTop: '3px', color: passoAtivo >= 2 ? '#10b981' : '#64748b', fontWeight: '600' }}>Ap. Gestor</span>
                </div>
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: passoAtivo >= 3 ? '#10b981' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>3</div>
                  <span style={{ fontSize: '8px', marginTop: '3px', color: passoAtivo >= 3 ? '#10b981' : '#64748b', fontWeight: '600' }}>Ap. Facilities</span>
                </div>
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: passoAtivo >= 4 ? '#10b981' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>4</div>
                  <span style={{ fontSize: '8px', marginTop: '3px', color: passoAtivo >= 4 ? '#10b981' : '#64748b', fontWeight: '600' }}>Portaria</span>
                </div>
              </div>
            </div>

            {/* Banner de Mensagem (CORRIGIDO AQUI: mensagem.tipo) */}
            {mensagem.texto && (
              <div style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '10px', marginBottom: '6px', backgroundColor: mensagem.tipo === 'sucesso' ? '#dcfce7' : '#fee2e2', color: mensagem.tipo === 'sucesso' ? '#15803d' : '#b91c1c', fontWeight: '500', textAlign: 'left' }}>
                {mensagem.texto}
              </div>
            )}

            {/* QUADRO DE FOTO */}
            <div style={{ 
              width: '100%', 
              height: '225px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              border: '1px solid #e2e8f0', 
              marginBottom: '10px', 
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              {(fotoPreview || fotoUrl) && !erroFoto ? (
                <img 
                  src={fotoPreview || fotoUrl} 
                  alt="Material" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} 
                  onError={() => setErroFoto(true)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: '6px' }}>
                  <Camera size={26} />
                  <span style={{ fontSize: '12px' }}>Foto do Material (Opcional)</span>
                </div>
              )}
              
              {!modoVisualizacao && (
                <label style={{ 
                  position: 'absolute', top: '10px', right: '10px', 
                  backgroundColor: 'rgba(15, 23, 42, 0.55)', color: 'white', 
                  padding: '8px', borderRadius: '50%', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)' 
                }}>
                  <Camera size={14} />
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)); setErroFoto(false); }
                  }} />
                </label>
              )}
            </div>

            {/* Formulário Alinhado à Esquerda */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0px', textAlign: 'left' }}>
              
              <div style={{ paddingBottom: '3px', marginBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Material</label>
                <input type="text" required disabled={modoVisualizacao} value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ex: Parafusadeira" style={{ width: '100%', border: 'none', padding: '1px 0', fontSize: '12px', color: '#0f172a', fontWeight: '500', backgroundColor: 'transparent', outline: 'none', textAlign: 'left' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingBottom: '3px', marginBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Código</label>
                  <input type="text" required disabled={modoVisualizacao} value={codigoMaterial} onChange={(e) => setCodigoMaterial(e.target.value)} placeholder="Ex: MAT-001" style={{ width: '100%', border: 'none', padding: '1px 0', fontSize: '12px', color: '#0f172a', fontWeight: '500', backgroundColor: 'transparent', outline: 'none', textAlign: 'left' }} />
                </div>
                <div>
                  <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Quantidade</label>
                  <input type="number" required disabled={modoVisualizacao} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="1" style={{ width: '100%', border: 'none', padding: '1px 0', fontSize: '12px', color: '#0f172a', fontWeight: '500', backgroundColor: 'transparent', outline: 'none', textAlign: 'left' }} />
                </div>
              </div>

              <div style={{ paddingBottom: '3px', marginBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Motivo da saída</label>
                <input type="text" required disabled={modoVisualizacao} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Reparo externo" style={{ width: '100%', border: 'none', padding: '1px 0', fontSize: '12px', color: '#0f172a', fontWeight: '500', backgroundColor: 'transparent', outline: 'none', textAlign: 'left' }} />
              </div>

              <div style={{ paddingBottom: '3px', marginBottom: '2px', borderBottom: '1px solid #f1f5f9' }}>
                <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Destino</label>
                <input type="text" required disabled={modoVisualizacao} value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ex: Oficina Central" style={{ width: '100%', border: 'none', padding: '1px 0', fontSize: '12px', color: '#0f172a', fontWeight: '500', backgroundColor: 'transparent', outline: 'none', textAlign: 'left' }} />
              </div>

              {/* DATA PREVISTA E GESTOR LADO A LADO EM UMA MESMA LINHA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingBottom: '5px', marginBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Data prevista</label>
                  <input 
                    type="date" 
                    ref={dataInputRef} 
                    required 
                    disabled={modoVisualizacao} 
                    value={dataPrevista} 
                    onChange={(e) => setDataPrevista(e.target.value)} 
                    style={{ width: '100%', border: 'none', padding: '1px 0', fontSize: '12px', color: '#0f172a', fontWeight: '500', backgroundColor: 'transparent', outline: 'none', cursor: 'pointer', textAlign: 'left' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', textAlign: 'left' }}>Gestor / Área</label>
                  <select
  required
  disabled={modoVisualizacao}
  value={gestorArea}
  onChange={(e) => setGestorArea(e.target.value)}
  style={{
    width: '100%',
    border: 'none',
    padding: '2px 0',
    fontSize: '12px',
    color: '#0f172a',
    fontWeight: '500',
    backgroundColor: 'transparent',
    outline: 'none',
    cursor: modoVisualizacao ? 'default' : 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit'
  }}
>
  <option value="" disabled style={{ color: '#94a3b8' }}>Selecione...</option>
  <option value="A&R">A&R (Reparo)</option> {/* 🌟 NOVO SETOR ADICIONADO HERE */}
  <option value="SMD">SMD</option>
  <option value="TESTE">TESTE</option>
  <option value="PA">PA</option>
  <option value="Logistica">Logística</option>
  <option value="RH">RH</option>
  <option value="SESMT">SESMT</option>
  <option value="Watts">Watts</option>
</select>
                </div>
              </div>

              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '9px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '3px', textAlign: 'left' }}>Anexo (opcional)</label>
                {modoVisualizacao ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: anexoUrl ? '#10b981' : '#64748b', fontWeight: '500' }}>
                    <FileText size={13} /> {anexoUrl ? 'Documento Vinculado' : 'Nenhum arquivo enviado'}
                  </div>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', color: '#0f172a', cursor: 'pointer', fontWeight: '500' }}>
                    <PlusCircle size={13} />
                    <span>{anexoFile ? anexoFile.name : 'Adicionar arquivo / OS'}</span>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => setAnexoFile(e.target.files[0])} />
                  </label>
                )}
              </div>

              {!modoVisualizacao && (
                <button type="submit" disabled={carregando} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {carregando ? <Loader2 size={14} className="animate-spin" /> : <><Send size={12} /> Enviar Solicitação</>}
                </button>
              )}

            </form>
          </div>
        )}

        {/* HISTÓRICO */}
        {abaAtual === 'historico' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '80px' }}>
            {carregando ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 className="animate-spin" color="#10b981" /></div>
            ) : listaHistorico.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>Nenhuma solicitação encontrada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                {listaHistorico.map((item) => (
                  <div key={item.id} onClick={() => { travarDadosNaTela(item); setAbaAtual('solicitacao'); }} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a' }}>{item.material}</h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Cód: {item.codigo} | Qtd: {item.quantidade} {item.gestor_area && `| ${item.gestor_area}`}</span>
                    </div>
                    <span style={{ 
                      fontSize: '10px', padding: '4px 8px', borderRadius: '99px', fontWeight: '600',
                      backgroundColor: item.status === 'Concluido' ? '#dcfce7' : '#fef3c7',
                      color: item.status === 'Concluido' ? '#166534' : '#92400e'
                    }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BARRA INFERIOR */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '65px',
          backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 10
        }}>
          {/* BOTÃO INÍCIO */}
          <button 
            onClick={() => { setAbaAtual('solicitacao'); buscarSolicitacaoAtiva(); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              color: abaAtual === 'solicitacao' ? '#10b981' : '#64748b', cursor: 'pointer', 
              position: isInicioAtivo ? 'relative' : 'static', top: isInicioAtivo ? '-6px' : '0px', gap: isInicioAtivo ? '0px' : '2px'
            }}
          >
            {isInicioAtivo ? (
              <Home size={38} color="#10b981" fill="#dcfce7" />
            ) : (
              <Home size={20} />
            )}
            <span style={{ fontSize: '10px', fontWeight: isInicioAtivo ? '600' : '500', marginTop: isInicioAtivo ? '-2px' : '0px', color: abaAtual === 'solicitacao' ? '#10b981' : '#64748b' }}>Início</span>
          </button>

          {/* BOTÃO NOVA */}
          <button 
            onClick={() => { setAbaAtual('solicitacao'); resetarFormularioLimpo(); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              color: isNovaAtiva ? '#10b981' : '#64748b', cursor: 'pointer', 
              position: isNovaAtiva ? 'relative' : 'static', top: isNovaAtiva ? '-6px' : '0px', gap: isNovaAtiva ? '0px' : '2px'
            }}
          >
            {isNovaAtiva ? (
              <PlusCircle size={38} color="#10b981" fill="#dcfce7" />
            ) : (
              <PlusCircle size={20} color="#64748b" />
            )}
            <span style={{ fontSize: '10px', fontWeight: isNovaAtiva ? '600' : '500', marginTop: isNovaAtiva ? '-2px' : '0px', color: isNovaAtiva ? '#10b981' : '#64748b' }}>Nova</span>
          </button>

          {/* BOTÃO HISTÓRICO */}
          <button 
            onClick={() => { setAbaAtual('historico'); carregarHistoricoColaborador(); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              color: isHistoricoAtivo ? '#10b981' : '#64748b', cursor: 'pointer', 
              position: isHistoricoAtivo ? 'relative' : 'static', top: isHistoricoAtivo ? '-6px' : '0px', gap: isHistoricoAtivo ? '0px' : '2px'
            }}
          >
            {isHistoricoAtivo ? (
              <History size={38} color="#10b981" fill="#dcfce7" />
            ) : (
              <History size={20} />
            )}
            <span style={{ fontSize: '10px', fontWeight: isHistoricoAtivo ? '600' : '500', marginTop: isHistoricoAtivo ? '-2px' : '0px', color: isHistoricoAtivo ? '#10b981' : '#64748b' }}>Histórico</span>
          </button>

          {/* BOTÃO SAIR */}
          <button onClick={onLogout} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ef4444', cursor: 'pointer', gap: '2px' }}>
            <LogOut size={20} />
            <span style={{ fontSize: '10px', fontWeight: '500' }}>Sair</span>
          </button>
        </div>

      </div>
    </div>
  );
}