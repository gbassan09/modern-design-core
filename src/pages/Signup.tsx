import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo/Brand */}
      <div className="mb-6 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">ExpenseFlow</h1>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-sm glass-card-strong">
        <h2 className="text-xl font-semibold text-white mb-2 text-center">
          Criar sua conta
        </h2>
        <p className="text-white/60 text-sm text-center mb-6">
          Comece a gerenciar suas despesas hoje
        </p>

        <form className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="João"
                  className="glass-input w-full pl-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Sobrenome</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Silva"
                className="glass-input w-full text-sm"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">E-mail corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@empresa.com"
                className="glass-input w-full pl-11"
              />
            </div>
          </div>

          {/* Company Input */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Empresa</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className="glass-input w-full pl-11"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                className="glass-input w-full pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50"
            />
            <label htmlFor="terms" className="text-sm text-white/60">
              Eu concordo com os{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <Link to="/" className="block">
            <Button className="w-full gradient-btn border-0 h-12 text-base">
              Criar conta
            </Button>
          </Link>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-white/60">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
