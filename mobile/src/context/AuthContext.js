import React, { createContext, useState, useEffect, useContext } from 'react';
import { api, storage } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega usuário salvo ao abrir o app
  useEffect(() => {
    async function carregarSessao() {
      try {
        const token = await storage.getToken();
        const userSalvo = await storage.getUser();

        if (token && userSalvo) {
          setUsuario(userSalvo);
          // Atualiza dados do usuário em background
          api.auth.getMe()
            .then(u => {
              setUsuario(u);
              storage.setUser(u);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Erro ao recuperar sessão:', err);
      } finally {
        setCarregando(false);
      }
    }

    carregarSessao();
  }, []);

  async function login(email, senha) {
    const data = await api.auth.login(email, senha);
    await storage.setToken(data.token);
    await storage.setUser(data.usuario);
    setUsuario(data.usuario);
    return data;
  }

  async function register(nome, email, senha) {
    const data = await api.auth.register(nome, email, senha);
    await storage.setToken(data.token);
    await storage.setUser(data.usuario);
    setUsuario(data.usuario);
    return data;
  }

  async function logout() {
    await storage.removeToken();
    await storage.removeUser();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, register, logout, logado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
