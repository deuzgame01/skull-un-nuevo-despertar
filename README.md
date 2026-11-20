# SKULL – UN NUEVO DESPERTAR 💀✨
**Plataforma Comercial & Catálogo Digital Mobile-First para Piercing y Joyería Corporal**

Desarrollada con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **Firebase (Authentication, Cloud Firestore, Storage)**.

---

## 1. Inicio Rápido (Desarrollo Local)

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador o desde tu celular en la misma red Wi-Fi.

- **Catálogo Público:** `http://localhost:3000`
- **Panel Privado de Administración:** `http://localhost:3000/admin`

> **Modo Prueba Inmediata (Pre-Firebase):** Si aún no has configurado `.env.local`, la aplicación funciona automáticamente en **Modo Local Sincronizado**, permitiéndote probar el catálogo completo, iniciar sesión en `/admin/login` (con cualquier contraseña de 4+ caracteres o el botón de acceso rápido), subir fotos comprimidas a WebP, crear productos, editar categorías y probar los enlaces dinámicos de WhatsApp.

---

## 2. Conectar con Firebase en Producción

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. En [Firebase Console](https://console.firebase.google.com/):
   - Crea tu proyecto y registra una aplicación **Web**.
   - Activa **Authentication** (proveedores *Email/Password* y/o *Google*).
   - Activa **Cloud Firestore** y **Firebase Storage**.
3. Pega tus credenciales en `.env.local` y define el correo de la propietaria en `NEXT_PUBLIC_ADMIN_EMAILS`.
4. Para habilitar la escritura en Firestore/Storage según `firestore.rules` y `storage.rules`:
   - Crea en Firestore la colección `admins` con un documento cuyo ID sea el `UID` del usuario administrador de Firebase Auth.
   - Despliega las reglas e índices ejecutando:
     ```bash
     npx firebase deploy --only firestore,storage
     ```
5. Entra a `/admin` y pulsa **"Cargar Catálogo Base"** para sembrar las categorías y productos iniciales en Cloud Firestore con un solo clic.

