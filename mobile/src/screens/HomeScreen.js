import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { calcularIdade } from '../utils/helpers';
import CatFormModal from '../components/CatFormModal';
import CatDetailsModal from '../components/CatDetailsModal';
import ReportsView from '../components/ReportsView';
import TimelineView from '../components/TimelineView';

function CatCardImage({ uri }) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={styles.cardImagePlaceholder}>
        <Ionicons name="paw" size={32} color="#6366F1" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.cardImage}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

export default function HomeScreen() {
  const { usuario, logout } = useAuth();
  
  // Abas de Navegação: 'pets' | 'relatorios' | 'timeline'
  const [abaAtiva, setAbaAtiva] = useState('pets');

  const [gatos, setGatos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Modais
  const [modalFormVisivel, setModalFormVisivel] = useState(false);
  const [gatoParaEditar, setGatoParaEditar] = useState(null);

  const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);
  const [gatoSelecionado, setGatoSelecionado] = useState(null);

  const carregarGatos = useCallback(async () => {
    try {
      const lista = await api.cats.list();
      setGatos(lista);
    } catch (err) {
      console.error('Erro ao carregar gatos:', err);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarGatos();
  }, [carregarGatos]);

  function handleNovoGato() {
    setGatoParaEditar(null);
    setModalFormVisivel(true);
  }

  function handleEditarGato(gato) {
    setModalDetalhesVisivel(false);
    setGatoParaEditar(gato);
    setModalFormVisivel(true);
  }

  function handleVerDetalhes(gato) {
    setGatoSelecionado(gato);
    setModalDetalhesVisivel(true);
  }

  async function handleExcluirGato(id) {
    try {
      await api.cats.delete(id);
      setModalDetalhesVisivel(false);
      setGatos(prev => prev.filter(g => g.id !== id));
      Alert.alert('Sucesso', 'Gato removido.');
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  }

  function handleLogout() {
    Alert.alert(
      'Sair da Conta',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout }
      ]
    );
  }

  function renderCatItem({ item }) {
    const ehMacho = item.sexo === 'Macho';

    return (
      <TouchableOpacity
        style={styles.catCard}
        onPress={() => handleVerDetalhes(item)}
        activeOpacity={0.85}
      >
        {/* Foto ou Avatar */}
        <CatCardImage uri={item.foto_url} />

        {/* Informações */}
        <View style={styles.cardInfo}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item.nome}</Text>
            <View style={[styles.miniBadge, ehMacho ? styles.maleBadge : styles.femaleBadge]}>
              <Ionicons name={ehMacho ? "male" : "female"} size={12} color={ehMacho ? "#2563EB" : "#DB2777"} />
            </View>
          </View>

          <Text style={styles.cardBreed} numberOfLines={1}>{item.raca || 'SRD'}</Text>

          <View style={styles.cardMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color="#64748B" />
              <Text style={styles.metaText}>{calcularIdade(item.data_nascimento)}</Text>
            </View>

            {item.peso_atual ? (
              <View style={[styles.metaItem, { marginLeft: 10 }]}>
                <Ionicons name="scale-outline" size={13} color="#64748B" />
                <Text style={styles.metaText}>{item.peso_atual} kg</Text>
              </View>
            ) : null}
          </View>

          {item.castrado && (
            <View style={styles.castradoTag}>
              <Text style={styles.castradoTexto}>Castrado</Text>
            </View>
          )}

          {/* Destaque de Anomalia de Saúde (Alerta do Mingau) */}
          {item.nome.toLowerCase().includes('mingau') && (
            <TouchableOpacity
              style={styles.alertaCardBadge}
              onPress={() => setAbaAtiva('relatorios')}
            >
              <Ionicons name="warning" size={12} color="#DC2626" />
              <Text style={styles.alertaCardTexto}>🚨 48h sem beber água • Ver Relatório</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seta */}
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={styles.arrowIcon} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Visualização de Meus Pets */}
      {abaAtiva === 'pets' && (
        <View style={{ flex: 1 }}>
          {/* Topo / Header */}
          <View style={styles.topBar}>
            <View style={styles.userInfo}>
              <Text style={styles.saudacao}>Olá, {usuario?.nome?.split(' ')[0] || 'Tutor'}! 👋</Text>
              <Text style={styles.subSaudacao}>Gerenciamento de Pets & Alimentador</Text>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Banner / Card do Alimentador Felis */}
          <View style={styles.alimentadorBanner}>
            <View style={styles.alimentadorIconBox}>
              <Ionicons name="hardware-chip-outline" size={24} color="#6366F1" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alimentadorTitulo}>Alimentador Felis Ativo</Text>
              <Text style={styles.alimentadorSub}>ESP32-CAM monitorando ração e água</Text>
            </View>
            <TouchableOpacity
              style={styles.onlinePill}
              onPress={() => setAbaAtiva('relatorios')}
            >
              <View style={styles.greenDot} />
              <Text style={styles.onlineTexto}>Online</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de Título da Lista com Botão + */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Meus Gatinhos ({gatos.length})
            </Text>

            <TouchableOpacity style={styles.addBtn} onPress={handleNovoGato}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnTexto}>Novo Gato</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Gatos */}
          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingTexto}>Buscando gatinhos...</Text>
            </View>
          ) : (
            <FlatList
              data={gatos}
              keyExtractor={item => String(item.id)}
              renderItem={renderCatItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={atualizando}
                  onRefresh={() => {
                    setAtualizando(true);
                    carregarGatos();
                  }}
                  colors={['#6366F1']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="paw" size={48} color="#C7D2FE" />
                  </View>
                  <Text style={styles.emptyTitulo}>Nenhum gatinho cadastrado</Text>
                  <Text style={styles.emptySub}>
                    Toque no botão "Novo Gato" acima para cadastrar seu primeiro gatinho com foto!
                  </Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={handleNovoGato}>
                    <Text style={styles.emptyBtnTexto}>Cadastrar Primeiro Gato</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* Visualização de Relatórios & Anomalias */}
      {abaAtiva === 'relatorios' && (
        <View style={{ flex: 1 }}>
          <View style={styles.topBarAbas}>
            <Text style={styles.tituloAba}>📊 Relatórios & IA</Text>
            <TouchableOpacity
              style={styles.btnTrocarPetTopo}
              onPress={() => setAbaAtiva('pets')}
            >
              <Ionicons name="paw-outline" size={14} color="#6366F1" />
              <Text style={styles.btnTrocarPetTexto}>Meus Pets</Text>
            </TouchableOpacity>
          </View>
          <ReportsView onVerTimeline={() => setAbaAtiva('timeline')} />
        </View>
      )}

      {/* Visualização de Timeline */}
      {abaAtiva === 'timeline' && (
        <View style={{ flex: 1 }}>
          <TimelineView onVoltarRelatorios={() => setAbaAtiva('relatorios')} />
        </View>
      )}

      {/* Barra de Navegação Inferior (Bottom Tabs) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, abaAtiva === 'pets' && styles.tabItemAtivo]}
          onPress={() => setAbaAtiva('pets')}
        >
          <Ionicons
            name={abaAtiva === 'pets' ? 'paw' : 'paw-outline'}
            size={22}
            color={abaAtiva === 'pets' ? '#6366F1' : '#94A3B8'}
          />
          <Text style={[styles.tabTexto, abaAtiva === 'pets' && styles.tabTextoAtivo]}>
            Meus Pets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, abaAtiva === 'relatorios' && styles.tabItemAtivo]}
          onPress={() => setAbaAtiva('relatorios')}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons
              name={abaAtiva === 'relatorios' ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={abaAtiva === 'relatorios' ? '#6366F1' : '#94A3B8'}
            />
            {/* Badge de Alerta com Exclamação */}
            <View style={styles.tabBadgeAlerta}>
              <Text style={styles.tabBadgeTexto}>!</Text>
            </View>
          </View>
          <Text style={[styles.tabTexto, abaAtiva === 'relatorios' && styles.tabTextoAtivo]}>
            Relatórios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, abaAtiva === 'timeline' && styles.tabItemAtivo]}
          onPress={() => setAbaAtiva('timeline')}
        >
          <Ionicons
            name={abaAtiva === 'timeline' ? 'time' : 'time-outline'}
            size={22}
            color={abaAtiva === 'timeline' ? '#6366F1' : '#94A3B8'}
          />
          <Text style={[styles.tabTexto, abaAtiva === 'timeline' && styles.tabTextoAtivo]}>
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modais */}
      <CatFormModal
        visivel={modalFormVisivel}
        onClose={() => setModalFormVisivel(false)}
        onSalvo={carregarGatos}
        gatoEdicao={gatoParaEditar}
      />

      <CatDetailsModal
        visivel={modalDetalhesVisivel}
        gato={gatoSelecionado}
        onClose={() => setModalDetalhesVisivel(false)}
        onEditar={handleEditarGato}
        onExcluir={handleExcluirGato}
        onAbrirRelatorio={() => setAbaAtiva('relatorios')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  saudacao: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subSaudacao: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alimentadorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 20,
  },
  alimentadorIconBox: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alimentadorTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#312E81',
  },
  alimentadorSub: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 2,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  onlineTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#EEF2FF',
  },
  cardImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  miniBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maleBadge: {
    backgroundColor: '#DBEAFE',
  },
  femaleBadge: {
    backgroundColor: '#FCE7F3',
  },
  cardBreed: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  castradoTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  castradoTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  arrowIcon: {
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTexto: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  emptyBtnTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  alertaCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  alertaCardTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  topBarAbas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tituloAba: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnTrocarPetTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  btnTrocarPetTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 22,
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabItemAtivo: {
    transform: [{ scale: 1.05 }],
  },
  tabTexto: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabTextoAtivo: {
    color: '#6366F1',
    fontWeight: '700',
  },
  tabBadgeAlerta: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
