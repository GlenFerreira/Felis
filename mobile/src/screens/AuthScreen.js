import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, register } = useAuth();
  
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !senha.trim() || (modoCadastro && !nome.trim())) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setCarregando(true);
    try {
      if (modoCadastro) {
        await register(nome.trim(), email.trim(), senha);
      } else {
        await login(email.trim(), senha);
      }
    } catch (err) {
      Alert.alert('Erro', err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="paw" size={44} color="#6366F1" />
          </View>
          <Text style={styles.titulo}>Felis Pet</Text>
          <Text style={styles.subtitulo}>
            {modoCadastro ? 'Crie sua conta para cuidar do seu gato' : 'Bem-vindo de volta! Acesse sua conta'}
          </Text>
        </View>

        {/* Card do Formulário */}
        <View style={styles.card}>
          {modoCadastro && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seu Nome</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Glen Ferreira"
                  placeholderTextColor="#9CA3AF"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{modoCadastro ? 'E-mail' : 'E-mail ou Usuário'}</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={modoCadastro ? "seuemail@exemplo.com" : "Ex: user ou seu e-mail"}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua senha secreta"
                placeholderTextColor="#9CA3AF"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.eyeBtn}>
                <Ionicons name={mostrarSenha ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão Principal */}
          <TouchableOpacity
            style={[styles.botaoPrincipal, carregando && styles.botaoDesativado]}
            onPress={handleSubmit}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBotaoPrincipal}>
                {modoCadastro ? 'Cadastrar e Começar' : 'Entrar no Aplicativo'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Alternar Modo (Login / Cadastro) */}
          <View style={styles.trocaModoContainer}>
            <Text style={styles.textoTrocaModo}>
              {modoCadastro ? 'Já possui uma conta?' : 'Ainda não tem conta?'}
            </Text>
            <TouchableOpacity onPress={() => setModoCadastro(!modoCadastro)}>
              <Text style={styles.linkTrocaModo}>
                {modoCadastro ? ' Fazer Login' : ' Cadastre-se'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rodapé Informativo */}
        <View style={styles.footer}>
          <Text style={styles.textoFooter}>Felis • Monitoramento Inteligente & VPS</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  botaoPrincipal: {
    backgroundColor: '#6366F1',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  botaoDesativado: {
    opacity: 0.7,
  },
  textoBotaoPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  trocaModoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  textoTrocaModo: {
    fontSize: 14,
    color: '#64748B',
  },
  linkTrocaModo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  textoFooter: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
