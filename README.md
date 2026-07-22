# Calendario de Tareas Diarias

Una aplicacion de tareas con calendario que funciona solo en el navegador, creada con JavaScript vanilla, HTML, Tailwind CSS y Vite. Las tareas se asignan a fechas especificas, se ordenan por reglas de prioridad y se guardan localmente con `localStorage`.

## Funcionalidades

- Calendario mensual con semanas que empiezan en lunes y navegacion anterior, siguiente y hoy
- Vista dedicada por dia con secciones de tareas pendientes y completadas
- Crear, editar, eliminar, completar, restaurar e inspeccionar detalles de tareas
- Puntos de tarea del 1 al 10 con validacion en linea
- Contadores de calendario para total, pendientes, completadas y puntos
- Dialogos modales personalizados, confirmacion de eliminacion y notificaciones
- Ruteo por hash con soporte para el boton de volver del navegador
- Diseno adaptable para escritorio, tablet y movil
- Lectura segura de `localStorage` y normalizacion de tareas

## Tecnologias

- HTML5
- JavaScript vanilla con modulos ES6
- Tailwind CSS
- Vite
- `localStorage` del navegador
- Iconos SVG en linea

No se usa backend, base de datos, framework, sistema de autenticacion ni una libreria pesada de calendario.

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build de Produccion

```bash
npm run build
```

## Vista Previa del Build

```bash
npm run preview
```

## Estructura del Proyecto

```text
daily-tasks-calendar/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── storage.js
│   ├── calendar.js
│   ├── tasks.js
│   ├── router.js
│   ├── utils.js
│   └── components/
│       ├── modal.js
│       ├── toast.js
│       └── confirm-dialog.js
└── README.md
```

## Persistencia

Todos los datos de tareas se guardan en el navegador usando una clave estable de `localStorage`:

```text
dailyTasksCalendar.tasks
```

La capa de almacenamiento lee JSON de forma segura, maneja datos faltantes o mal formados, verifica que los datos guardados sean un arreglo, normaliza los campos de las tareas, elimina IDs duplicados y usa una lista vacia cuando necesita recuperarse.

## Modelo de Datos de Tarea

```js
{
  id: "unique-id",
  date: "2026-07-21",
  name: "Terminar reporte del proyecto",
  description: "Revisar el documento final y enviarlo al equipo.",
  points: 8,
  completed: false,
  createdAt: "2026-07-21T15:30:00.000Z",
  updatedAt: "2026-07-21T15:30:00.000Z",
  completedAt: null
}
```

Las claves de fecha usan `YYYY-MM-DD` y se interpretan como fechas locales para evitar problemas de zona horaria. Las marcas de tiempo de eventos usan cadenas ISO.

## Compatibilidad del Navegador

La aplicacion usa APIs modernas del navegador, incluidos modulos ES, `localStorage` y `crypto.randomUUID()`. Incluye un generador de IDs alternativo para navegadores sin `crypto.randomUUID()`. Vite apunta por defecto a navegadores modernos actuales.
