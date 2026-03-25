const botons = document.querySelectorAll(".btn");

/* Reutilizamos el codigo de la calculadora que hicimos*/

botons.forEach(boton => {
    boton.addEventListener("click", (e) => {
        let url = "";
        let nombrePagina = "";

        if (boton.id === "depositButton") {
            url = "/deposit/";
            nombrePagina = "Depósitos";
        } else if (boton.id === "sendMoneyButton") {
            url = "/sendmoney/";
            nombrePagina = "Enviar Dinero";
        } else if (boton.id === "transactionsButton") {
            url = "/transactions/";
            nombrePagina = "Transacciones";
        } else if (boton.id === "bolsillosButton") {
            url = "/bolsillos/";
            nombrePagina = "Mis Bolsillos";
        } else if (boton.id === "logoutButton") {
            url = "/logout/";
            nombrePagina = "Cerrando Sesión";
        } else {
            // Si el botón no tiene ninguno de los IDs anteriores, dejamos que funcione normalmente
            return; 
        }

        e.preventDefault();
        cambiarPagina(url, nombrePagina);
    });
});

function cambiarPagina(url, nombrePagina) {
    Swal.fire({
        // Usamos el nombre de la página como título principal
        title: nombrePagina, 
        html: '<p style="margin-top:8px;">Redirigiendo...</p>',
        
        // Icono de información, pero en blanco para que resalte
        icon: 'info',
        iconColor: '#ffffff',

        showConfirmButton: false,
        timer: 1500, // Un poco más rápido que el login (1.5 seg) para que sea ágil
        timerProgressBar: true,

        // El mismo fondo gradiente del Login
        background: 'linear-gradient(135deg, #3c096c, #7b2cbf)',
        color: '#ffffff',

        // Las mismas animaciones
        showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOut animate__faster'
        },

        // Personalización de la barra de progreso (blanca semitransparente)
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('.swal2-timer-progress-bar');
            if (b) b.style.backgroundColor = 'rgba(255,255,255,0.5)';
        },

        allowOutsideClick: false
    }).then(() => {
        window.location.href = url;
    });
}

// ----------------------------------------------------
// ---- Lógica del Gráfico Interactivo (Chart.js) ----
// ----------------------------------------------------

let myChart = null;
let fullBalanceHistory = [];

function initChartData() {
    if (typeof HISTORY_DATA === 'undefined') return;
    
    fullBalanceHistory = [];
    
    // Calcula los balances hacia atrás partiendo del actual
    let runningBalance = CURRENT_BALANCE;
    let tempHistory = [];
    
    // Insertamos el punto del saldo actual ("ahora")
    tempHistory.push({
        date: new Date(),
        val: runningBalance
    });
    
    // Recorremos de la transacción más nueva a la más antigua
    for (let i = HISTORY_DATA.length - 1; i >= 0; i--) {
        let tx = HISTORY_DATA[i];
        
        // Si fue ingreso, deshacemos restando para conocer el saldo anterior
        // Si fue gasto, deshacemos sumando
        if (tx.es_ingreso) {
            runningBalance -= tx.monto;
        } else {
            runningBalance += tx.monto;
        }
        
        let txDate = new Date(tx.fecha);
        tempHistory.push({
            date: txDate,
            val: runningBalance
        });
    }
    
    // Lo invertimos para que esté en orden cronológico (izquierda a derecha)
    fullBalanceHistory = tempHistory.reverse();
    
    // Por defecto renderizamos todo ('ALL')
    renderChart(fullBalanceHistory);
}

function filterDataByRange(range) {
    if (range === 'ALL') return fullBalanceHistory;
    
    const now = new Date();
    let cutoff = new Date();
    
    if (range === '1D') cutoff.setDate(now.getDate() - 1);
    if (range === '1M') cutoff.setMonth(now.getMonth() - 1);
    if (range === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
    
    let filtered = fullBalanceHistory.filter(item => item.date >= cutoff);
    
    // Si el rango recortó todo (no hay datos en ese periodo), creamos una linea plana
    if (filtered.length === 0) {
        filtered = [
            { date: cutoff, val: CURRENT_BALANCE },
            { date: now, val: CURRENT_BALANCE }
        ];
    } else if (filtered.length === 1) {
        // Si solo hay un punto, extendemos la linea hacia atrás
        filtered.unshift({ date: cutoff, val: filtered[0].val });
    }
    
    return filtered;
}

function renderChart(dataPoints) {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;
    
    const labels = dataPoints.map(d => {
        return d.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    });
    const values = dataPoints.map(d => d.val);
    
    if (myChart) {
        myChart.destroy(); // Destruir gráfico anterior antes de redibujar
    }
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo Disponible',
                data: values,
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#00d2ff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Efecto suave (Bezier curve)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' $' + context.parsed.y.toLocaleString('de-DE', {maximumFractionDigits: 0});
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return '$' + value.toLocaleString('de-DE', {maximumFractionDigits: 0});
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });
}

// Expone la función de manera global para los botones del HTML
window.updateChart = function(range, btnElement) {
    const btns = document.querySelectorAll('#chartFilters .btn');
    btns.forEach(b => b.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }
    
    let filteredData = filterDataByRange(range);
    renderChart(filteredData);
};

document.addEventListener('DOMContentLoaded', () => {
    initChartData();
});
