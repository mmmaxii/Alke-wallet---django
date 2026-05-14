// Decidí eliminar la antigua lógica de jQuery y LocalStorage.
// Ahora todo se procesa en el servidor de Django para mayor seguridad.
// Solo mantengo la transición animada del botón "Volver" para no perder la estética.

$(document).ready(function() {
    $('#btnVolver').click(function(e) {
        e.preventDefault();
        cambiarPagina('/menu/', 'Menú Principal');
    });
});

// Función centralizada para las transiciones animadas de vista en vista
function cambiarPagina(url, nombrePagina) {
    Swal.fire({
        title: 'Redirigiendo a ' + nombrePagina,
        html: '<p style="margin-top: 10px;">Cargando información segura...</p>',
        icon: 'info',
        iconColor: '#ffffff',        
        timer: 1500, 
        timerProgressBar: true,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
        color: '#ffffff',        
        showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
        hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('.swal2-timer-progress-bar');
            if (b) b.style.backgroundColor = 'rgba(255,255,255,0.5)';
        },
        allowOutsideClick: false
    }).then(() => {
        window.location.href = url;
    });
}

function showTransactionDetails(titulo, monto, fecha, tipo) {
    Swal.fire({
        title: 'Boleta de Transacción',
        html: `
            <div style="text-align: left; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; font-family: monospace; color: #fff; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);">
                <div style="border-bottom: 2px dashed rgba(255,255,255,0.2); padding-bottom: 15px; margin-bottom: 15px;">
                    <h5 style="margin: 0; text-align: center; color: #00d2ff; letter-spacing: 2px; text-shadow: 0 0 10px rgba(0,210,255,0.5);">ALKE WALLET</h5>
                    <p style="margin: 0; text-align: center; font-size: 0.85em; color: rgba(255,255,255,0.6); text-transform: uppercase;">Comprobante de Operación</p>
                </div>
                <p style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.8);">Tipo:</strong> <span style="float: right;">${tipo}</span></p>
                <p style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.8);">Motivo:</strong> <span style="float: right;">${titulo}</span></p>
                <p style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.8);">Fecha:</strong> <span style="float: right;">${fecha}</span></p>
                <div style="border-top: 2px dashed rgba(255,255,255,0.2); padding-top: 15px; margin-top: 15px; font-size: 1.2em; color: #00d2ff;">
                    <p style="margin: 0;"><strong>MONTO:</strong> <span style="float: right; font-weight: bold;">$${parseFloat(monto).toLocaleString('de-DE', {maximumFractionDigits: 0})}</span></p>
                </div>
            </div>
        `,
        icon: 'success',
        iconColor: '#00d2ff',
        confirmButtonText: 'Cerrar Recibo',
        showClass: { popup: 'animate__animated animate__zoomIn animate__faster' },
        hideClass: { popup: 'animate__animated animate__zoomOut animate__faster' }
    });
}