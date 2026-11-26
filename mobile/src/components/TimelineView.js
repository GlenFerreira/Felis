import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MINGAU_BASE_INFO,
  DADOS_CENARIO_ANOMALIA
} from '../data/mockFeedData';

export default function TimelineView({ onVoltarRelatorios }) {
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'agua' | 'racao' | 'anomalia'
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  const eventos = DADOS_CENARIO_ANOMALIA.timeline.filter(e => {
    if (filtro === 'todos') return true;
    if (filtro === 'agua') return e.tipo === 'agua';
    if (filtro === 'racao') return e.tipo === 'racao';
    if (filtro === 'anomalia') return e.status === 'anomalia' || e.status === 'critico';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Topo: Barra com Voltar e Título */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnVoltar} onPress={onVoltarRelatorios}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitulo}>Timeline de Alimentação</Text>
          <Text style={styles.headerSub}>Histórico detalhado do {MINGAU_BASE_INFO.nome}</Text>
        </View>
        <Image source={{ uri: MINGAU_BASE_INFO.foto_url }} style={styles.miniAvatar} />
      </View>

      {/* Filtros em Pílulas */}
      <View style={styles.filtrosRow}>
        <TouchableOpacity
          style={[styles.filtroPill, filtro === 'todos' && styles.filtroPillAtivo]}
          onPress={() => setFiltro('todos')}
        >
          <Text style={[styles.filtroTexto, filtro === 'todos' && styles.filtroTextoAtivo]}>
            Todos ({DADOS_CENARIO_ANOMALIA.timeline.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroPill, filtro === 'agua' && styles.filtroPillAtivo]}
          onPress={() => setFiltro('agua')}
        >
          <Ionicons name="water" size={12} color={filtro === 'agua' ? '#FFFFFF' : '#2563EB'} />
          <Text style={[styles.filtroTexto, filtro === 'agua' && styles.filtroTextoAtivo]}>
            Água
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroPill, filtro === 'racao' && styles.filtroPillAtivo]}
          onPress={() => setFiltro('racao')}
        >
          <Ionicons name="nutrition" size={12} color={filtro === 'racao' ? '#FFFFFF' : '#6366F1'} />
          <Text style={[styles.filtroTexto, filtro === 'racao' && styles.filtroTextoAtivo]}>
            Ração
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroPill, filtro === 'anomalia' && styles.filtroPillAtivoAlerta]}
          onPress={() => setFiltro('anomalia')}
        >
          <Ionicons name="warning" size={12} color={filtro === 'anomalia' ? '#FFFFFF' : '#EF4444'} />
          <Text style={[styles.filtroTexto, filtro === 'anomalia' && styles.filtroTextoAtivo]}>
            Anomalias ⚠️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista da Linha do Tempo */}
      <ScrollView contentContainerStyle={styles.timelineContent}>
        {eventos.map((item, index) => {
          const ehUltimo = index === eventos.length - 1;
          const ehCritico = item.status === 'critico';
          const ehAnomalia = item.status === 'anomalia';
          const ehAgua = item.tipo === 'agua';
          const ehRacao = item.tipo === 'racao';

          let iconeNome = 'nutrition';
          let iconeCor = '#6366F1';
          let nodeBg = '#EEF2FF';

          if (ehAgua) {
            iconeNome = 'water';
            iconeCor = '#2563EB';
            nodeBg = '#DBEAFE';
          } else if (ehCritico || ehAnomalia) {
            iconeNome = 'warning';
            iconeCor = '#EF4444';
            nodeBg = '#FEE2E2';
          }

          return (
            <View key={item.id} style={styles.timelineItem}>
              {/* Coluna da Linha e Nó */}
              <View style={styles.nodeColumn}>
                <View style={[styles.nodeCircle, { backgroundColor: nodeBg }]}>
                  <Ionicons name={iconeNome} size={16} color={iconeCor} />
                </View>
                {!ehUltimo && <View style={styles.verticalLine} />}
              </View>

              {/* Card do Evento */}
              <TouchableOpacity
                style={[
                  styles.eventCard,
                  ehCritico && styles.eventCardCritico,
                  ehAnomalia && styles.eventCardAnomalia
                ]}
                onPress={() => setEventoSelecionado(item)}
                activeOpacity={0.85}
              >
                <View style={styles.eventCardTop}>
                  <Text style={[styles.eventTitulo, (ehCritico || ehAnomalia) && styles.eventTituloAlerta]}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.eventHorario}>{item.horario}</Text>
                </View>

                {/* Métricas do Evento: Quantidade & Duração */}
                <View style={styles.eventMetricasRow}>
                  <View style={styles.eventBadgeQtd}>
                    <Text style={styles.eventQtdTexto}>{item.quantidade}</Text>
                  </View>

                  <View style={styles.eventBadgeDuracao}>
                    <Ionicons name="stopwatch-outline" size={12} color="#64748B" />
                    <Text style={styles.eventDuracaoTexto}>{item.duracao}</Text>
                  </View>

                  <View style={[styles.eventStatusBadge, ehCritico ? styles.statusBadgeCritico : styles.statusBadgeNormal]}>
                    <Text style={[styles.eventStatusTexto, ehCritico ? styles.statusTextoCritico : styles.statusTextoNormal]}>
                      {item.statusTexto}
                    </Text>
                  </View>
                </View>

                {/* Miniatura da Foto Capturada pelo ESP32-CAM */}
                {item.foto && (
                  <View style={styles.fotoThumbBox}>
                    <Image source={{ uri: item.foto }} style={styles.fotoThumb} resizeMode="cover" />
                    <View style={styles.fotoOverlayBadge}>
                      <Ionicons name="camera" size={11} color="#FFFFFF" />
                      <Text style={styles.fotoOverlayTexto}>Foto ESP32-CAM</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal de Detalhes do Evento & Foto Ampliada */}
      {eventoSelecionado && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>{eventoSelecionado.titulo}</Text>
                <TouchableOpacity onPress={() => setEventoSelecionado(null)} style={styles.btnFecharModal}>
                  <Ionicons name="close" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalHorario}>{eventoSelecionado.horario}</Text>

              {/* Foto Ampliada */}
              {eventoSelecionado.foto ? (
                <View style={styles.modalFotoContainer}>
                  <Image source={{ uri: eventoSelecionado.foto }} style={styles.modalFoto} resizeMode="cover" />
                  <View style={styles.modalFotoBadge}>
                    <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
                    <Text style={styles.modalFotoBadgeTexto}>Captura Automática HX711 + Câmera</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.modalSemFoto}>
                  <Ionicons name="alert-circle" size={40} color="#EF4444" />
                  <Text style={styles.modalSemFotoTexto}>Nenhum registro fotográfico (evento não disparado)</Text>
                </View>
              )}

              {/* Informações Técnicas */}
              <View style={styles.modalGrid}>
                <View style={styles.modalGridItem}>
                  <Text style={styles.modalGridLabel}>Consumo</Text>
                  <Text style={styles.modalGridValor}>{eventoSelecionado.quantidade}</Text>
                </View>
                <View style={styles.modalGridItem}>
                  <Text style={styles.modalGridLabel}>Tempo no Comedouro</Text>
                  <Text style={styles.modalGridValor}>{eventoSelecionado.duracao}</Text>
                </View>
                <View style={styles.modalGridItem}>
                  <Text style={styles.modalGridLabel}>Status da IA</Text>
                  <Text style={styles.modalGridValor}>{eventoSelecionado.statusTexto}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.btnFecharModalBottom}
                onPress={() => setEventoSelecionado(null)}
              >
                <Text style={styles.btnFecharTexto}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  btnVoltar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  filtroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  filtroPillAtivo: {
    backgroundColor: '#6366F1',
  },
  filtroPillAtivoAlerta: {
    backgroundColor: '#EF4444',
  },
  filtroTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filtroTextoAtivo: {
    color: '#FFFFFF',
  },
  timelineContent: {
    padding: 16,
    paddingBottom: 50,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  nodeColumn: {
    width: 32,
    alignItems: 'center',
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: -8,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginLeft: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  eventCardCritico: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  eventCardAnomalia: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  eventCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventTituloAlerta: {
    color: '#991B1B',
  },
  eventHorario: {
    fontSize: 10,
    color: '#94A3B8',
  },
  eventMetricasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  eventBadgeQtd: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventQtdTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  eventBadgeDuracao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  eventDuracaoTexto: {
    fontSize: 10,
    color: '#64748B',
  },
  eventStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeNormal: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeCritico: {
    backgroundColor: '#FEE2E2',
  },
  eventStatusTexto: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextoNormal: {
    color: '#15803D',
  },
  statusTextoCritico: {
    color: '#B91C1C',
  },
  fotoThumbBox: {
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 4,
  },
  fotoThumb: {
    width: '100%',
    height: '100%',
  },
  fotoOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  fotoOverlayTexto: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnFecharModal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHorario: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  modalFotoContainer: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  modalFoto: {
    width: '100%',
    height: '100%',
  },
  modalFotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  modalFotoBadgeTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalSemFoto: {
    height: 120,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    padding: 10,
  },
  modalSemFotoTexto: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  modalGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalGridItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalGridLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  modalGridValor: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  btnFecharModalBottom: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnFecharTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
