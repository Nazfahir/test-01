# Orbitas — Currency System v0.2

## Estado

Versión: 0.2  
Estado: borrador inicial

---

## 1. Objetivo

La moneda del MVP da sensación de recompensa y progreso.

En el MVP:

- se muestra visualmente;
- se guarda con monto y origen;
- no se puede gastar;
- no hay tienda ni inventario.

---

## 2. Principio central

> Moneda en MVP significa sensación de progreso, no economía completa.

---

## 3. Alcance

Incluido:

- mostrar moneda al final;
- calcular moneda desde eventos de juego;
- guardar transacciones para usuarios registrados;
- guardar origen;
- CTA para que invitados creen cuenta.

No incluido:

- gastar moneda;
- comprar objetos;
- tienda;
- inventario;
- intercambio;
- regalos;
- pagos reales.

---

## 4. Nombre de moneda

Pendiente. En código usar `currency`.

Opciones futuras: Estrellitas, Chispas, Polvo estelar, Fragmentos.

---

## 5. Eventos que otorgan moneda

```txt
round_completed
match_completed
same_choice_bonus
unique_answer_bonus
received_vote_bonus
group_bonus
```

Valores provisionales:

```txt
round_completed: +5
match_completed: +20
same_choice_bonus: +2
unique_answer_bonus: +3
received_vote_bonus: +1 por voto
group_bonus: +5
```

---

## 6. Skips

Si un jugador queda `skipped`:

- no recibe bonus específico de esa ronda;
- puede recibir `match_completed` si termina partida;
- no se muestra penalización.

---

## 7. Invitados

Invitados ven moneda ganada visualmente.

Opciones:

- guardar recompensa pendiente con `guest_session_id`;
- o mostrar solo visualmente y guardar tras crear cuenta.

Recomendación:

> Guardar recompensa pendiente si no aumenta demasiado la complejidad.

---

## 8. Usuarios registrados

Guardar moneda como ledger:

```txt
currency_transactions
```

Campos clave:

- user_id;
- amount;
- source_type;
- source_id;
- match_id;
- round_id;
- room_id;
- metadata;
- created_at.

No guardar solo total.

---

## 9. Idempotencia

Evitar otorgar dos veces la misma recompensa.

Estrategias:

- constraint por `user_id + source_type + source_id`;
- marcar match como recompensado;
- server action/RPC idempotente.

---

## 10. Seguridad

- Cliente no puede otorgarse moneda arbitraria.
- Validar que jugador pertenece a partida.
- Validar que match/ronda terminó.
- Evitar duplicados por recarga.

---

## 11. Resultado final

Ejemplo:

```txt
Ganaste +34 monedas
+20 por completar la partida
+10 por completar rondas
+4 por coincidencias
```

Para invitados:

```txt
Ganaste +34 monedas. Crea una cuenta para guardarlas.
```

---

## 12. Futuro

La moneda podrá usarse para:

- decoración de planeta;
- avatar;
- regalos;
- recuerdos;
- cosméticos.

No implementar esos usos en MVP.
