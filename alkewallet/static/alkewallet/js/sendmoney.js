// Usamos los contactos cargados desde Django
let listaContactosLocales = typeof CONTACTOS_DB !== 'undefined' ? CONTACTOS_DB : [];

/*
En lugar de LocalStorage, ahora los contactos vienen del backend de Django en CONTACTOS_DB.
La función cargarContactos dibujará estos contactos provistos por el servidor.
*/

/*
De esta manera creamos primero un "listener" que espera a que todo el HTML esté cargado,
con esto nos aseguramos de que los elementos que queremos manipular ya existen en el DOM.
Aquí verificamos si hay contactos guardados en el LocalStorage y si no, inicializamos con los de ejemplo.
A su vez llamamos a la función que configura los botones (volver y agregar contacto).
*/
document.addEventListener('DOMContentLoaded', () => {
    configurarBotones();
    cargarContactos();
    activarBotonesAccion();
    activarBusquedaContacto();
});

/*
Esta función habilita la búsqueda en tiempo real usando jQuery.
Lo que hace es escuchar cada vez que el usuario escribe algo en el input
y filtra la lista de contactos automáticamente.
*/
function activarBusquedaContacto() {
    // Usamos el selector de jQuery ($) para buscar el input por su ID
    // y el evento "input" detecta cada tecla que se presiona.
    $('#searchContact').on('input', function () {

        // 1. Obtenemos lo que escribió el usuario y lo pasamos a minusculas
        // para que la búsqueda no discrimine entre mayúsculas y minúsculas.
        let query = $(this).val().toLowerCase();

        // 2. Traemos los contactos guardados en la variable local proveída por Django
        const contactos = listaContactosLocales;

        // Si borró todo lo que escribio, mostramos la lista completa de nuevo.
        if (query === '') {
            renderizarLista(contactos);
            return;
        }

        /* 
        3. Lógica de PRIORIDAD para el filtro.
        Como definimos antes, el orden de importancia es:
        Primero por Nombre -> Luego por Alias -> Finalmente por CBU
        */

        // Buscamos coincidencia por Nombre
        const matchesNombre = contactos.filter(c => c.nombre.toLowerCase().includes(query));

        // Buscamos coincidencia por Alias
        // ¡Ojo! Aquí validamos que el contacto NO este ya en la lista de nombres
        // para que no aparezca repetido en pantalla.
        const matchesAlias = contactos.filter(c =>
            c.alias.toLowerCase().includes(query) &&
            !matchesNombre.includes(c)
        );

        // 4. Unimos las tres listas en el orden que queremos usando el Spread Operator (...)
        // Esto crea una lista única ordenada por prioridad.
        const resultadosFinales = [...matchesNombre, ...matchesAlias];

        // 5. Validamos si hay resultados
        if (resultadosFinales.length === 0) {
            // Si no hay coincidencias, mostramos un componente Empty State estilo Glassmorphism
            // Usamos jQuery para inyectar el HTML directamente en la lista
            $('#listaContactos').html(`
                <div class="text-center" style="background: rgba(255, 255, 255, 0.05); border: 1px dashed rgba(255, 255, 255, 0.3); border-radius: 12px; padding: 25px; color: rgba(255, 255, 255, 0.8); margin-top: 10px;">
                    <i class="fas fa-search" style="font-size: 2.5rem; color: rgba(255, 255, 255, 0.15); margin-bottom: 15px; display: block;"></i>
                    <p style="margin: 0; font-weight: 500;">No se encontraron contactos que coincidan con tu búsqueda.</p>
                </div>
            `);
        } else {
            // 6. Si hay resultados, llamamos a nuestra función de renderizado normal
            renderizarLista(resultadosFinales);
        }
    });
}


function configurarBotones() {
    // Botón Volver
    document.getElementById('btnVolver').addEventListener('click', (e) => {
        e.preventDefault();
        cambiarPagina('/menu/', 'Menú Principal');
    });

    // Botón Agregar Contacto 
    const btnAgregar = document.querySelector('.btn-outline-primary'); // El botón de "+ Agregar"
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarContactoNuevo);
    }
}


function cambiarPagina(url, nombrePagina) {
    Swal.fire({
        title: 'Redirigiendo a ' + nombrePagina,
        html: '<p style="margin-top: 10px;">Procesando solicitud...</p>',

        icon: 'info',
        iconColor: '#ffffff',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,

        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
        color: '#ffffff',

        showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOut animate__faster'
        },

        // Estilo de la barrita de carga (blanca semitransparente)
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('.swal2-timer-progress-bar');
            if (b) b.style.backgroundColor = 'rgba(255,255,255,0.5)';
        },

        allowOutsideClick: false
    }).then(() => {
        window.location.href = url;
    });
}




function cargarContactos() {
    renderizarLista(listaContactosLocales);
}


function renderizarLista(contactos) {
    const contenedor = document.getElementById('listaContactos');
    contenedor.innerHTML = ''; // Limpiamos la lista antes de dibujar

    // Recorremos el Array (Bucle)
    contactos.forEach((contacto) => {
        // Creamos un lop donde se renderiza cada contacto que le agremaos
        // en el HTML.

        const itemHTML = `
            <li class="list-group-item contact-item" onclick="seleccionarContacto('${contacto.nombre}')">
                <div class="contact-name">${contacto.nombre}</div>
                <div class="contact-details">
                    Alias: ${contacto.alias} · Banco: ${contacto.banco}
                </div>
            </li>
        `;

        // Lo agregamos al HTML
        contenedor.innerHTML += itemHTML;
    });
}




/*
Esta funcion se encarga de mostrar el popup para agregar un nuevo contacto.
Luego valida los datos ingresados y si todo está bien, lo guarda en el LocalStorage
y actualiza la lista en pantalla.
*/

function agregarContactoNuevo() {
    Swal.fire({
        title: 'Nuevo Contacto',
        width: '550px',
        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
        color: '#ffffff',
        html: `
            <style>
                .swal2-input {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    border-radius: 12px !important;
                    color: white !important;
                    font-size: 0.95rem !important;
                    width: 85% !important;
                    max-width: 100% !important;
                }
                .swal2-input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
                .swal2-validation-message { background: rgba(0, 0, 0, 0.2) !important; color: #ffcccc !important; }
            </style>
            
            <input id="input-nombre" class="swal2-input" placeholder="Nombre y Apellido">
            <input id="input-alias" class="swal2-input" placeholder="Alias de Contacto">
            <input id="input-correo" class="swal2-input" placeholder="Correo Electrónico (obligatorio)">
            <input id="input-banco" class="swal2-input" placeholder="Nombre del Banco">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<span style="color: #582551; font-weight: bold;">Guardar</span>',
        confirmButtonColor: '#ffffff',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#480ca8',
        showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
        hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
        preConfirm: () => {
            const nombre = document.getElementById('input-nombre').value;
            const alias = document.getElementById('input-alias').value;
            const correo = document.getElementById('input-correo').value;
            const banco = document.getElementById('input-banco').value;

            if (!nombre || !alias || !correo || !banco) {
                Swal.showValidationMessage('Por favor completa todos los campos');
                return false;
            }

            return { nombre, alias, correo, banco };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const dataContacto = result.value;

            fetch('/add_contact/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': typeof csrfToken !== 'undefined' ? csrfToken : ''
                },
                body: JSON.stringify(dataContacto)
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    // Agregamos el nuevo a la lista local para ver el cambio instantáneo
                    listaContactosLocales.push(dataContacto);
                    renderizarLista(listaContactosLocales);

                    Swal.fire({
                        title: '¡Guardado!',
                        text: data.message,
                        icon: 'success',
                        iconColor: '#ffffff',
                        timer: 2000,
                        showConfirmButton: false,
                        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                        color: '#ffffff'
                    });
                } else {
                     Swal.fire({
                        title: 'Error',
                        text: data.message,
                        icon: 'error',
                        iconColor: '#ffffff',
                        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                        color: '#ffffff',
                        confirmButtonColor: '#ffffff',
                        confirmButtonText: '<span style="color: #582551; font-weight: bold;">Entendido</span>'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error', 'Hubo un problema de conexión', 'error');
            });
        }
    });
}

/*
Ahora nos preocuparmos por los botones de Enviar dinero y Eliminar Contactao
*/

// La necesitamos para guardar "en memoria" a quién le hiciste clic
let indiceSeleccionado = null;

/* Función encargada de gestionar la selección de un contacto.
Realiza dos tareas principales: 
1. Actualizar el estado lógico (saber qué índice se eligió).
2. Actualizar el estado visual (resaltar el elemento en el HTML).
*/
function seleccionarContacto(nombre) {

    // --- PASO 1: FEEDBACK VISUAL INMEDIATO ---
    // Rellenamos el input de búsqueda con el nombre para que el usuario 
    // tenga una confirmación visual clara de a quién seleccionó.
    document.getElementById('searchContact').value = nombre;


    // --- Paso 2: Busqueda en la base de datos que tenemos  (Lista generada por Django) ---
    const contactos = listaContactosLocales;

    // Usamos el método .findIndex() para localizar la posición exacta (0, 1, 2...)
    // del contacto dentro del Array. 
    // Comparamos el nombre del contacto en memoria con el nombre que recibimos por parámetro.
    indiceSeleccionado = contactos.findIndex(contacto => contacto.nombre === nombre);


    // --- PASO 3: MANIPULACIÓN DEL DOM (CAMBIO DE ESTILOS) ---
    // Seleccionamos todos los elementos de la lista renderizada en el HTML (los <li>)
    // para poder manipular sus clases CSS.
    const itemsHTML = document.querySelectorAll('.contact-item');

    // Primero, recorremos TODOS los elementos y les quitamos la clase 'active-contact'
    // que indica cuando el mouse esta por encima.
    // Esto sirve para "des-seleccionar" cualquier contacto que estuviera marcado antes.

    itemsHTML.forEach(item => item.classList.remove('active-contact'));

    // Finalmente, si encontramos un índice válido (distinto de -1),
    // le agregamos la clase de estilo activo SOLO a ese elemento específico.
    if (indiceSeleccionado !== -1 &&
        itemsHTML[indiceSeleccionado] // existe. Manias de astro.
    ) {
        itemsHTML[indiceSeleccionado].classList.add('active-contact');
    }
}



/* Configura los "Listeners" para los botones de acción.
Gestiona la lógica de eliminación (actualizando el Array) y el envío de dinero (actualizando el saldo).
*/
function activarBotonesAccion() {

    // --- LÓGICA BOTÓN ELIMINAR ---
    const btnEliminar = document.getElementById('btnEliminarContacto');

    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => {
            if (indiceSeleccionado === null) {
                // Alerta: Atención 
                Swal.fire({
                    title: 'Atención',
                    text: 'Primero selecciona un contacto de la lista para eliminarlo.',
                    icon: 'warning',
                    iconColor: '#ffffff',
                    background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                    color: '#ffffff',
                    confirmButtonColor: '#ffffff',
                    confirmButtonText: '<span style="color: #582551; font-weight: bold;">Entendido</span>'
                });
                return;
            }

            // Alerta: Confirmación de Borrado 
            Swal.fire({
                title: '¿Estás seguro?',
                text: "Vas a eliminar a este contacto permanentemente.",
                icon: 'warning',
                iconColor: '#ffffff',
                background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                color: '#ffffff',

                showCancelButton: true,

                // Botón Eliminar (Rojo brillante para peligro)
                confirmButtonColor: '#ff4d4d',
                confirmButtonText: 'Sí, eliminar',

                // Botón Cancelar (Morado oscuro)
                cancelButtonColor: '#480ca8',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const contactoDestino = listaContactosLocales[indiceSeleccionado];

                    fetch('/delete_contact/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': typeof csrfToken !== 'undefined' ? csrfToken : ''
                        },
                        body: JSON.stringify({ correo: contactoDestino.correo })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            listaContactosLocales.splice(indiceSeleccionado, 1);
                            renderizarLista(listaContactosLocales);

                            indiceSeleccionado = null;
                            document.getElementById('searchContact').value = '';

                            Swal.fire({
                                title: 'Eliminado',
                                text: 'El contacto ha sido borrado.',
                                icon: 'success',
                                iconColor: '#ffffff',
                                background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                                color: '#ffffff',
                                showConfirmButton: false,
                                timer: 1500
                            });
                        } else {
                            Swal.fire('Error', data.message, 'error');
                        }
                    });
                }
            });
        });
    }

    // --- LÓGICA BOTÓN ENVIAR DINERO ---
    const btnEnviar = document.getElementById('btnEnviarDinero');

    if (btnEnviar) {
        btnEnviar.addEventListener('click', () => {
            if (indiceSeleccionado === null) {
                // Alerta: Atención
                Swal.fire({
                    title: 'Atención',
                    text: 'Selecciona un contacto para enviarle dinero.',
                    icon: 'info',
                    iconColor: '#ffffff',
                    background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                    color: '#ffffff',
                    confirmButtonColor: '#ffffff',
                    confirmButtonText: '<span style="color: #582551; font-weight: bold;">Entendido</span>'
                });
                return;
            }

            // Recuperamos el objeto contactoDestino
            const contactoDestino = listaContactosLocales[indiceSeleccionado];

            let saldoActual = parseFloat(SALDO_ACTUAL_DB);

            // Alerta: Ingreso de Monto +
            Swal.fire({
                title: `Enviar a ${contactoDestino.nombre}`, // Muestra el nombre en el título

                // Inyectamos estilos CSS aquí para el Input
                html: `
                    <style>
                        .swal2-input {
                            background: rgba(255, 255, 255, 0.05) !important;
                            border: 1px solid rgba(255, 255, 255, 0.3) !important;
                            color: white !important;
                            font-size: 0.95rem !important;
                        }
                        .swal2-input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
                        .swal2-validation-message { background: rgba(0,0,0,0.2) !important; color: #ffcccc !important; }
                    </style>
                    <p>Saldo disponible: <b>$${parseFloat(saldoActual).toLocaleString('de-DE', {maximumFractionDigits: 0})}</b></p>
                    <p style="margin-top:10px; font-size: 0.9em;">Ingresa el monto:</p>
                `,

                input: 'number',
                inputAttributes: { min: 0, step: 1 },
                // Esto segun sweetalert es; min: minimo que puede tener el input, step: avanza de 1 en 1 si se hace 
                // con la barra que esta a la derecha del input.

                background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                color: '#ffffff',

                showCancelButton: true,

                // Botón Transferir (Blanco)
                confirmButtonColor: '#ffffff',
                confirmButtonText: '<span style="color: #582551; font-weight: bold;">Transferir</span>',

                // Botón Cancelar (Morado oscuro)
                cancelButtonColor: '#480ca8',
                cancelButtonText: 'Cancelar',

                preConfirm: (monto) => {
                    if (!monto || monto <= 0) {
                        Swal.showValidationMessage('Ingresa un monto válido mayor a 0');
                    }
                    return monto;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const montoEnviar = parseFloat(result.value);

                    // Volvemos a leer saldo por seguridad
                    // Enviamos al backend vía fetch
                    fetch('/sendmoney/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': typeof csrfToken !== 'undefined' ? csrfToken : ''
                        },
                        body: JSON.stringify({
                            username: contactoDestino.correo, // Utilizamos el correo insertado para buscar al usuario
                            monto: montoEnviar
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                title: '¡Envío Exitoso!',
                                text: data.message,
                                icon: 'success',
                                iconColor: '#ffffff',
                                background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                                color: '#ffffff',
                                showConfirmButton: false,
                                timer: 2000
                            }).then(() => {
                                window.location.href = '/menu/';
                            });
                        } else {
                            Swal.fire({
                                title: 'Error',
                                text: data.message,
                                icon: 'error',
                                iconColor: '#ffffff',
                                background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
                                color: '#ffffff',
                                confirmButtonColor: '#ffffff',
                                confirmButtonText: '<span style="color: #582551; font-weight: bold;">Entendido</span>'
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        Swal.fire('Error', 'Hubo un problema de conexión', 'error');
                    });
                }
            });
        });
    }
}



// Funciones del lado del servidor manejan el registro