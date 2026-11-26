import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calcularIdade, formatarDataBr } from '../utils/helpers';

export default function CatDetailsModal({ gato, visivel, onClose, onEditar, onExcluir, onAbrirRelatorio }) {
  if (!gato) return null;

  function confirmarExclusao() {
    Alert.alert(
      'Remover Gatinho',
      `Tem certeza que deseja remover ${gato.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onExcluir(gato.id) }
      ]
    );
  }

  const ehMacho = gato.sexo === 'Macho';
  const [imagemErro, setImagemErro] = useState(false);

  return (
    <Modal visible={visivel} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Foto Topo */}
        <View style={styles.imageHeader}>
          {gato.foto_url && !imagemErro ? (
            <Image
              source={{ uri: gato.foto_url }}
              style={styles.imageBanner}
              resizeMode="cover"
              onError={() => setImagemErro(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="paw" size={80} color="#C7D2FE" />
            </View>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.actionHeaderBtns}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => onEditar(gato)}>
              <Ionicons name="pencil" size={18} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleBtn, { marginLeft: 8 }]} onPress={confirmarExclusao}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Conteúdo com Scroll */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Título e Badge */}
          <View style={styles.nameSection}>
            <View>
              <Text style={styles.catName}>{gato.nome}</Text>
              <Text style={styles.catBreed}>{gato.raca || 'SRD (Sem Raça Definida)'}</Text>
            </View>

            <View style={[styles.genderBadge, ehMacho ? styles.maleBadge : styles.femaleBadge]}>
              <Ionicons name={ehMacho ? "male" : "female"} size={16} color={ehMacho ? "#2563EB" : "#DB2777"} />
              <Text style={[styles.genderText, ehMacho ? styles.maleText : styles.femaleText]}>
                {gato.sexo}
              </Text>
            </View>
          </View>

          {/* Cards de Métricas Rápidas */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Ionicons name="calendar-outline" size={22} color="#6366F1" />
              <Text style={styles.metricLabel}>Idade</Text>
              <Text style={styles.metricValue}>{calcularIdade(gato.data_nascimento)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Ionicons name="scale-outline" size={22} color="#10B981" />
              <Text style={styles.metricLabel}>Peso</Text>
              <Text style={styles.metricValue}>
                {gato.peso_atual ? `${gato.peso_atual} kg` : 'N/I'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Ionicons name="medkit-outline" size={22} color="#F59E0B" />
              <Text style={styles.metricLabel}>Castrado</Text>
              <Text style={styles.metricValue}>
                {gato.castrado ? 'Sim ✅' : 'Não ❌'}
              </Text>
            </View>
          </View>

          {/* Seção de Detalhes Adicionais */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Informações Gerais</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Nascimento:</Text>
              <Text style={styles.infoVal}>{formatarDataBr(gato.data_nascimento)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Cor da Pelagem:</Text>
              <Text style={styles.infoVal}>{gato.cor || 'Não informada'}</Text>
            </View>

            {gato.foto_url && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Armazenamento:</Text>
                  <Text style={[styles.infoVal, { color: '#6366F1' }]}>MinIO VPS (Bucket Felis)</Text>
                </View>
              </>
            )}
          </View>

          {/* Observações */}
          {gato.observacoes ? (
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Observações e Cuidados</Text>
              <Text style={styles.observacoesTexto}>{gato.observacoes}</Text>
            </View>
          ) : null}

          {/* Botão de Acesso Direto aos Relatórios de Saúde & Timeline */}
          <TouchableOpacity
            style={styles.btnRelatorioModal}
            onPress={() => {
              onClose();
              if (onAbrirRelatorio) onAbrirRelatorio();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="stats-chart" size={18} color="#FFFFFF" />
            <Text style={styles.btnRelatorioModalTexto}>
              Ver Relatório de Saúde & Timeline
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  imageHeader: {
    width: '100%',
    height: 300,
    backgroundColor: '#EEF2FF',
    position: 'relative',
  },
  imageBanner: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionHeaderBtns: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
  },
  circleBtn: {
    backgroundColor: '#FFFFFF',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  nameSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  catName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  catBreed: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 2,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  maleBadge: {
    backgroundColor: '#DBEAFE',
  },
  femaleBadge: {
    backgroundColor: '#FCE7F3',
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  maleText: {
    color: '#2563EB',
  },
  femaleText: {
    color: '#DB2777',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
    textAlign: 'center',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoKey: {
    fontSize: 14,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  observacoesTexto: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  btnRelatorioModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnRelatorioModalTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
