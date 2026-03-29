import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

interface LoginData { email: string; password: string }
interface SignupData { email: string; password: string; company_name: string; country: string }

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (res) => {
      const { access_token, refresh_token, user: userData } = res.data.data;
      login(userData as User, access_token, refresh_token);
      const role = (userData as User).role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'MANAGER') navigate('/manager');
      else navigate('/employee');
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupData) => authApi.signup(data),
    onSuccess: (res) => {
      const { access_token, refresh_token, user: userData } = res.data.data;
      login(userData as User, access_token, refresh_token);
      navigate('/admin');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      const token = useAuthStore.getState().refresh_token;
      return authApi.logout(token || '');
    },
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutate,
    signupError: signupMutation.error,
    isSigningUp: signupMutation.isPending,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
