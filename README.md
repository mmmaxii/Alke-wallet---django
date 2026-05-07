# Alke-Wallet

Alke-Wallet es una plataforma de billetera digital desarrollada desde cero con Python y Django. 

El proyecto combina un backend seguro para el manejo de transacciones con un frontend moderno, destacando el uso de integraciones asíncronas con JavaScript (Fetch API, SweetAlert2, Chart.js) y una estética "Glassmorphism" (cristal esmerilado) en modo oscuro para brindar una experiencia de usuario fluida y limpia.

## Características Principales

1. Autenticación y Seguridad
   - Registro y login integrado con el modelo base `User` de Django.
   - Protección integral de las vistas usando el decorador `@login_required`.
   - Implementación de tokens CSRF en todos los formularios y operaciones AJAX.
   
2. Panel Principal (Dashboard)
   - Resumen del balance actual.
   - Gráfico de comportamiento financiero construido con Chart.js, que permite filtrar dinámicamente el historial (Hoy, 1 Mes, 1 Año, Histórico completo).
   
3. Transacciones y Flujos
   - Depósitos: Interfaz rápida con autollenado de montos para el ingreso directo de fondos.
   - Transferencias: Rutinas con validación silenciosa en tiempo real vía JavaScript (Fetch) para consultar la validez del correo o nombre de usuario de destino, previniendo recargas de página innecesarias.

4. Gestión de Contactos
   - Panel de agenda personal para almacenar información de remitentes frecuentes, simplificando transferencias futuras.
   
5. Historial de Movimientos
   - Integración nativa del sistema de paginación de Django (`Paginator`), diferenciando a nivel visual los ingresos frente a los egresos.
   - Inyección asíncrona de reportes y comprobantes bancarios estéticos apoyándose en SweetAlert2.

6. Mis Bolsillos (Metas de Ahorro)
   - Herramienta para dividir capital de la cuenta principal a sub-cuentas (bolsillos).
   - Aplicación clave de control de atomicidad (`transaction.atomic()`) a nivel base de datos para asegurar que los descuentos y sumas entre billeteras se hagan simultáneamente, eliminando el riesgo de descuadres de dinero por errores de conexión.

7. Personalización y UI/UX
   - Todo el proyecto está envuelto en variables de cristal esmerilado oscuro generadas mediante CSS puro, descartando librerías genéricas para los estilos y componentes.
   - Se inyectan filtros nativos de plantilla (`custom_filters/clp`) que obligan al texto a formatear cifras largas con puntos decimales adaptados (ej: $1.000 en vez de $1,000) de manera programática para subsanar configuraciones regionales rotas del cliente web.
   - El panel de administración oculto (`/admin/`) fue modificado usando variables CSS para mantener exactamente los mismos colores morados y azules oscuros del frontend en las áreas de mantenimiento.

## Entorno Tecnológico

- Backend: Python 3, Django 6.0, SQLite.
- Frontend: HTML5, CSS3, Bootstrap 4 (Grid & layouts).
- Librerías Adicionales: SweetAlert2 (Notificaciones push), Chart.js (Manejo de canvas).

## Guía de Instalación y Ejecución Local

1. Clonar el repositorio y entrar al proyecto:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd alke_project
   ```

2. Crear y activar el entorno virtual:
   ```bash
   python -m venv env
   # En Windows:
   env\Scripts\activate
   # En Mac/Linux:
   source env/bin/activate
   ```

3. Instalar las dependencias de Python:
   ```bash
   pip install django
   ```

4. Aplicar las migraciones a la base de datos (SQLite) local:
   ```bash
   python manage.py makemigrations alkewallet
   python manage.py migrate
   ```

5. Crear un usuario con acceso total (Superusuario):
   ```bash
   python manage.py createsuperuser
   ```

6. Iniciar el servidor en localhost:
   ```bash
   python manage.py runserver
   ```

La aplicación de interfaz de cliente se levantará en `http://127.0.0.1:8000/` y el panel administrativo modificado estará disponible en `http://127.0.0.1:8000/admin/`.