import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MINGAU_BASE_INFO,
  DADOS_CENARIO_ANOMALIA,
  DADOS_CENARIO_NORMAL
} from '../data/mockFeedData';

export default function ReportsView({ onVerTimeline }) {
  // Cenário simulado (começa por padrão na anomalia dos 2 dias sem água pedida pelo usuário)
  const [usarAnomalia, setUsarAnomalia] = useState(true);
  const [abaMetrica, setAbaMetrica] = useState('agua'); // 'agua' | 'racao'
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const dados = usarAnomalia ? DADOS_CENARIO_ANOMALIA : DADOS_CENARIO_NORMAL;
  const listaGrafico = abaMetrica === 'agua' ? dados.graficoAgua : dados.graficoRacao;
  const unidade = abaMetrica === 'agua' ? 'ml' : 'g';
  const metaDiaria = abaMetrica === 'agua' ? 140 : 55;
  const valorMaximo = Math.max(...listaGrafico.map(d => d.valor), metaDiaria * 1.25);

  function alternarCenario() {
    setUsarAnomalia(prev => !prev);
    setDiaSelecionado(null);
  }

  function simularIngestaoAgua() {
    Alert.alert(
      '💧 Ingestão Registrada!',
      'Você simulou que o Mingau acabou de beber 45 ml de água fresca na tigela!',
      [{ text: 'Maravilha!', onPress: () => setUsarAnomalia(false) }]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Topo: Perfil do Pet e Alternador de Cenário */}
      <View style={styles.petCard}>
        <Image
          source={{ uri: MINGAU_BASE_INFO.foto_url }}
          style={styles.petFoto}
          resizeMode="cover"
        />
        <View style={styles.petInfo}>
          <View style={styles.petNomeRow}>
            <Text style={styles.petNome}>{MINGAU_BASE_INFO.nome}</Text>
            <View style={[styles.statusBadge, dados.temAlerta ? styles.badgeCritico : styles.badgeNormal]}>
              <View style={[styles.statusDot, dados.temAlerta ? styles.dotCritico : styles.dotNormal]} />
              <Text style={[styles.statusTexto, dados.temAlerta ? styles.textoCritico : styles.textoNormal]}>
                {dados.temAlerta ? 'Anomalia Detectada' : 'Rotina Normal'}
              </Text>
            </View>
          </View>
          <Text style={styles.petDetalhes}>
            {MINGAU_BASE_INFO.raca} • {MINGAU_BASE_INFO.peso} kg • Padrão: 2 a 3x/dia
          </Text>
        </View>
      </View>

      {/* Caixa de Alternador do Cenário da Simulação */}
      <View style={styles.simuladorBar}>
        <View style={styles.simuladorInfo}>
          <Ionicons name="flask-outline" size={18} color="#6366F1" />
          <Text style={styles.simuladorTitulo}>Simulação Ativa:</Text>
          <Text style={styles.simuladorNome} numberOfLines={1}>
            {usarAnomalia ? '2 dias sem beber água 🚨' : 'Rotina 100% Normal ✅'}
          </Text>
        </View>
        <TouchableOpacity style={styles.btnTrocarCenario} onPress={alternarCenario}>
          <Ionicons name="swap-horizontal" size={14} color="#6366F1" />
          <Text style={styles.btnTrocarTexto}>Alternar</Text>
        </TouchableOpacity>
      </View>

      {/* Card de Alerta Inteligente de Saúde */}
      {dados.temAlerta ? (
        <View style={styles.alertaCard}>
          <View style={styles.alertaHeader}>
            <View style={styles.alertaIconCircle}>
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertaTitulo}>{dados.alerta.titulo}</Text>
              <Text style={styles.alertaUltimaVez}>Último registro: {dados.alerta.ultimaVezAgua}</Text>
            </View>
          </View>

          <Text style={styles.alertaMensagem}>{dados.alerta.mensagem}</Text>

          <View style={styles.alertaRiscoBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
            <Text style={styles.alertaRiscoTexto}>{dados.alerta.risco}</Text>
          </View>

          <Text style={styles.alertaRecomendacao}>
            💡 <Text style={{ fontWeight: '700' }}>Recomendação:</Text> {dados.alerta.recomendacao}
          </Text>

          {/* Botão de Ação Rápida */}
          <TouchableOpacity style={styles.btnAcaoAlerta} onPress={simularIngestaoAgua}>
            <Ionicons name="water" size={16} color="#FFFFFF" />
            <Text style={styles.btnAcaoTexto}>Simular que Mingau bebeu água agora</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.normalCard}>
          <View style={styles.normalHeader}>
            <Ionicons name="checkmark-circle" size={26} color="#10B981" />
            <Text style={styles.normalTitulo}>{dados.alerta.titulo}</Text>
          </View>
          <Text style={styles.normalMensagem}>{dados.alerta.mensagem}</Text>
          <Text style={styles.normalUltimaVez}>Última ingestão: {dados.alerta.ultimaVezAgua}</Text>
        </View>
      )}

      {/* Seletor de Métrica do Gráfico: Água x Ração */}
      <View style={styles.seletorContainer}>
        <TouchableOpacity
          style={[styles.seletorBtn, abaMetrica === 'agua' && styles.seletorBtnAtivo]}
          onPress={() => { setAbaMetrica('agua'); setDiaSelecionado(null); }}
        >
          <Ionicons
            name="water"
            size={18}
            color={abaMetrica === 'agua' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.seletorTexto, abaMetrica === 'agua' && styles.seletorTextoAtivo]}>
            Água (ml)
          </Text>
          {dados.temAlerta && (
            <View style={styles.badgeMiniPonto} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.seletorBtn, abaMetrica === 'racao' && styles.seletorBtnAtivo]}
          onPress={() => { setAbaMetrica('racao'); setDiaSelecionado(null); }}
        >
          <Ionicons
            name="nutrition"
            size={18}
            color={abaMetrica === 'racao' ? '#6366F1' : '#64748B'}
          />
          <Text style={[styles.seletorTexto, abaMetrica === 'racao' && styles.seletorTextoAtivo]}>
            Ração (g)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gráfico de Barras com Linha de Baseline */}
      <View style={styles.graficoCard}>
        <View style={styles.graficoHeader}>
          <View>
            <Text style={styles.graficoTitulo}>
              {abaMetrica === 'agua' ? '💧 Ingestão Diária de Água' : '🍲 Consumo Diário de Ração'}
            </Text>
            <Text style={styles.graficoSub}>Últimos 7 dias comparados ao padrão</Text>
          </View>

          {/* Legenda do Baseline */}
          <View style={styles.legendaMeta}>
            <View style={styles.linhaMetaExemplo} />
            <Text style={styles.legendaMetaTexto}>Meta: {metaDiaria} {unidade}</Text>
          </View>
        </View>

        {/* Linhas e Barras */}
        <View style={styles.areaBarras}>
          {/* Linha Tracejada de Meta Normal */}
          <View
            style={[
              styles.linhaMetaAbsoluta,
              { bottom: `${(metaDiaria / valorMaximo) * 100}%` }
            ]}
          >
            <View style={styles.linhaMetaTracejada} />
          </View>

          {/* Colunas do Gráfico */}
          <View style={styles.colunasContainer}>
            {listaGrafico.map((item, index) => {
              const alturaPct = Math.max((item.valor / valorMaximo) * 100, 4);
              const ehCritico = item.status === 'critico';
              const ehAnomalia = item.status === 'anomalia';
              const ehAtencao = item.status === 'atencao';
              const isSelected = diaSelecionado === index;

              let barColor = '#10B981'; // Verde (normal)
              if (ehCritico) barColor = '#EF4444'; // Vermelho vivo
              else if (ehAnomalia) barColor = '#F97316'; // Laranja
              else if (ehAtencao) barColor = '#FBBF24'; // Amarelo

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.colunaItem}
                  onPress={() => setDiaSelecionado(index)}
                  activeOpacity={0.8}
                >
                  {/* Indicador de Alerta acima da barra */}
                  {(ehCritico || ehAnomalia) && (
                    <View style={styles.iconeAlertaBarra}>
                      <Ionicons
                        name={ehCritico ? 'alert-circle' : 'warning'}
                        size={14}
                        color={ehCritico ? '#EF4444' : '#F97316'}
                      />
                    </View>
                  )}

                  {/* Valor acima da barra */}
                  <Text style={[styles.valorBarra, ehCritico && styles.valorBarraCritico]}>
                    {item.valor}{unidade}
                  </Text>

                  {/* Barra Vertical */}
                  <View style={styles.trilhoBarra}>
                    <View
                      style={[
                        styles.barraPreenchida,
                        {
                          height: `${alturaPct}%`,
                          backgroundColor: barColor,
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: '#0F172A'
                        }
                      ]}
                    />
                  </View>

                  {/* Rótulo do Dia */}
                  <Text style={[styles.diaRotulo, isSelected && styles.diaRotuloAtivo]}>
                    {item.dia}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Detalhe do Dia Clicado no Gráfico */}
        {diaSelecionado !== null && (
          <View style={styles.detalheDiaCard}>
            <View style={styles.detalheDiaRow}>
              <Text style={styles.detalheDiaNome}>
                📅 {listaGrafico[diaSelecionado].dia}
              </Text>
              <Text style={styles.detalheDiaValor}>
                {listaGrafico[diaSelecionado].valor} {unidade} ({listaGrafico[diaSelecionado].vezes} vezes)
              </Text>
            </View>
            <Text style={styles.detalheDiaDesc}>
              {listaGrafico[diaSelecionado].desc ||
                (listaGrafico[diaSelecionado].status === 'normal'
                  ? 'Consumo perfeito dentro da média normal.'
                  : 'Desvio da rotina detectado.')}
            </Text>
          </View>
        )}
      </View>

      {/* Cards de Métricas Comparativas */}
      <View style={styles.metricasGrid}>
        <View style={styles.metricaCard}>
          <View style={styles.metricaIconeBox}>
            <Ionicons name="water-outline" size={20} color="#2563EB" />
          </View>
          <Text style={styles.metricaLabel}>Água Hoje</Text>
          <Text style={[styles.metricaValor, dados.temAlerta && styles.metricaValorPerigo]}>
            {dados.metricas.aguaHoje} ml
          </Text>
          <Text style={[styles.metricaDelta, dados.temAlerta ? styles.deltaQueda : styles.deltaNormal]}>
            {dados.metricas.quedaAguaPct}% vs padrão
          </Text>
        </View>

        <View style={styles.metricaCard}>
          <View style={styles.metricaIconeBox}>
            <Ionicons name="restaurant-outline" size={20} color="#6366F1" />
          </View>
          <Text style={styles.metricaLabel}>Ração Hoje</Text>
          <Text style={styles.metricaValor}>{dados.metricas.racaoHoje} g</Text>
          <Text style={styles.metricaSub}>Média: {dados.metricas.racaoMediaSemana}g/dia</Text>
        </View>

        <View style={styles.metricaCard}>
          <View style={styles.metricaIconeBox}>
            <Ionicons name="time-outline" size={20} color="#10B981" />
          </View>
          <Text style={styles.metricaLabel}>Visitas Hoje</Text>
          <Text style={styles.metricaValor}>{dados.metricas.visitasHoje}x</Text>
          <Text style={styles.metricaSub}>Esperado: {dados.metricas.visitasMedia}x/dia</Text>
        </View>
      </View>

      {/* Botão de Ver Linha do Tempo Completa */}
      <TouchableOpacity style={styles.btnTimelineCompleta} onPress={onVerTimeline}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnTimelineTexto}>Abrir Timeline Completa de Alimentação</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  petFoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#EEF2FF',
  },
  petInfo: {
    flex: 1,
    marginLeft: 14,
  },
  petNomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petNome: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  petDetalhes: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeCritico: {
    backgroundColor: '#FEE2E2',
  },
  badgeNormal: {
    backgroundColor: '#DCFCE7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCritico: {
    backgroundColor: '#EF4444',
  },
  dotNormal: {
    backgroundColor: '#16A34A',
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  textoCritico: {
    color: '#DC2626',
  },
  textoNormal: {
    color: '#16A34A',
  },
  simuladorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  simuladorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  simuladorTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  simuladorNome: {
    fontSize: 12,
    color: '#4338CA',
    flex: 1,
  },
  btnTrocarCenario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  btnTrocarTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  alertaCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertaTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertaUltimaVez: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  alertaMensagem: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 10,
  },
  alertaRiscoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  alertaRiscoTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  alertaRecomendacao: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
    marginBottom: 14,
  },
  btnAcaoAlerta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  btnAcaoTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  normalCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  normalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  normalTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  normalMensagem: {
    fontSize: 13,
    color: '#15803D',
    lineHeight: 18,
  },
  normalUltimaVez: {
    fontSize: 11,
    color: '#166534',
    marginTop: 6,
    fontWeight: '600',
  },
  seletorContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  seletorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  seletorBtnAtivo: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  seletorTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  seletorTextoAtivo: {
    color: '#0F172A',
    fontWeight: '700',
  },
  badgeMiniPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  graficoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  graficoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  graficoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  graficoSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  legendaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linhaMetaExemplo: {
    width: 14,
    height: 2,
    backgroundColor: '#94A3B8',
  },
  legendaMetaTexto: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  areaBarras: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  linhaMetaAbsoluta: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  linhaMetaTracejada: {
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  colunasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 2,
  },
  colunaItem: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  iconeAlertaBarra: {
    marginBottom: 2,
  },
  valorBarra: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  valorBarraCritico: {
    color: '#EF4444',
  },
  trilhoBarra: {
    width: 22,
    height: '75%',
    backgroundColor: '#F1F5F9',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barraPreenchida: {
    width: '100%',
    borderRadius: 11,
  },
  diaRotulo: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
  },
  diaRotuloAtivo: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  detalheDiaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detalheDiaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detalheDiaNome: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detalheDiaValor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  detalheDiaDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  metricasGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricaIconeBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricaValor: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  metricaValorPerigo: {
    color: '#EF4444',
  },
  metricaDelta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  deltaQueda: {
    color: '#EF4444',
  },
  deltaNormal: {
    color: '#10B981',
  },
  metricaSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 3,
  },
  btnTimelineCompleta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnTimelineTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
