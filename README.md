# Sistema de Control de Pagos — Junta de Agua

Sistema hecho en Next.js 14 (App Router) + Prisma + PostgreSQL, pensado para desplegarse
gratis en Vercel. Colores institucionales azul/naranja, panel administrativo y portal
público para los abonados.

## 1. Qué incluye esta primera versión

- **Servicios y tarifas** editables (Agua Potable, Alcantarillado, Tren de Aseo, u otros).
- **Barrios** con prefijo de código y correlativo automático (GUA001, GUA002, ...), editable.
- **Abonados y pegues** (un abonado puede tener varios pegues; cada pegue tiene sus propios
  servicios habilitados).
- **Registro de pagos** con cálculo automático de:
  - Meses de mora (según el mes que se está cancelando vs. la fecha real de pago).
  - Multa por mora: 3 meses = L100, 4-6 = L200, 7-12 = L500, +12 = L1000.
  - Aviso de "sujeto a corte" si debe más de 3 meses.
  - Pago de reconexión opcional (reactiva el pegue si estaba cortado).
- **Recibo interactivo y editable**: puede activar/desactivar secciones, reordenarlas y
  cambiar los textos; el formato se guarda y se aplica a todos los recibos futuros.
  Se "descarga" en PDF usando el botón de imprimir del navegador (Guardar como PDF).
- **Informe de caja** agrupado por mes y por método de pago (efectivo, transferencia,
  depósito), sin importar qué día del mes se cobró.
- **Portal público** para que el abonado consulte su estado de cuenta con su código de
  pegue + número de identidad, vea su historial y descargue sus recibos en PDF. Responsive
  para celular.
- Arquitectura **modular**: cada área (servicios, abonados, pagos, caja, portal) vive en su
  propia carpeta y su propio conjunto de rutas API, para poder agregar después el módulo de
  ingresos/egresos generales sin tocar lo existente.

## 2. Requisitos previos

- Cuenta gratuita en [Vercel](https://vercel.com).
- Una base de datos Postgres gratuita. Recomendado: [Neon](https://neon.tech) (tiene un
  plan gratuito generoso) o "Vercel Postgres" desde el propio dashboard de Vercel.
- Node.js 18+ instalado en su computadora si quiere probarlo localmente antes de subirlo.

## 3. Probarlo en su computadora (opcional pero recomendado)

```bash
npm install
cp .env.example .env
# edite .env y coloque su DATABASE_URL de Neon/Vercel Postgres
npx prisma db push
npm run seed        # crea los 4 barrios, 3 servicios y el usuario admin
npm run dev
```

**Nota sobre `db push` vs `migrate dev`**: este proyecto usa `npx prisma db push` en vez de
`npx prisma migrate dev` para aplicar cambios al modelo de datos. `db push` sincroniza la
base de datos directamente con lo que dice `prisma/schema.prisma`, sin depender de un
historial de migraciones guardado en su computadora. Esto es importante porque cada vez que
reciba un proyecto actualizado y reemplace la carpeta completa, ese historial se perdería, y
`migrate dev` pediría "resetear" la base de datos (¡borrando todo!) al notar la
discrepancia. `db push` no tiene ese problema: siempre es seguro correrlo de nuevo.

Abra http://localhost:3000 — el usuario/clave de administrador son los que puso en
`ADMIN_USERNAME` / `ADMIN_PASSWORD` dentro de `.env`.

## 4. Desplegar en Vercel (gratis)

1. Suba esta carpeta a un repositorio de GitHub (puede arrastrar los archivos en
   github.com/new si no usa git desde la terminal).
2. En Neon (o Vercel Postgres) cree una base de datos y copie la cadena de conexión
   (`DATABASE_URL`).
3. En [vercel.com/new](https://vercel.com/new) importe el repositorio.
4. En "Environment Variables" agregue:
   - `DATABASE_URL`
   - `JWT_SECRET` (invente una clave larga y aleatoria)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_JUNTA_NOMBRE` (nombre real de su junta)
5. Despliegue. Cuando termine, entre a la terminal de Vercel (o corra localmente contra
   la misma `DATABASE_URL`) y ejecute una sola vez:
   ```bash
   npx prisma db push
   npm run seed
   ```
   Esto crea las tablas y los datos iniciales (barrios, servicios, usuario admin).
6. Ya puede entrar a su URL de Vercel. `/admin` es el panel, `/portal` es la vista pública.

## 5. Primeros pasos dentro del sistema

1. Entre a **Servicios y tarifas** y confirme/edite los precios reales de Agua Potable,
   Alcantarillado y Tren de Aseo.
2. Revise **Barrios** — ya vienen Guadalupe (GUA), 3 de Mayo (3MY), San José (SNJ) y
   Lempira (LEM). Puede agregar más barrios si tiene.
3. Vaya creando sus **500 abonados** en **Abonados y pegues** (nombre + identidad), y a
   cada uno agréguele su(s) pegue(s) — el código se genera solo.
4. El día de cobro, use **Registrar pago**: busque por código de pegue, el sistema le
   sugiere el mes pendiente, calcula la mora automáticamente y le imprime el recibo.
5. Cuando quiera, revise **Informe de caja** para ver cuánto entró cada mes.
6. Cambie el logo genérico por el real reemplazando el componente `components/Logo.tsx`
   (o dígame y se lo integro yo).

## 6. Ideas para cuando quiera escalarlo (módulo de gastos)

Ya dejé la base pensada para esto — el siguiente paso natural sería agregar:

- Un modelo `Gasto` (mantenimiento, sueldos, pagos públicos, etc.) con categoría, monto,
  fecha y comprobante.
- Una pantalla de "Estado financiero" que combine los ingresos de `Pago` con los `Gasto`
  para darle el balance real mes a mes.
- Roles de usuario (admin, tesorero, solo-lectura) en vez de un único usuario admin.
- Notificaciones (WhatsApp/SMS) a abonados con mora alta.
- Carga masiva de abonados desde Excel/CSV para no tener que crearlos uno por uno.

Avíseme cuando quiera y seguimos con esa segunda fase sobre esta misma base.

## 7. Novedades de la actualización de pagos múltiples

- **Pago de varios meses de una vez**: en "Registrar pago" ahora puede indicar cuántos
  meses va a cancelar (adelantado o atrasado). El sistema calcula la mora de cada mes por
  separado y genera un **recibo combinado**.
- **No se pueden saltar ni repetir meses**: el sistema siempre exige pagar primero el mes
  pendiente más antiguo de ese pegue; si se intenta pagar un mes fuera de orden o ya pagado,
  lo rechaza con un mensaje claro.
- **Historial del pegue**: desde "Registrar pago" y desde la ficha del abonado puede ver
  todos los pagos, cortes y reconexiones de un pegue en una sola línea de tiempo.
- **Alertas al cobrar**: si el abonado tiene otro pegue con 3+ meses de mora o cortado, se
  lo advierte antes de dejarlo ir. Si el abonado no tiene número de identidad registrado,
  también se lo recuerda con un botón para agregarlo ahí mismo.
- La identidad del abonado ahora es **opcional al crearlo** (puede completarse después),
  pero el sistema seguirá avisando hasta que se registre, porque es necesaria para el
  portal público.

**Importante**: esta actualización agrega tablas nuevas al modelo de datos. Debe correr de
nuevo, una sola vez:
```bash
npx prisma db push
```

## 8. Novedades de esta actualización (roles, recibo matricial, etc.)

- **Roles y permisos**: ahora hay usuarios individuales con rol Presidente, Tesorero,
  Secretaria, Fiscal o Vocal. Presidente y Tesorero siempre ven todo. Los demás roles solo
  ven los módulos que se les habiliten desde **Configuración → Usuarios y permisos**.
- **Nuevo pegue primero**: en "Abonados y pegues" ahora el botón principal es
  "+ Nuevo pegue". Ahí busca o crea al abonado dueño en el mismo formulario, sin tener que
  crear el abonado por separado primero.
- **Botón "Atrás"** disponible en todo el panel administrativo y en el portal público.
- **Primer pago manual**: si un pegue no tiene ningún pago registrado, ahora puede elegir
  manualmente desde qué mes empieza a cobrar (útil para abonados que ya tenían meses
  pendientes antes de usar el sistema). Si ya tiene pagos, el sistema sigue exigiendo el
  orden correcto.
- **Buscar por abonado al cobrar**: en "Registrar pago" ahora puede buscar por nombre o
  identidad del abonado, no solo por código de pegue.
- **Íconos monocromos** (lucide-react) en vez de emojis, en todo el panel.
- **Recibo adaptado a impresora matricial**: el recibo ahora se imprime en blanco y negro,
  con fuente de ancho fijo (monoespaciada) y ancho de papel configurable, siguiendo el
  formato de ticket que usted ya utiliza. Ajuste el ancho de columnas en
  **Configuración → Impresora**.
- **Página de inicio rediseñada**: ahora el protagonista es "Consultar mi estado de
  cuenta"; el acceso al panel administrativo quedó como un botón discreto arriba a la
  derecha.
- **Apartado de Configuración** (`/admin/configuracion`): usuarios y permisos, impresora, y
  acceso rápido al formato del recibo.

**MUY IMPORTANTE**: esta actualización **renombra la tabla de administradores** (de `Admin`
a `Usuario`, para poder tener varios usuarios con roles). Al correr la migración, Prisma
eliminará la tabla `Admin` anterior y creará `Usuario` desde cero. Debe volver a correr el
seed después. Los pasos, uno por uno:

```bash
npx prisma db push
npx prisma db seed
npm run dev
```

Si tenía usuarios de prueba creados a mano en la tabla anterior, se perderán — solo se
recrea el usuario definido en `ADMIN_USERNAME` / `ADMIN_PASSWORD` de su `.env`, ahora con
rol **Presidente** (acceso total). Desde ahí puede crear al resto del equipo en
Configuración → Usuarios.

## 9. Novedades de esta actualización (pantalla de cobro, CRUD, roles cobrador)

- **Pantalla de cobro rediseñada** (`/admin/pagos/nuevo`): un solo campo de búsqueda que
  acepta código de pegue, identidad o nombre del abonado. Visual tipo caja registradora,
  con el total bien grande al final.
- **Rol Cobrador**: nuevo rol que solo puede entrar a registrar/ver pagos — ideal para
  alguien que únicamente cobra. Al iniciar sesión entra directo a la pantalla de cobro.
  Se crea desde Configuración → Usuarios y permisos.
- **Quién emitió el recibo**: cada recibo ahora muestra "Emitido por" con el usuario que
  procesó el cobro (se puede ocultar desde "Editar formato" en cualquier recibo).
- **Correlativo de recibo** (ej. `26-0428`): cada cobro genera un número consecutivo por
  año, visible en el recibo y en el historial de pagos.
- **Historial de pagos** ahora agrupa los pagos de varios meses en una sola fila (por
  recibo), tiene un buscador en vivo por correlativo/código/nombre, y botones con ícono
  para imprimir (abre el recibo en pestaña nueva) o ver el detalle.
- **Editar formato del recibo ampliado**: ahora se puede cambiar el subtítulo de la junta,
  el texto grande final, y mostrar/ocultar DNI, barrio, servicios, tarifa y "emitido por".
- **Los pegues son ahora lo principal**: la tabla en "Pegues y abonados" lista pegues (con
  el abonado como columna). Al entrar a un pegue se ve su información completa: estado,
  servicios, estado de cuenta, y los datos del abonado dueño con enlace a su ficha
  completa (`/admin/abonados/detalle/[id]`) para editarlo.
- **Inhabilitar un pegue**: además de "Cortar por mora", ahora hay una opción para
  inhabilitar un pegue (por ausencias largas), distinta del corte por mora.
- **Estado de cuenta desde el panel**: cada ficha de pegue muestra su estado de cuenta
  (próximo mes, mora, si está sujeto a corte) sin necesidad de ir al portal público.
- **CRUD más completo**:
  - Abonados: edición completa de nombre, identidad, teléfono, dirección y estado activo.
  - Pegues: edición de código, barrio, servicios y estado (activo/cortado/inhabilitado).
  - Pagos: nueva pantalla de detalle para corregir método/referencia/observaciones/fecha,
    o eliminar un pago mal registrado (el mes vuelve a quedar pendiente).
  - Usuarios y Servicios ya tenían edición; ahora todos comparten el mismo patrón.
  - Nota: por seguridad e integridad de los datos, Abonados/Pegues/Usuarios se
    **desactivan** en vez de borrarse físicamente (para no perder el historial de pagos
    ligado a ellos); solo los Pagos se eliminan de verdad, ya que es una corrección
    puntual del tesorero.

Esta actualización solo agrega tablas y campos nuevos (no renombra nada), así que la
migración esta vez **no borra datos existentes**:

```bash
npx prisma db push
npm run dev
```

## 10. Novedades de esta actualización (mora por porcentaje, descuentos, recibo editable)

- **Mora por porcentaje sobre el total adeudado**: ya no es una tarifa fija por
  "categoría" de meses. Ahora se calcula así: se suma lo que el abonado debe en total
  (tarifa × meses vencidos) y se le aplica **un solo porcentaje** según cuántos meses
  lleva de atraso. Edite los tramos y porcentajes en **Configuración → Mora** (por
  ahora todos al 10%, como pidió).
- **Descuentos y regalías**: en la pantalla de cobro hay un apartado para:
  - Descuentos automáticos que el sistema sugiere solo si el abonado califica:
    tercera edad (calculada desde el número de identidad) y pago adelantado a inicio
    de año (según cuántos meses paga y hasta qué mes del año). El cobrador puede
    aceptarlos, quitarlos, o no.
  - Un descuento/regalía manual, en monto fijo (L) o porcentaje, con un campo para
    escribir el motivo a mano.
  - Las reglas automáticas (edad mínima, meses mínimos, porcentajes) se configuran en
    **Configuración → Descuentos y regalías**.
  - El recibo muestra la línea de descuento con su motivo cuando aplica.
- **El recibo ahora se edita y se borra como una unidad, no mes por mes**:
  - "Eliminar recibo completo" borra todos los meses de ese cobro de una vez (si pagó
    12 meses, se borran los 12).
  - Si se equivocaron en la **cantidad de meses**, ya no hay que borrar y rehacer todo:
    en el detalle del recibo (`/admin/pagos/[id]`) puede **quitar un mes** puntual
    (recalcula la mora del resto automáticamente) o **agregar el siguiente mes
    pendiente** a ese mismo recibo (mismo número de recibo).
  - Los demás datos (método de pago, referencia, observaciones, fecha) se editan una
    sola vez y aplican a todo el recibo.

Esta actualización solo agrega campos nuevos (no borra ni renombra nada existente):

```bash
npx prisma db push
npm run dev
```

## 11. Novedades de esta actualización (código de acceso al portal, identidad opcional)

- **Código de acceso (PIN) al portal**: cada abonado ahora tiene, además de su
  identidad, un código de 6 dígitos generado automáticamente por el sistema. El
  portal público (`/portal`) ya acepta **identidad o código de acceso**, así que
  **todos** los abonados pueden consultar su cuenta, tengan o no su identidad
  registrada.
  - El código se genera solo la primera vez que hace falta: al crear el abonado, al
    abrir su ficha o la de su pegue en el panel, o al cobrarle. No hay que hacer nada
    especial para los abonados nuevos.
  - Para los que ya existían antes de esta actualización, hay un botón en
    **Configuración** ("Generar códigos faltantes ahora") para generarlos todos de
    una vez, por ejemplo antes de repartirlos en una reunión.
  - El código aparece impreso en el recibo (se puede ocultar desde "Editar formato"),
    y también se puede ver y **regenerar** desde la ficha del abonado o del pegue, por
    si el abonado lo pierde.
- **Agregar identidad desde el portal**: si un abonado entra con su código de acceso
  y no tiene identidad registrada, le aparece siempre una invitación (no obligatoria)
  para agregarla él mismo. Reglas para mantenerlo seguro:
  - Solo se puede agregar si estaba vacía — no se puede usar para cambiar una
    identidad que ya existe (eso lo sigue haciendo únicamente el panel administrativo).
  - Se valida que tenga el formato hondureño de 13 dígitos y que no esté ya usada por
    otro abonado.
  - En el panel, esa identidad queda marcada con la etiqueta **"agregada por el
    abonado"** (en la ficha del pegue y del abonado), para que el tesorero sepa qué
    datos se completaron solos.

Esta actualización solo agrega campos nuevos (no borra ni renombra nada existente):

```bash
npx prisma db push
npm run dev
```

## 12. Novedades de esta actualización (avisos por WhatsApp)

- **Aviso automático por WhatsApp** cuando se registra un pago, si el abonado tiene
  teléfono guardado. Se envía usando Twilio (necesita cuenta propia — vea abajo).
- Configurable desde **Configuración → Avisos por WhatsApp**:
  - Encender/apagar sin tocar código.
  - Número de envío (el que le asigne Twilio).
  - Texto del mensaje, con datos del pago disponibles: `{nombre}` `{codigo}` `{barrio}`
    `{meses}` `{total}` `{numeroRecibo}` `{fecha}` `{junta}`.
  - Botón para mandarse un mensaje de prueba sin tener que registrar un pago real.
  - Registro de los últimos mensajes enviados y los que fallaron (ej. número mal
    escrito), para no perderles la pista.

**Para activarlo de verdad**, agregue a su `.env` (y en las variables de entorno de
Vercel si ya está desplegado):
```
TWILIO_ACCOUNT_SID="el que le da Twilio"
TWILIO_AUTH_TOKEN="el que le da Twilio"
```
Esos dos valores son secretos — no se editan desde el panel, solo desde el archivo
`.env` (por seguridad). El número de envío y el mensaje sí se editan desde el panel.

Nota: si usa el "WhatsApp Sandbox" de Twilio para probar, solo le llegarán mensajes a
números que se hayan "unido" al sandbox desde su propio WhatsApp — para mandarle a
cualquier abonado sin ese paso, necesita el número de WhatsApp de producción que
Twilio aprueba en unos días.

```bash
npx prisma db push
npm run dev
```

## 13. Novedades de esta actualización (derecho de conexión en cuotas)

- Al crear un pegue nuevo (desde "+ Nuevo pegue" o desde la ficha del abonado), ahora
  puede indicar un **costo de conexión** y cobrarlo:
  - **De contado**: queda registrado como ya pagado, con su método y referencia.
  - **En cuotas**: se generan automáticamente N cuotas iguales (usted decide cuántas),
    que quedan pendientes de cobrar.
  - O simplemente no cobrar nada, dejando el campo vacío.
- Cada cuota se cobra desde la **ficha del pegue**, con su propio método de pago y
  referencia, quedando registrado quién la cobró.
- En la pantalla de **cobro** aparece un aviso si el pegue tiene cuotas de conexión
  pendientes (para no olvidarlas, ya que el cobro mensual normal no las incluye).

```bash
npx prisma db push
npm run dev
```

## 14. Novedades de esta actualización (recibo de cuotas, estado de cuenta con conexión)

- **Recibo para las cuotas de conexión**: cada vez que se cobra una cuota (o el pago de
  contado), se genera un recibo imprimible con el mismo formato de ticket, con su
  propio número de recibo (comparte el mismo correlativo que los recibos mensuales).
  Se puede reimprimir desde la ficha del pegue ("Ver recibo" junto a cada cuota pagada).
- **El abonado ahora ve sus cuotas de conexión en el portal**: si tiene cuotas
  pendientes, le aparece un aviso con el total pendiente (igual que le aparece al
  tesorero al momento de cobrar). Las cuotas ya pagadas se pueden ver/descargar en PDF
  igual que los recibos mensuales.

```bash
npx prisma db push
npm run dev
```

## 15. Pendiente para la próxima conversación

Quedó anotado para cuando usted diga:
- Ayuda migrando sus abonados/pegues desde una hoja de Excel.
- Tips para que la pantalla de cobro responda más rápido (ahora mismo cada búsqueda/
  cobro tarda un par de segundos porque cada clic hace una consulta nueva a la base de
  datos en Neon; hay formas de acelerarlo, mas adelante lo vemos con calma).

## 16. Notas importantes

- Si alguna vez le vuelve a aparecer una pregunta pidiendo "resetear" el schema de la base
  de datos: **cancele con Ctrl+C y no acepte**. Eso borra todos los datos. Use siempre
  `npx prisma db push` para aplicar cambios de modelo — nunca necesita resetear nada con
  ese comando.
- El `package.json` también tiene `prisma.seed` apuntando a `prisma/seed.js`; si alguna vez
  `npx prisma db seed` dice que no encuentra esa configuración, revise que esa sección no se
  haya perdido al reemplazar archivos a mano.

- El "PDF" de los recibos se genera con la función de imprimir del navegador (Ctrl+P →
  Guardar como PDF). Funciona igual en celular y computadora, sin necesidad de librerías
  extra ni costo adicional.
- El portal público valida identidad **exacta** contra el número que usted registró en el
  abonado; asegúrese de digitarlo tal cual aparece en su identidad al crear cada abonado.
- Por ahora hay un solo usuario administrador (usted). Si más adelante el tesorero necesita
  su propio usuario, es un cambio sencillo sobre esta misma base.
