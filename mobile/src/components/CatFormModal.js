import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { calcularIdade } from '../utils/helpers';

export default function CatFormModal({ visivel, onClose, onSalvo, gatoEdicao = null }) {
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState('Macho');
  const [dataNascimento, setDataNascimento] = useState('');
  const [pesoAtual, setPesoAtual] = useState('');
  const [raca, setRaca] = useState('');
  const [cor, setCor] = useState('');
  const [castrado, setCastrado] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [fotoUrl, setFotoUrl] = useState(null);
  
  const [fotoLocalUri, setFotoLocalUri] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (gatoEdicao) {
      setNome(gatoEdicao.nome || '');
      setSexo(gatoEdicao.sexo || 'Macho');
      setDataNascimento(gatoEdicao.data_nascimento || '');
      setPesoAtual(gatoEdicao.peso_atual ? String(gatoEdicao.peso_atual) : '');
      setRaca(gatoEdicao.raca || '');
      setCor(gatoEdicao.cor || '');
      setCastrado(gatoEdicao.castrado || false);
      setObservacoes(gatoEdicao.observacoes || '');
      setFotoUrl(gatoEdicao.foto_url || null);
      setFotoLocalUri(null);
    } else {
      limparCampos();
    }
  }, [gatoEdicao, visivel]);

  function limparCampos() {
    setNome('');
    setSexo('Macho');
    setDataNascimento('');
    setPesoAtual('');
    setRaca('SRD (Sem Raça Definida)');
    setCor('');
    setCastrado(false);
    setObservacoes('');
    setFotoUrl(null);
    setFotoLocalUri(null);
  }

  // Selecionar foto da Galeria ou Câmera
  async function escolherFoto(daCamera = false) {
    try {
      let resultado;
      if (daCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do gato.');
          return;
        }
        resultado = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Permita o acesso às suas fotos para escolher uma foto.');
          return;
        }
        resultado = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
      }

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        const asset = resultado.assets[0];
        setFotoLocalUri(asset.uri);

        // Faz o upload direto para a VPS no MinIO
        setEnviandoFoto(true);
        try {
          const urlPublicaMinio = await api.cats.uploadPhoto(asset.uri, asset.base64, asset.mimeType);
          setFotoUrl(urlPublicaMinio);
          Alert.alert('Sucesso!', 'Foto enviada para o MinIO com sucesso!');
        } catch (err) {
          Alert.alert('Aviso', 'Não foi possível subir a foto para o MinIO: ' + err.message);
        } finally {
          setEnviandoFoto(false);
        }
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao selecionar imagem: ' + e.message);
    }
  }

  function abrirOpcoesFoto() {
    Alert.alert(
      'Foto do Gatinho',
      'Como deseja adicionar a foto?',
      [
        { text: 'Tirar Foto com a Câmera', onPress: () => escolherFoto(true) },
        { text: 'Escolher da Galeria', onPress: () => escolherFoto(false) },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do gato é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        nome: nome.trim(),
        sexo,
        data_nascimento: dataNascimento.trim() || null,
        peso_atual: pesoAtual ? parseFloat(pesoAtual.replace(',', '.')) : null,
        raca: raca.trim() || 'SRD',
        cor: cor.trim(),
        castrado,
        foto_url: fotoUrl,
        observacoes: observacoes.trim()
      };

      if (gatoEdicao) {
        await api.cats.update(gatoEdicao.id, dados);
        Alert.alert('Sucesso', `Informações de ${nome} atualizadas!`);
      } else {
        await api.cats.create(dados);
        Alert.alert('Sucesso', `Gatinho ${nome} cadastrado com sucesso!`);
      }

      onSalvo();
      onClose();
    } catch (err) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>
            {gatoEdicao ? 'Editar Gato' : 'Novo Gatinho'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Seção da Foto */}
          <View style={styles.fotoContainer}>
            <TouchableOpacity onPress={abrirOpcoesFoto} style={styles.fotoWrapper} disabled={enviandoFoto}>
              {fotoLocalUri || fotoUrl ? (
                <Image source={{ uri: fotoLocalUri || fotoUrl }} style={styles.foto} />
              ) : (
                <View style={styles.fotoPlaceholder}>
                  <Ionicons name="camera" size={36} color="#6366F1" />
                  <Text style={styles.textoAddFoto}>Adicionar Foto</Text>
                </View>
              )}

              {enviandoFoto && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                  <Text style={styles.textoEnviando}>Enviando MinIO...</Text>
                </View>
              )}

              <View style={styles.badgeCamera}>
                <Ionicons name="camera-reverse" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.dicaFoto}>Toque para tirar foto ou escolher da galeria</Text>
          </View>

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Gato *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Mingau, Luna, Oliver..."
              placeholderTextColor="#94A3B8"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />
          </View>

          {/* Sexo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.sexoContainer}>
              <TouchableOpacity
                style={[styles.sexoBtn, sexo === 'Macho' && styles.sexoBtnAtivoMacho]}
                onPress={() => setSexo('Macho')}
              >
                <Ionicons name="male" size={18} color={sexo === 'Macho' ? '#FFFFFF' : '#3B82F6'} />
                <Text style={[styles.sexoBtnTexto, sexo === 'Macho' && styles.sexoBtnTextoAtivo]}>
                  Macho
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sexoBtn, sexo === 'Fêmea' && styles.sexoBtnAtivoFemea]}
                onPress={() => setSexo('Fêmea')}
              >
                <Ionicons name="female" size={18} color={sexo === 'Fêmea' ? '#FFFFFF' : '#EC4899'} />
                <Text style={[styles.sexoBtnTexto, sexo === 'Fêmea' && styles.sexoBtnTextoAtivo]}>
                  Fêmea
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Data de Nascimento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2023-05-15"
              placeholderTextColor="#94A3B8"
              value={dataNascimento}
              onChangeText={setDataNascimento}
              keyboardType="numbers-and-punctuation"
            />
            {dataNascimento.length === 10 && (
              <Text style={styles.calculoIdade}>
                🐱 Idade calculada: <Text style={{ fontWeight: '700' }}>{calcularIdade(dataNascimento)}</Text>
              </Text>
            )}
          </View>

          {/* Raça e Peso (Lado a Lado) */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Raça</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: SRD, Siamês..."
                placeholderTextColor="#94A3B8"
                value={raca}
                onChangeText={setRaca}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Peso Atual (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 4.5"
                placeholderTextColor="#94A3B8"
                value={pesoAtual}
                onChangeText={setPesoAtual}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Cor da Pelagem */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cor da Pelagem</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Laranja com branco, Preto, Cinza..."
              placeholderTextColor="#94A3B8"
              value={cor}
              onChangeText={setCor}
            />
          </View>

          {/* Castrado */}
          <View style={styles.switchGroup}>
            <View>
              <Text style={styles.switchLabel}>Gato Castrado?</Text>
              <Text style={styles.switchDesc}>Indica se o pet já passou pelo procedimento</Text>
            </View>
            <Switch
              value={castrado}
              onValueChange={setCastrado}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={castrado ? '#6366F1' : '#F8FAFC'}
            />
          </View>

          {/* Observações */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações / Cuidados</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Alergias, hábitos, temperamento, vacinas..."
              placeholderTextColor="#94A3B8"
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.salvarBtn, (salvando || enviandoFoto) && styles.btnDesativado]}
            onPress={handleSalvar}
            disabled={salvando || enviandoFoto}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.salvarBtnTexto}>
                {gatoEdicao ? 'Salvar Alterações' : 'Cadastrar Gatinho'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 8,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  fotoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  foto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  fotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoAddFoto: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoEnviando: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  badgeCamera: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dicaFoto: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  sexoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sexoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  sexoBtnAtivoMacho: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sexoBtnAtivoFemea: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  sexoBtnTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  sexoBtnTextoAtivo: {
    color: '#FFFFFF',
  },
  calculoIdade: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  switchDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  salvarBtn: {
    backgroundColor: '#6366F1',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDesativado: {
    opacity: 0.6,
  },
  salvarBtnTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
