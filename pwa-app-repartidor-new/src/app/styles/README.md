# Estilos Comunes - Componentes Reutilizables

Este documento describe las clases CSS comunes disponibles en `_common-components.scss` que pueden ser usadas en cualquier componente de la aplicación.

## ✅ Cómo usar

Las clases están disponibles globalmente. Solo necesitas agregar la clase al HTML:

```html
<button class="btn-primary">Guardar</button>
<div class="card">Contenido</div>
```

---

## 🎨 Animaciones

### Disponibles
- `fadeIn` - Fade in suave
- `slideUp` - Slide up con fade
- `blink` - Parpadeo intermitente

```scss
.mi-elemento {
    animation: fadeIn 0.3s ease;
}
```

---

## 🪟 Modales

### `.modal-overlay`
Overlay oscuro de fondo para modales.

### `.modal-content`
Contenedor principal del modal con animación.

### `.modal-header`
Cabecera del modal con título y botón de cierre.

### `.modal-body`
Cuerpo del modal con padding.

### `.modal-footer`
Footer del modal con botones.

**Ejemplo:**
```html
<div class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Título</h3>
            <button class="close-btn">×</button>
        </div>
        <div class="modal-body">
            Contenido
        </div>
        <div class="modal-footer">
            <button class="btn-cancel">Cancelar</button>
            <button class="btn-submit">Guardar</button>
        </div>
    </div>
</div>
```

---

## 🔘 Botones

### `.btn-primary`
Botón principal verde con gradiente y sombra.

### `.btn-secondary`
Botón secundario gris oscuro.

### `.btn-cancel`
Botón de cancelar gris claro.

### `.btn-submit`
Botón de envío verde (usa color primario).

### `.btn-main`
Botón principal verde sólido.

### `.btn-danger`
Botón de peligro rojo.

**Ejemplo:**
```html
<button class="btn-primary">Aceptar Pedido</button>
<button class="btn-secondary">Ver Detalles</button>
<button class="btn-danger">Cancelar</button>
```

---

## 🎴 Cards

### `.card`
Card básica con sombra suave.

### `.card-elevated`
Card elevada con más sombra y borde.

**Ejemplo:**
```html
<div class="card">
    <h3>Título</h3>
    <p>Contenido de la tarjeta</p>
</div>
```

---

## 🏷️ Badges

### `.badge`
Badge base.

### `.badge-primary`
Badge verde (primario).

### `.badge-success`
Badge verde de éxito.

### `.badge-warning`
Badge amarillo de advertencia.

### `.badge-danger`
Badge rojo de peligro.

### `.badge-info`
Badge azul informativo.

**Ejemplo:**
```html
<span class="badge badge-primary">3 pedidos</span>
<span class="badge badge-success">Entregado</span>
<span class="badge badge-warning">Pendiente</span>
```

---

## 📝 Formularios

### `.form-group`
Grupo de formulario con label e input.

```html
<div class="form-group">
    <label>Nombre</label>
    <input type="text" class="form-input">
</div>
```

---

## 📭 Estado Vacío

### `.empty-state`
Componente para mostrar cuando no hay datos.

```html
<div class="empty-state">
    <div class="illustration">
        <svg>...</svg>
    </div>
    <h3>No hay pedidos</h3>
    <p>Cuando recibas pedidos aparecerán aquí</p>
</div>
```

---

## 📋 Encabezados de Sección

### `.section-header`
Encabezado de sección con título.

### `.section-title`
Título de sección en mayúsculas.

```html
<div class="section-header">
    <h3>Mis Pedidos</h3>
</div>
```

---

## 📊 Tablas de Datos

### `.data-table`
Tabla con bordes redondeados.

```html
<div class="data-table">
    <div class="row">Fila 1</div>
    <div class="row">Fila 2</div>
</div>
```

---

## 🎯 Utilidades

### Scrollbar Oculto
```html
<div class="hide-scrollbar">
    Contenido con scroll invisible
</div>
```

### Loading Spinner
```html
<div class="loading-spinner"></div>
```

### Truncar Texto
```html
<p class="text-ellipsis">Texto largo que se corta con...</p>
<p class="text-truncate-2">Texto en 2 líneas máximo</p>
```

### Divisores
```html
<div class="divider"></div>
<div class="divider-thick"></div>
```

---

## 💡 Notas Importantes

1. **No elimines código existente**: Los componentes actuales tienen sus propios estilos. Estas clases son para NUEVOS desarrollos o refactorización gradual.

2. **Prioridad**: Si hay conflicto, los estilos del componente tienen prioridad sobre los globales.

3. **Variables CSS**: Usa las variables definidas en `styles.scss`:
   - `var(--primary-color)` - Verde principal (#00B14F)
   - `var(--card-bg)` - Fondo de tarjetas
   - `var(--text-main)` - Color de texto principal
   - `var(--shadow-sm)` - Sombra pequeña
   - `var(--radius-lg)` - Border radius grande

4. **Testing**: Siempre verifica que los estilos se vean bien en dispositivos móviles.

---

## 🚀 Próximos Pasos

Para refactorizar gradualmente:
1. Identifica un componente pequeño
2. Reemplaza sus estilos con clases comunes
3. Prueba exhaustivamente
4. Repite con otros componentes

**Importante**: NO hagas refactoring masivo. Hazlo de forma incremental para evitar romper la UI existente.
