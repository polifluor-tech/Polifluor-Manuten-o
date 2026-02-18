
import React, { useState } from 'react';
import { ShieldCheckIcon, ArrowRightIcon, UsersIcon } from '../components/icons';
import { UserRole, User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

// Logo Polifluor reutilizável (CSS puro)
const PolifluorLogoLarge = () => (
    <div className="flex items-center justify-center mb-8">
        <div className="bg-[#D32F2F] text-white px-6 py-2 skew-x-[-10deg] shadow-lg">
            <span className="font-black italic text-3xl tracking-tighter skew-x-[10deg] block">POLIFLUOR</span>
        </div>
    </div>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulação de autenticação com os novos perfis
    setTimeout(() => {
        const u = username.toLowerCase().trim();
        const p = password.trim();

        // 1. ADMINISTRAÇÃO (Senha Numérica - Ex: 123456)
        if ((u === 'juliana' || u === 'leandro' || u === 'pedro' || u === 'admin') && p === '123456') {
            onLogin({ 
                username: u, 
                name: u.charAt(0).toUpperCase() + u.slice(1), 
                role: 'admin' 
            });
        }
        // 2. GESTOR (Marcos Amato - Sem poder de exclusão)
        else if (u === 'marcos' && p === 'marcos') {
            onLogin({ 
                username: 'marcos', 
                name: 'Marcos Amato', 
                role: 'gestor' 
            });
        }
        // 3. MANUTENCISTAS (Darci / Sergio)
        else if (u === 'darci' && p === 'darci') {
            onLogin({ 
                username: 'darci', 
                name: 'Darci', 
                role: 'manutencista' 
            });
        }
        else if (u === 'sergio' && p === 'sergio') {
            onLogin({ 
                username: 'sergio', 
                name: 'Sergio Lacerda', 
                role: 'manutencista' 
            });
        }
        else {
            setError('Credenciais inválidas. Verifique usuário e senha.');
            setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D32F2F] to-red-800"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gray-200 rounded-full opacity-50 blur-3xl"></div>
      <div className="absolute top-20 -right-20 w-72 h-72 bg-red-100 rounded-full opacity-50 blur-3xl"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        
        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl border-t-8 border-[#D32F2F] p-8 md:p-10">
            <PolifluorLogoLarge />
            
            <div className="text-center mb-8">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">SGMI 2.0</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão de Manutenção Inteligente</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username" className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">Usuário</label>
                    <div className="relative">
                        <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F] transition-all uppercase"
                            placeholder="SEU NOME (EX: PEDRO)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">Senha</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F] transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
                        <p className="text-xs font-bold text-red-600">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="group w-full h-14 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Autenticando...</span>
                    ) : (
                        <>
                            Entrar no Sistema <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mt-2">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Conformidade IATF 16949</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-2">© {new Date().getFullYear()} Polifluor • Soluções em Polímeros</p>
            </div>
        </div>
      </div>
    </div>
  );
};