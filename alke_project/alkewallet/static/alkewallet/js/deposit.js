const CLAVE_HISTORIAL = "wallet_historial";
// Agregado de un comentario para ver que pasa con git.
const btnVolver = document.getElementById('btnVolver');

/*Hace lo mismo que se hace en menu.js*/

btnVolver.addEventListener('click', (e) => {
    e.preventDefault();

    cambiarPagina('/menu/', 'Menú Principal');
});

// Función rápida para los botones predeterminados (Smart Pills)
window.setMonto = function(valor) {
    const inputAmount = document.getElementById('depositAmount');
    // Sumar al monto que ya exista
    let current = parseFloat(inputAmount.value) || 0;
    inputAmount.value = current + valor;
};

// Este bloque de codigo lo he reutilizado hartas veces, estaria bueno automatizarlo como una funcion exportable.

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

// Utilizo este event listener para interceptar el formulario temporalmente.
// Así puedo lanzar la alerta estética de "Procesando" antes de enviar los datos al backend.

const form = document.getElementById('depositForm');

form.addEventListener('submit', (e) => {
    // Evitamos enviar de golpe
    e.preventDefault();

    const inputMonto = document.getElementById('depositAmount');
    const montoIngresado = parseFloat(inputMonto.value);

    // Validación igual que antes
    if (isNaN(montoIngresado) || montoIngresado <= 0) {
        Swal.fire('Error', 'Ingresa un monto válido', 'error');
        return;
    }

    // Mostramos que estamos procesando usando la misma estética
    Swal.fire({
        title: 'Procesando Depósito...',
        html: '<p style="margin-top: 10px;">Enviando a la base de datos segura...</p>',
        icon: 'info',
        iconColor: '#ffffff',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
        color: '#ffffff',
        allowOutsideClick: false,
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('.swal2-timer-progress-bar');
            if (b) b.style.backgroundColor = 'rgba(255,255,255,0.5)';
        }
    }).then(() => {
        // Una vez que termina la animación de procesamiento, enviamos el form a Django
        form.submit();
    });
});

