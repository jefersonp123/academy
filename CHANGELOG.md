# Registro de Cambios (Changelog)

Este archivo mantendrá un registro de todos los cambios, correciones y nuevas implementaciones realizadas en el proyecto a partir de esta sesión.

## [Corregido] Error Crítico de Autenticación - Bucle Infinito de 401
- **Problema**: La página no cargaba y todos los módulos fallaban con errores 401 (Unauthorized). El refresh token estaba expirado/inválido en Supabase, causando un bucle infinito donde:
  - El interceptor de axios detectaba 401 e intentaba hacer refresh
  - El endpoint `/auth/refresh` también usaba el interceptor, creando un bucle
  - Los requests encolados no se manejaban correctamente cuando el refresh fallaba
  - La app se quedaba en un estado inconsistente sin redirigir al login

- **Solución**:
  1. **client.ts**: Mejorada la gestión de la cola de refresh con `processQueue` que resuelve/rechaza correctamente todas las promises encoladas
  2. **client.ts**: Cuando el refresh falla, ahora se limpia el localStorage (`club-auth`) y se fuerza el logout con redirección inmediata a `/login`
  3. **auth.ts**: Creado un cliente axios separado (`authClient`) sin interceptores para el endpoint `/auth/refresh`, evitando bucles infinitos
  4. **authStore.ts**: El método `refreshTokens` ahora maneja errores haciendo logout automático
  5. **authStore.ts**: El método `logout` ahora limpia explícitamente el localStorage para evitar tokens stale
  6. **TournamentDetailPage.tsx**: Corregidos errores de TypeScript - agregado `useMemo` a los imports y tipado explícito para el parámetro `enrollment`

## [Implementado] Límite de Atletas en Grupos
- **Base de Datos**: Se agregó exitosamente la migración `009_training_group_athlete_limit.sql` insertando la columna de control.
- **Backend**: El servicio ahora verifica proactivamente cuántos atletas hay antes de aceptar agregar más, devolviendo un error HTTP 400 en caso de intentar un exceso de cupo.
- **Frontend**: En el panel de control de grupos, ahora el modal restringe iterativamente a nivel visual la casilla de 'Añadir atletas', alertando instantáneamente al usuario mediante marcadores visuales para no seleccionar más cupos de los permitidos por el límite. Además, se habilitó un campo obligatorio numérico durante la creación/edición de cada Grupo.

## [Implementado] Corrección de Filtro por Categorías en Lista de Atletas
- **Problema**: El API Client estaba enviando claves incorrectas (`category_id`, `membership_status`) que el backend ignoraba porque requería (`categoryId`, `status`), lo que terminaba retornando los atletas incompletos y sin filtrar.
- **Solución**: Cambio a las claves correctas en `AthletesPage.tsx` y `TrainingDetailPage.tsx` (AddAthletesModal) permitiendo que los selectores y el modal filtren por categoría propiamente.

## [Implementado] Validación Estricta para Formulario de "Crear Grupo"
- Se modificó la UI en `TrainingsPage.tsx` para forzar e indicar (con `*`) obligatoriedad real en todos los campos (`category_id`, `location`, `schedule`, `coach_profile_id`).
- Modificación del schema en backend `trainings.schema.js`, pasando todos estos campos a modo requerido `.required()`.
