# Migración de datos desde Excel

Este paquete trae los datos ya limpiados y listos para importar — **ahora incluye hasta
junio de 2026** (el archivo de junio traía todo el año acumulado, así que los de mayo ya
están incluidos ahí también).

## Qué se va a importar esta vez

- **576 abonados/pegues** (2 nuevos desde mayo: LEM143 y GUA226).
- **866 pagos** en total en el archivo (2024-2026) — pero como usted ya corrió esto una vez
  con los datos de mayo, el sistema va a **saltarse automáticamente** los que ya existen y
  solo va a agregar los nuevos de junio. No se duplica nada.
- Sigue usando el mismo correlativo que traía el Excel (26-XXXX).

## Antes de correr nada

1. Asegúrese de tener el proyecto actualizado con los últimos cambios que le mandé
   (separación de correlativos por tipo de documento) y corra `npx prisma db push` primero
   si no lo ha hecho.
2. Si todavía no ajustó el precio de sus servicios en **Configuración → Servicios y
   tarifas** (Agua Potable L50 + Alcantarillado L50, según su Excel), hágalo ahora — esto
   no afecta los pagos migrados, que guardan su propio monto histórico.

## Cómo correr la migración

```bash
node prisma/migrar-excel.js abonados
node prisma/migrar-excel.js pagos
```

Va a ver en la terminal cuántos abonados/pagos se crearon de nuevo y cuántos ya existían
(esos se saltan solos). Es seguro correr esto varias veces o con archivos distintos.

## Sigue pendiente

- **1 fila sin migrar** (Osmin Estrada, 3MY021, L95 en 2025, sin mes marcado en el Excel) —
  está anotada en `prisma/migracion/revisar_manualmente.json`. Regístrela usted a mano
  desde el sistema.
- **Los datos de 2025** (formato distinto, con Tren de Aseo) — en cuanto me pase ese
  archivo, sigo con la misma lógica: correlativo `25-XXXX` reutilizando los números que ya
  trae ese Excel.

## Después de migrar

- Revise algunos abonados al azar en el panel (ficha de pegue → historial) para confirmar
  que los montos y fechas se ven bien.
- Los abonados migrados no tienen identidad en la mayoría de casos — recuerde que igual
  pueden entrar al portal con su código de acceso (PIN), generado automáticamente.
- El correlativo de recibos (26-XXXX) sigue exactamente donde se quedó en el Excel.
