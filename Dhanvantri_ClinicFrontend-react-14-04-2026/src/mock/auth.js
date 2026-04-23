import { login as mockLogin, logout as mockLogout, getCurrentUser as mockCurrentUser } from "./api";

export const login = (email, password) => mockLogin(email, password);

export const logout = () => {
  mockLogout();
};

export const getCurrentUser = () => {
  return mockCurrentUser();
};

