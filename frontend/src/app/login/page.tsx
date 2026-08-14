"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Home, Lock, Mail, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    nationalId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (isRegister) {
      if (!formData.firstName) newErrors.firstName = 'Nombre requerido';
      if (!formData.lastName) newErrors.lastName = 'Apellido requerido';
      if (!formData.nationalId) newErrors.nationalId = 'DNI/NIF requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isRegister) {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          nationalId: formData.nationalId,
        });
        toast.success('Cuenta creada correctamente');
      } else {
        await login(formData.email, formData.password);
        toast.success('Bienvenido a NovaBank');
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de autenticación';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">NovaBank</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-gray-400">
            {isRegister
              ? 'Únete a la plataforma bancaria del futuro'
              : 'Accede a tu dashboard financiero'}
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{isRegister ? 'Regístrate' : 'Bienvenido de nuevo'}</CardTitle>
            <CardDescription>
              {isRegister
                ? 'Completa tus datos para crear tu cuenta'
                : 'Ingresa tus credenciales para acceder'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    placeholder="Juan"
                    autoComplete="given-name"
                  />
                  <Input
                    label="Apellido"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    placeholder="Pérez"
                    autoComplete="family-name"
                  />
                </div>
              )}
              {isRegister && (
                <Input
                  label="DNI / NIF"
                  name="nationalId"
                  type="text"
                  value={formData.nationalId}
                  onChange={handleChange}
                  error={errors.nationalId}
                  placeholder="12345678A"
                  autoComplete="off"
                />
              )}
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="juan@ejemplo.com"
                autoComplete="email"
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
              />
              <Input
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              />
              <Button type="submit" className="w-full" loading={isLoading} size="lg">
                {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-400">
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} {' '}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrors({});
                }}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>NovaBank Core Banking API v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
