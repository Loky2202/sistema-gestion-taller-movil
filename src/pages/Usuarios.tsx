import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Mail, Pencil, Plus, Shield, UserCog, UserX, CheckCircle2 } from 'lucide-react';
import { Button, Card, EmptyState, Input, Loader, Modal, PageHeader, Select, Toast } from '../components/ui';
import { actualizarUsuario, crearUsuario, getUsuarios } from '../db';
import { useAuth } from '../store/auth';
import { useAsync } from '../hooks/useAsync';
import type { Rol, Usuario } from '../types';

type FormState = {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  activo: boolean;
};

const FORM_VACIO: FormState = {
  nombre: '',
  email: '',
  password: '',
  rol: 'mecanico',
  activo: true,
};

export default function Usuarios() {
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  const logout = useAuth(s => s.logout);

  const { data, loading, error, reload } = useAsync(
    async () => (user?.rol === 'admin' ? getUsuarios() : []),
    [user?.rol]
  );
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  // Todos los hooks van antes de cualquier return condicional.
  if (!user || user.rol !== 'admin') return <Navigate to="/" replace />;

  const usuarios = data ?? [];
  const editandoPropio = editando?.id === user.id;

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError('');
    setShowForm(true);
  };

  const abrirEditar = (u: Usuario) => {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol,
      activo: u.activo,
    });
    setFormError('');
    setShowForm(true);
  };

  const cerrarForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditando(null);
    setFormError('');
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nombre = form.nombre.trim();
    const email = form.email.trim().toLowerCase();

    if (!nombre) return setFormError('El nombre es obligatorio');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFormError('Escribe un correo válido');
    if (!editando && form.password.length < 6) {
      return setFormError('La contraseña debe tener al menos 6 caracteres');
    }
    if (editando && form.password && form.password.length < 6) {
      return setFormError('La nueva contraseña debe tener al menos 6 caracteres');
    }

    setSaving(true);
    try {
      if (editando) {
        const cambios: Partial<Usuario> = {
          nombre,
          email,
          rol: form.rol,
          activo: form.activo,
        };
        if (form.password) cambios.password = form.password;
        await actualizarUsuario(editando.id, cambios);

        // Si el admin cambia su propio correo, el token actual deja de ser válido.
        if (editandoPropio && email !== user.email) {
          setShowForm(false);
          setSuccess('Correo actualizado. Vuelve a iniciar sesión.');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 1500);
          return;
        }

        setSuccess('Usuario actualizado correctamente');
      } else {
        await crearUsuario({
          nombre,
          email,
          password: form.password,
          rol: form.rol,
          activo: form.activo,
        });
        setSuccess('Usuario creado correctamente');
      }

      setShowForm(false);
      setEditando(null);
      reload();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err?.message ?? 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-20">
      <PageHeader
        title="Usuarios"
        onBack={() => navigate('/perfil')}
        action={
          <Button size="sm" onClick={abrirNuevo}>
            <Plus className="w-4 h-4" /> Nuevo
          </Button>
        }
      />

      {success && <Toast message={success} onClose={() => setSuccess('')} />}

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
          <UserCog className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            Crea usuarios para los mecánicos, actualiza sus datos, cambia su contraseña
            o desactívalos cuando ya no trabajen en el taller.
          </p>
        </div>

        {loading && <Loader text="Cargando usuarios..." />}

        {!loading && error && (
          <div className="text-center py-8 space-y-3">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={reload} className="text-blue-600 text-sm font-medium">Reintentar</button>
          </div>
        )}

        {!loading && !error && usuarios.length === 0 && (
          <EmptyState
            icon={<UserCog className="w-8 h-8" />}
            title="No hay usuarios"
            description="Crea el primer usuario del taller"
          />
        )}

        {!loading && !error && usuarios.map(u => (
          <Card key={u.id} onClick={() => abrirEditar(u)}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                u.activo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {u.nombre?.[0]?.toUpperCase() ?? '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold truncate ${u.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                    {u.nombre}
                  </p>
                  {u.id === user.id && (
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      Tú
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {u.email}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {u.rol === 'admin' ? 'Administrador' : 'Mecánico'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.activo ? <CheckCircle2 className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <Pencil className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showForm}
        onClose={cerrarForm}
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
      >
        <form onSubmit={handleGuardar} className="space-y-3">
          <Input
            label="Nombre *"
            placeholder="Ej: Carlos Mecánico"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            autoComplete="name"
          />

          <Input
            label="Correo electrónico *"
            type="email"
            placeholder="mecanico@taller.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />

          <Input
            label={editando ? 'Nueva contraseña' : 'Contraseña *'}
            type="password"
            placeholder={editando ? 'Dejar en blanco para conservar' : 'Mínimo 6 caracteres'}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />

          <Select
            label="Rol"
            value={form.rol}
            onChange={e => setForm({ ...form, rol: e.target.value as Rol })}
            options={[
              { value: 'mecanico', label: 'Mecánico' },
              { value: 'admin', label: 'Administrador' },
            ]}
            disabled={editandoPropio}
          />

          <Select
            label="Estado"
            value={form.activo ? 'true' : 'false'}
            onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}
            options={[
              { value: 'true', label: 'Activo (puede iniciar sesión)' },
              { value: 'false', label: 'Inactivo (sin acceso)' },
            ]}
            disabled={editandoPropio}
          />

          {editandoPropio && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              Por seguridad no puedes cambiarte el rol ni desactivar tu propia cuenta.
            </p>
          )}

          {formError && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={cerrarForm} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editando ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
