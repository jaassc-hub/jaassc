# Migración de datos desde Excel

Este paquete trae los datos de su archivo `05-COBRO_MAYO_2026.xlsm` ya limpiados y listos
para importar a su base de datos real.

## Qué se va a importar

- **574 abonados/pegues** (de la hoja "Abonados"), con su barrio, servicios habilitados
  (Agua Potable / Alcantarillado), estado, identidad y teléfono cuando los tenía.
- **753 pagos históricos** (de la hoja "Detalle_Pago"), cubriendo 2024, 2025 y 2026, con
  su mismo número de recibo (26-0001, 26-0002...) que ya tenía en el Excel — así los
  recibos viejos que la gente ya tiene en la mano siguen coincidiendo con el sistema.
- Suman en total **L245,396.00** en pagos migrados.

## Antes de correr nada

1. **Revise el precio de sus servicios.** En su Excel, la tarifa combinada de Agua Potable
   + Alcantarillado era L100 (L50 cada uno), y solo Agua Potable era L50. Si en
   **Configuración → Servicios y tarifas** del sistema tiene precios distintos, ajústelos
   ahí ANTES de empezar a cobrar en el sistema nuevo (esto no afecta los pagos que se están
   migrando, esos guardan su propio monto histórico tal cual estaba en el Excel).

2. Hay **1 fila que no se pudo migrar sola** (un pago de L95 de "Osmin Estrada" en 2025 sin
   ningún mes marcado en el Excel — no supe a qué mes asignarlo). Está anotada en
   `prisma/migracion/revisar_manualmente.json`. Después de migrar, regístrelo usted mismo
   manualmente desde el sistema, en el pegue 3MY021.

## Cómo correr la migración

En su computadora, dentro de la carpeta del proyecto:

```bash
node prisma/migrar-excel.js abonados
node prisma/migrar-excel.js pagos
```

El primer comando crea los abonados y pegues (solo debe correrlo una vez). El segundo
importa los pagos — es seguro correrlo varias veces o con archivos distintos, porque
detecta solo los pagos que ya existen y no los duplica.

Va a ver un resumen en la terminal de cuántos se crearon, cuántos ya existían, y si hubo
algún error.

## Cuando le mande los datos de junio

Cuando tenga el archivo de junio, mándemelo y yo le preparo un `pagos.json` nuevo solo con
esos pagos (reemplazando el archivo `prisma/migracion/pagos.json`). Usted solo vuelve a
correr:

```bash
node prisma/migrar-excel.js pagos
```

Los pagos de mayo que ya estén no se van a duplicar — el sistema los reconoce por pegue +
mes + año.

## Después de migrar

- Revise algunos abonados al azar en el panel (ficha de pegue → historial) para confirmar
  que los montos y fechas se ven bien.
- Los abonados migrados no tienen identidad en la mayoría de casos (solo 130 de 574 la
  tenían en el Excel) — recuerde que igual pueden entrar al portal con su código de acceso
  (PIN), que se generó automáticamente para todos.
- El correlativo de recibos (26-XXXX) sigue exactamente donde se quedó en el Excel, así que
  el próximo recibo que emita el sistema continuará la numeración sin chocar con los viejos.
