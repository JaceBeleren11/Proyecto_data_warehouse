import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function App() {
  const [datos, setDatos] = useState([]);
  const [datosHistoricos, setDatosHistoricos] = useState([]);
  
  // --- ESTADOS PARA LAS NUEVAS MÉTRICAS ---
  const [metricaLogistica, setMetricaLogistica] = useState([]);
  const [metricaNegocio, setMetricaNegocio] = useState([]);
  
  const [isLive, setIsLive] = useState(true);

  // Funciones de Fetch originales...
  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/datos');
      const data = await response.json();
      setDatos(data);
    } catch (error) { console.error("Error fetching data:", error); }
  };

  const fetchHistorico = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/historico-ordenes');
      const data = await response.json();
      setDatosHistoricos(data);
    } catch (error) { console.error("Error fetching historico:", error); }
  };

  // --- FETCH PARA TUS NUEVAS MÉTRICAS ---
  const fetchNuevasMetricas = async () => {
    try {
      // Endpoint para el Top 5 de retrasos
      const resLogistica = await fetch('http://127.0.0.1:8000/api/metrica-logistica'); 
      if(resLogistica.ok) {
        const dataLogistica = await resLogistica.json();
        setMetricaLogistica(dataLogistica);
      }

      // Endpoint para Ventas y Pedidos por Estado
      const resNegocio = await fetch('http://127.0.0.1:8000/api/metrica-negocio'); 
      if(resNegocio.ok) {
        const dataNegocio = await resNegocio.json();
        setMetricaNegocio(dataNegocio);
      }
    } catch (error) {
      console.error("Error fetching nuevas métricas. Asegúrate de crear los endpoints en api.py", error);
    }
  };

  useEffect(() => {
    fetchData(); 
    fetchHistorico(); 
    fetchNuevasMetricas(); 

    let interval;
    if (isLive) {
      interval = setInterval(fetchData, 2000); 
    }
    return () => clearInterval(interval);
  }, [isLive]);

  // --- CÁLCULO DE MÉTRICAS (TIEMPO REAL E HISTÓRICO) ---
  const totalRegistros = datos.length;
  const totalTCP = datos.filter(d => d.origen === 'TCP').length;
  const totalUDP = datos.filter(d => d.origen === 'UDP').length;

  const statusCountsRealTime = useMemo(() => {
    const counts = {};
    datos.filter(d => d.origen === 'TCP').forEach(d => {
      try {
        const parsed = typeof d.contenido === 'string' ? JSON.parse(d.contenido) : d.contenido;
        const status = parsed.order_status || 'desconocido';
        counts[status] = (counts[status] || 0) + 1;
      } catch (e) { counts['error_parseo'] = (counts['error_parseo'] || 0) + 1; }
    });
    return counts;
  }, [datos]);

  const statusCountsHistorico = useMemo(() => {
    const counts = {};
    datosHistoricos.forEach(orden => {
      const status = orden.order_status || 'Desconocido';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [datosHistoricos]);

  // --- CONFIGURACIÓN DE GRÁFICOS ORIGINALES ---
  const barChartData = {
    labels: ['TCP (Órdenes)', 'UDP (Sensores)'],
    datasets: [{ label: 'Volumen', data: [totalTCP, totalUDP], backgroundColor: ['#3b82f6', '#10b981'], borderRadius: 6 }]
  };

  const pieChartData = {
    labels: Object.keys(statusCountsRealTime),
    datasets: [{ data: Object.values(statusCountsRealTime), backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'] }]
  };

  const doughnutChartData = {
    labels: Object.keys(statusCountsHistorico),
    datasets: [{ data: Object.values(statusCountsHistorico), backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'] }]
  };

  // --- CONFIGURACIÓN DE GRÁFICOS PARA LAS NUEVAS MÉTRICAS ---
  
  // 1. Gráfica Logística (Barras Horizontales)
  const logisticaChartData = {
    labels: metricaLogistica.map(item => item.categoria || 'Sin Categoría'),
    datasets: [
      {
        label: 'Días Promedio de Entrega',
        data: metricaLogistica.map(item => item.dias_promedio || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // Rojo claro para indicar "retraso/tiempo"
        borderRadius: 4,
      }
    ]
  };

  const logisticaOptions = {
    indexAxis: 'y', // ESTO HACE QUE LA GRÁFICA SEA HORIZONTAL
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  // 2. Gráfica Negocio (Ventas por Estado - Top 10 para no saturar)
  const top10Negocio = metricaNegocio.slice(0, 10); // Tomamos solo los 10 primeros para la gráfica
  const negocioChartData = {
    labels: top10Negocio.map(item => item.estado || 'N/A'),
    datasets: [
      {
        label: 'Volumen de Ventas ($)',
        data: top10Negocio.map(item => item.ventas_totales || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // Verde para dinero/ventas
        borderRadius: 4,
      }
    ]
  };

  const negocioOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  // --- ESTILOS INLINE ---
  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', color: '#1f2937' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { margin: 0, fontSize: '28px', fontWeight: 'bold' },
    subtitle: { margin: '5px 0 0 0', color: '#6b7280' },
    button: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: isLive ? '#ef4444' : '#10b981', color: '#fff', transition: '0.2s' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
    card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    kpiTitle: { margin: 0, fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' },
    kpiValue: { margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold' },
    chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' },
    chartWrapper: { height: '300px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    chartTitle: { fontSize: '18px', marginTop: 0, marginBottom: '15px', color: '#111827' },
    sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: '#111827', marginTop: '50px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' },
    tableWrapper: { overflowX: 'auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '400px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: '600', position: 'sticky', top: 0 },
    td: { padding: '16px', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '14px' },
    emptyState: { textAlign: 'center', padding: '30px', color: '#6b7280' }
  };

  return (
    <div style={styles.container}>
      {/* SECCIÓN 1: INGESTA EN TIEMPO REAL */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Data Warehouse Dashboard</h1>
          <p style={styles.subtitle}>Monitorización de Ingesta y Análisis de Negocio</p>
        </div>
        <button style={styles.button} onClick={() => setIsLive(!isLive)}>
          {isLive ? '⏸ Pausar Tiempo Real' : '▶ Reanudar Tiempo Real'}
        </button>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.card}>
          <h3 style={styles.kpiTitle}>Total Registros Ingestados</h3>
          <p style={styles.kpiValue}>{totalRegistros}</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.kpiTitle}>Volumen TCP</h3>
          <p style={{ ...styles.kpiValue, color: '#3b82f6' }}>{totalTCP}</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.kpiTitle}>Volumen UDP</h3>
          <p style={{ ...styles.kpiValue, color: '#10b981' }}>{totalUDP}</p>
        </div>
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.card}>
          <h2 style={styles.chartTitle}>Comparativa de Protocolos (Ingesta)</h2>
          <div style={styles.chartWrapper}>
            <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div style={styles.card}>
          <h2 style={styles.chartTitle}>Estados (Ingesta Reciente TCP)</h2>
          <div style={styles.chartWrapper}>
            <Pie data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: MÉTRICAS DE NEGOCIO Y LOGÍSTICA (NUEVO) */}
      <h2 style={styles.sectionTitle}>Métricas Estratégicas (Data Warehouse)</h2>
      
      <div style={styles.chartGrid}>
        {/* Métrica 1: Logística */}
        <div style={styles.card}>
          <h2 style={styles.chartTitle}>Top 5 Categorías con Mayor Retraso (Logística)</h2>
          <div style={styles.chartWrapper}>
            {metricaLogistica.length > 0 ? (
              <Bar data={logisticaChartData} options={logisticaOptions} />
            ) : (
              <p style={styles.emptyState}>Esperando datos de la API (/api/metrica-logistica)...</p>
            )}
          </div>
        </div>
        
        {/* Métrica 2: Negocio (Gráfica) */}
        <div style={styles.card}>
          <h2 style={styles.chartTitle}>Volumen de Ventas por Estado (Top 10)</h2>
          <div style={styles.chartWrapper}>
            {metricaNegocio.length > 0 ? (
              <Bar data={negocioChartData} options={negocioOptions} />
            ) : (
              <p style={styles.emptyState}>Esperando datos de la API (/api/metrica-negocio)...</p>
            )}
          </div>
        </div>
      </div>

      {/* Métrica 2: Negocio (Tabla detallada para todos los estados) */}
      <div style={{...styles.card, marginBottom: '30px'}}>
        <h2 style={styles.chartTitle}>Detalle de Ventas y Pedidos Geográficos</h2>
        <div style={{ ...styles.tableWrapper, maxHeight: '300px' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Estado Geográfico</th>
                <th style={styles.th}>Número Total de Pedidos</th>
                <th style={styles.th}>Volumen Total de Ventas ($)</th>
              </tr>
            </thead>
            <tbody>
              {metricaNegocio.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{item.estado}</td>
                  <td style={styles.td}>{item.total_pedidos?.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#059669', fontWeight: '500' }}>
                    ${parseFloat(item.ventas_totales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
              {metricaNegocio.length === 0 && (
                <tr>
                  <td colSpan="3" style={styles.emptyState}>
                    Conecta la base de datos en api.py para ver los resultados aquí.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 3: ANÁLISIS HISTÓRICO ORIGINAL */}
      <h2 style={styles.sectionTitle}>Análisis Histórico de Órdenes (Olist Dataset)</h2>
      
      <div style={styles.chartGrid}>
        <div style={styles.card}>
          <h2 style={styles.chartTitle}>Distribución General de Estados</h2>
          <div style={styles.chartWrapper}>
            <Doughnut data={doughnutChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        
        <div style={styles.card}>
          <h2 style={styles.chartTitle}>Tabla Histórica (Últimas 500)</h2>
          <div style={{ ...styles.tableWrapper, maxHeight: '300px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID de Orden</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha de Compra</th>
                </tr>
              </thead>
              <tbody>
                {datosHistoricos.map((orden, idx) => (
                  <tr key={idx}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>
                      {orden.order_id ? orden.order_id.substring(0, 15) + '...' : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {orden.order_status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {orden.order_purchase_timestamp ? new Date(orden.order_purchase_timestamp).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {datosHistoricos.length === 0 && (
                  <tr><td colSpan="3" style={styles.emptyState}>Cargando histórico desde Supabase...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}