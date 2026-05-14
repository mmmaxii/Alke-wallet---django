let listaBolsillosLocales = typeof BOLSILLOS_DB !== 'undefined' ? BOLSILLOS_DB : [];
let indiceBolsilloSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
    renderizarBolsillos(listaBolsillosLocales);
    configurarBotonesGenerales();
    configurarBotonesAccion();
});

function renderizarBolsillos(bolsillos) {
    const contenedor = document.getElementById('listaBolsillos');
    contenedor.innerHTML = '';

    if (bolsillos.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center my-4" style="color: rgba(255,255,255,0.7);">
                No tienes bolsillos activos.<br>¡Crea uno para empezar a ahorrar!
            </div>
        `;
        document.getElementById('accionesBolsillo').style.setProperty('display', 'none', 'important');
        return;
    }

    bolsillos.forEach((b, index) => {
        const saldoFmt = parseFloat(b.saldo_actual).toLocaleString('de-DE', {maximumFractionDigits: 0});
        const metaFmt = parseFloat(b.monto_objetivo).toLocaleString('de-DE', {maximumFractionDigits: 0});
        
        const itemHTML = `
            <div class="bolsillo-item" onclick="seleccionarBolsillo(${index})">
                <div class="d-flex justify-content-between font-weight-bold mb-1">
                    <span style="font-size: 1.1em;">${b.nombre_meta}</span>
                    <span style="color: #00d2ff;">$${saldoFmt} / $${metaFmt}</span>
                </div>
                <!-- Barrita redonda. Al estar position: relative, nos permite "flotar" texto encima -->
                <div class="progress" style="height: 16px; border-radius: 8px; position: relative;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${b.progreso}%; border-radius: 8px;" 
                         aria-valuenow="${b.progreso}" aria-valuemin="0" aria-valuemax="100">
                    </div>
                    <!-- Contenedor absoluto que cubre todo el ancho de la barra gris para centrar perfecto el texto -->
                    <div style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;">
                        ${b.progreso}%
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += itemHTML;
    });

    if (indiceBolsilloSeleccionado !== null && bolsillos[indiceBolsilloSeleccionado]) {
        seleccionarBolsillo(indiceBolsilloSeleccionado);
    } else {
        document.getElementById('accionesBolsillo').style.setProperty('display', 'none', 'important');
    }
}

function seleccionarBolsillo(index) {
    indiceBolsilloSeleccionado = index;
    const itemsHTML = document.querySelectorAll('.bolsillo-item');
    itemsHTML.forEach(item => item.classList.remove('active-bolsillo'));

    if (itemsHTML[index]) {
        itemsHTML[index].classList.add('active-bolsillo');
        document.getElementById('accionesBolsillo').style.setProperty('display', 'flex', 'important');
    }
}

function configurarBotonesGenerales() {
    document.getElementById('btnCrearBolsillo').addEventListener('click', () => {
        Swal.fire({
            title: 'Nueva Meta de Ahorro',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            color: '#ffffff',
            html: `
                <style>
                    .swal2-input {
                        background: rgba(255, 255, 255, 0.05) !important;
                        border: 1px solid rgba(255, 255, 255, 0.3) !important;
                        border-radius: 12px !important;
                        color: white !important;
                    }
                    .swal2-input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
                </style>
                <input id="bolsillo-nombre" class="swal2-input" placeholder="Nombre de tu meta (ej: Viaje)">
                <input id="bolsillo-monto" type="number" class="swal2-input" placeholder="Monto objetivo a ahorrar" min="1" step="1">
            `,
            showCancelButton: true,
            confirmButtonColor: '#ffffff',
            confirmButtonText: '<span style="color: #24243e; font-weight: bold;">Crear Bolsillo</span>',
            cancelButtonColor: '#480ca8',
            cancelButtonText: 'Cancelar',
            showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
            preConfirm: () => {
                const nombre = document.getElementById('bolsillo-nombre').value;
                const monto = parseFloat(document.getElementById('bolsillo-monto').value);

                if (!nombre || !monto || monto <= 0) {
                    Swal.showValidationMessage('Ingresa un nombre y un monto válido');
                    return false;
                }
                return { nombre_meta: nombre, monto_objetivo: monto };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                enviarPeticion('/create_bolsillo/', result.value);
            }
        });
    });
}

function configurarBotonesAccion() {
    document.getElementById('btnIngresarDinero').addEventListener('click', () => {
        const bolsillo = listaBolsillosLocales[indiceBolsilloSeleccionado];
        solicitarMonto('Aportar a ' + bolsillo.nombre_meta, '¿Cuánto dinero quieres transferir desde tu cuenta principal?', '<span style="color: #24243e; font-weight: bold;">Transferir Aporte</span>', (monto) => {
            enviarPeticion('/fund_bolsillo/', { id: bolsillo.id, monto: monto });
        });
    });

    document.getElementById('btnRetirarDinero').addEventListener('click', () => {
        const bolsillo = listaBolsillosLocales[indiceBolsilloSeleccionado];
        solicitarMonto('Retirar de ' + bolsillo.nombre_meta, '¿Cuánto dinero quieres devolver a tu cuenta principal?', '<span style="color: #24243e; font-weight: bold;">Confirmar Retiro</span>', (monto) => {
            enviarPeticion('/withdraw_bolsillo/', { id: bolsillo.id, monto: monto });
        });
    });

    document.getElementById('btnEliminarBolsillo').addEventListener('click', () => {
        const bolsillo = listaBolsillosLocales[indiceBolsilloSeleccionado];
        Swal.fire({
            title: '¿Eliminar bolsillo?',
            text: 'Todo el dinero ahorrado ($' + parseFloat(bolsillo.saldo_actual).toLocaleString('de-DE', {maximumFractionDigits: 0}) + ') regresará automáticamente a tu saldo principal.',
            icon: 'warning',
            iconColor: '#ff4d4d',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            color: '#ffffff',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            confirmButtonText: 'Sí, eliminar meta',
            cancelButtonColor: '#480ca8',
            showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
        }).then((result) => {
            if (result.isConfirmed) {
                enviarPeticion('/delete_bolsillo/', { id: bolsillo.id });
            }
        });
    });
}

function solicitarMonto(titulo, texto, btnTexto, callback) {
    Swal.fire({
        title: titulo,
        html: `
            <style>
                .swal2-input {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    color: white !important;
                }
                .swal2-input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
                .swal2-validation-message { background: rgba(0,0,0,0.2) !important; color: #ffcccc !important; }
            </style>
            <p>${texto}</p>
        `,
        input: 'number',
        inputAttributes: { min: 1, step: 1 },
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        color: '#ffffff',
        showCancelButton: true,
        confirmButtonColor: '#ffffff',
        confirmButtonText: btnTexto,
        cancelButtonColor: '#480ca8',
        cancelButtonText: 'Cancelar',
        showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
        hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
        preConfirm: (m) => {
            if (!m || m <= 0) {
                Swal.showValidationMessage('Ingresa un monto válido mayor a 0');
                return false;
            }
            return parseFloat(m);
        }
    }).then(result => {
        if (result.isConfirmed) { callback(result.value); }
    });
}

function enviarPeticion(endpoint, data) {
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': typeof csrfToken !== 'undefined' ? csrfToken : ''
        },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            Swal.fire({
                title: '¡Éxito!', text: d.message, icon: 'success', 
                background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', color: '#ffffff', timer: 1500, showConfirmButton: false,
                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
            }).then(() => location.reload()); // Recarga para actualizar las barras y saldos con fuente confiable
        } else {
            Swal.fire({
                title: 'Error', text: d.message, icon: 'error',
                background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', color: '#ffffff',
                confirmButtonColor: '#ffffff',
                confirmButtonText: '<span style="color: #24243e; font-weight: bold;">Entendido</span>',
                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
            });
        }
    })
    .catch(e => {
        console.error(e);
        Swal.fire({
            title: 'Error', text: 'Hubo un problema de conexión', icon: 'error',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', color: '#ffffff'
        });
    });
}
