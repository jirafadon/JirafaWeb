# Migración de autenticación de DiagramaGuardia

## Estado

Primera etapa preparada en la rama `firebase-auth-migration`.

El código incorpora Firebase Authentication, pero la activación está protegida por:

```js
const AUTH_MIGRATION_ENABLED = false;
```

No cambiar este valor todavía.

## Configuración necesaria en Firebase

1. Firebase Console → Authentication → Sign-in method.
2. Activar **Email/Password**.
3. Mantener desactivados proveedores que no use DiagramaGuardia.
4. Revisar Security → Authentication Settings y activar **email enumeration protection** si está disponible.

## Qué hace la primera etapa

- Conserva temporalmente el acceso `Nombre + contraseña`.
- En el primer acceso válido de un usuario existente, crea su identidad Firebase Auth.
- Guarda `authUid` y `authEmail` en su documento.
- Los nuevos registros pueden nacer directamente en Firebase Auth.
- Los cambios de contraseña del usuario autenticado se sincronizan con Firebase Auth.

## Importante

Esta etapa **no permite todavía cerrar las reglas de Firestore**. Los documentos existentes de `users` todavía contienen datos heredados como hashes de contraseña/legajo y el cliente todavía necesita cargar la colección completa.

La segunda etapa debe:

1. Separar los datos privados de autenticación del perfil público.
2. Hacer que el cliente use `request.auth.uid` como identidad.
3. Reemplazar la autorización basada en `ME.name === 'Jonatan'` por un rol real.
4. Crear reglas específicas por colección.
5. Probar todas las operaciones.
6. Recién entonces cerrar el acceso público de Firestore.
