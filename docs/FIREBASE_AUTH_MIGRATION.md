# Migración de autenticación de DiagramaGuardia

## Estado

Segunda iteración preparada en la rama `firebase-auth-migration`.

La aplicación queda diseñada para convivir con dos métodos de acceso:

- **Usuario + contraseña**: conserva el flujo actual para las cuentas existentes.
- **Google**: se vincula a la misma identidad Firebase mediante `linkWithPopup()`.

La activación sigue protegida por:

```js
const AUTH_MIGRATION_ENABLED = false;
```

No cambiar este valor hasta completar la configuración de Firebase y las pruebas.

## Cuentas existentes

El usuario existente:

1. ingresa normalmente con su nombre y contraseña;
2. durante la migración se crea/usa una identidad Firebase Auth estable;
3. una vez autenticado puede pulsar **Vincular cuenta de Google**;
4. Google queda asociado al mismo `uid`;
5. desde entonces puede entrar con contraseña o Google.

La asociación de Google **no se hace por nombre ni se intenta adivinar por email**. La vinculación requiere que el usuario esté autenticado y se realiza sobre la cuenta Firebase actual.

## Usuarios nuevos

Hay dos caminos:

### Registro tradicional

- nombre y datos de DiagramaGuardia;
- contraseña;
- legajo;
- identidad Firebase con el mecanismo de contraseña interno.

### Registro con Google

- el usuario pulsa **Crear con Google**;
- autentica su cuenta Google;
- completa los datos propios de DiagramaGuardia;
- el perfil se crea sobre el mismo `uid` de Google.

## Acceso posterior

Cuando la migración esté activa, la pantalla de ingreso mostrará:

- **Ingresar** con el usuario y contraseña de siempre.
- **Continuar con Google**.

Si un usuario de Google ya está asociado a un perfil, el sistema localiza el perfil por `authUid`, no por el nombre mostrado por Google.

## Importante

Esta etapa **todavía no permite cerrar las reglas de Firestore**.

Persisten tareas de seguridad de la siguiente etapa:

1. separar datos privados de los perfiles;
2. retirar hashes heredados del documento accesible al cliente;
3. usar `request.auth.uid` como identidad principal;
4. reemplazar la autorización basada en `ME.name === 'Jonatan'` por roles reales;
5. implementar backend/Admin SDK para operaciones privilegiadas, como reseteos administrativos de contraseña;
6. crear reglas específicas por colección;
7. probar cada operación antes de desplegar las reglas restrictivas.

El Admin SDK es el mecanismo apropiado para operaciones privilegiadas sobre usuarios, incluido cambiar contraseñas sin iniciar sesión como ese usuario.

## Configuración necesaria en Firebase

En Firebase Console:

1. Authentication → Sign-in method.
2. Activar **Email/Password**.
3. Activar **Google**.
4. Verificar los dominios autorizados de la aplicación.
5. Probar primero con un usuario de prueba antes de activar la bandera en producción.

Firebase documenta que una misma cuenta puede tener varios proveedores vinculados y conservar el mismo UID.

## Flujo de prueba recomendado

1. Mantener `AUTH_MIGRATION_ENABLED = false`.
2. Activar Email/Password y Google en Firebase.
3. Activar la bandera en una rama/prueba.
4. Probar una cuenta existente con contraseña.
5. Desde esa sesión, vincular Google.
6. Cerrar sesión.
7. Entrar nuevamente con Google.
8. Verificar que se abre exactamente el mismo perfil, licencias y datos.
9. Cerrar sesión.
10. Volver a entrar con usuario + contraseña.
11. Crear un usuario nuevo tradicional.
12. Crear un usuario nuevo con Google.
13. Verificar que un Google ya vinculado a un usuario no pueda vincularse a otro.

## Nota sobre contraseñas administrativas

Una vez que una cuenta usa Firebase Authentication, el cliente no debe intentar cambiar la contraseña de otra persona directamente. Esa operación debe pasar por un entorno privilegiado (por ejemplo, Cloud Functions/servidor con Firebase Admin SDK).

