import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { History, Search, FileText, Calendar } from 'lucide-react';

export default function Historico() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  // Busca TODAS as solicitações do banco de dados para o relatório geral
  const buscarTodas = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .order('data_hora', { ascending: false }); // Mais recentes primeiro

    if (!error && data) {
      setSolicitacoes(data);
    }
    setCarregando(false);
  };

  useEffect(() => {
    buscarTodas();
  }, []);

  // Filtra a lista com base no termo digitado na barra de busca
  const dadosFiltrados = solicitacoes.filter((item) => {
    const termo = busca.toLowerCase();
    return (
      item.codigo?.toLowerCase().includes(termo) ||
      item.solicitante?.toLowerCase().includes(termo) ||
      item.material?.toLowerCase().includes(termo) ||
      item.destino?.toLowerCase().includes(termo) ||
      item.status?.toLowerCase().includes(termo)
    );
  });

  // Função auxiliar para renderizar as badges de status estilizadas
  const renderBadgeStatus = (status) => {
    const estilos = {
      Pendente: { bg: '#fffbeb', texto: '#b45309', border: '#fde68a' },
      Aprovado: { bg: '#f0fdf4', texto: '#16a34a', border: '#bbf7d0' },
      Reprovado: { bg: '#fef2f2', texto: '#dc2626', border: '#fca5a5' }
    };

    const estilo = estilos[status] || estilos.Pendente;

    return (
      <span style={{
        backgroundColor: estilo.bg,
        color: estilo.texto,
        border: `1px solid ${estilo.border}`,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {status}
      </span>
    );
  };

  // Formata a data vinda do banco (Timestamptz) para o padrão brasileiro DD/MM/AAAA
  const formatarData = (dataString) => {
    if (!dataString) return '--/--/----';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* CABEÇALHO */}
      <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>
        Histórico Geral
      </h2>
      <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '14px' }}>
        Consulte, filtre e audite todas as movimentações de materiais registradas no sistema.
      </p>

      {/* BARRA DE PESQUISA INTELIGENTE */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        backgroundColor: 'white', 
        padding: '10px 16px', 
        borderRadius: '10px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        marginBottom: '20px'
      }}>
        <Search size={18} color="#94a3b8" />
        <input 
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por código, material, solicitante ou status..."
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: '#334155',
            backgroundColor: 'transparent'
          }}
        />
      </div>

      {/* TABELA DE REGISTROS */}
      {carregando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p style={{ fontSize: '15px', fontWeight: '500' }}>Carregando histórico...</p>
        </div>
      ) : dadosFiltrados.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '50px 20px', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          textAlign: 'center', 
          color: '#94a3b8' 
        }}>
          <History size={44} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#475569' }}>Nenhum registro encontrado</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Tente mudar os termos da sua pesquisa.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Código</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Data</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Solicitante</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Material</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Qtd</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Destino</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item, index) => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: index !== dadosFiltrados.length - 1 ? '1px solid #e2e8f0' : 'none',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fdfdfd',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fdfdfd'}
                >
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0072db' }}>{item.codigo}</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#94a3b8" />
                      {formatarData(item.data_hora || item.created_at)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1e293b' }}>{item.solicitante}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#94a3b8" />
                      {item.material}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#1e293b' }}>{item.quantidade}</td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>{item.destino}</td>
                  <td style={{ padding: '16px 20px' }}>{renderBadgeStatus(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}