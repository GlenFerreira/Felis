import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// URL base da API
// Em desenvolvimento com celular na mesma rede Wi-Fi ou emulador, use o IP da sua máquina:
export const API_BASE_URL = 'http://192.168.0.16:5000/api';

const TOKEN_KEY = 'felis_token';
const USER_KEY = 'felis_user';

// Fallback de memória para casos onde SecureStore ou localStorage não estejam disponíveis
const memoryStorage = new Map();

async function setItem(key, value) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } else {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (e) {
    console.warn(`[Storage] Fallback em memória para salvar ${key}:`, e.message);
  }
  memoryStorage.set(key, value);
}

async function getItem(key) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (e) {
    console.warn(`[Storage] Fallback em memória para ler ${key}:`, e.message);
  }
  return memoryStorage.get(key) || null;
}

async function removeItem(key) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } else {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch (e) {
    console.warn(`[Storage] Fallback em memória para remover ${key}:`, e.message);
  }
  memoryStorage.delete(key);
}

export const storage = {
  async getToken() {
    return await getItem(TOKEN_KEY);
  },
  async setToken(token) {
    await setItem(TOKEN_KEY, token);
  },
  async removeToken() {
    await removeItem(TOKEN_KEY);
  },
  async getUser() {
    const data = await getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  async setUser(user) {
    await setItem(USER_KEY, JSON.stringify(user));
  },
  async removeUser() {
    await removeItem(USER_KEY);
  }
};

async function request(endpoint, options = {}) {
  const token = await storage.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || `Erro na requisição (${response.status})`);
  }

  return data;
}

export const api = {
  // Autenticação
  auth: {
    async register(nome, email, senha) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha })
      });
    },
    async login(email, senha) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
    },
    async getMe() {
      return request('/auth/me');
    }
  },

  // Gatos
  cats: {
    async list() {
      return request('/cats');
    },
    async create(catData) {
      return request('/cats', {
        method: 'POST',
        body: JSON.stringify(catData)
      });
    },
    async update(id, catData) {
      return request(`/cats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(catData)
      });
    },
    async delete(id) {
      return request(`/cats/${id}`, {
        method: 'DELETE'
      });
    },
    // Upload de Foto para o MinIO via Backend
    async uploadPhoto(imageUri, base64 = null, mimeType = null) {
      const token = await storage.getToken();

      // Se temos o base64 (gerado nativamente pelo ImagePicker do Expo),
      // enviamos diretamente via JSON. Isso é 100% à prova de falhas no iOS e evita o erro
      // "Unsupported FormDataPart implementation" da New Architecture do React Native/Expo SDK 58.
      if (base64) {
        return request('/upload-foto', {
          method: 'POST',
          body: JSON.stringify({
            foto_base64: base64,
            mime_type: mimeType || 'image/jpeg'
          })
        }).then(data => data.foto_url);
      }

      // Fallback usando Blob compatível com o novo expo/fetch
      try {
        const fileResponse = await fetch(imageUri);
        const blob = await fileResponse.blob();
        const filename = imageUri.split('/').pop() || 'foto_gato.jpg';

        const formData = new FormData();
        formData.append('foto', blob, filename);

        const response = await fetch(`${API_BASE_URL}/upload-foto`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: formData
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.erro || 'Falha ao enviar foto');
        }

        return data.foto_url;
      } catch (blobError) {
        throw new Error('Falha no upload da foto: ' + blobError.message);
      }
    }
  },

  // Eventos do Alimentador
  feedEvents: {
    async list() {
      return request('/feed-events');
    }
  }
};
