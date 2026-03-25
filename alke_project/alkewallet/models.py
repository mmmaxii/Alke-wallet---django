from django.db import models
from django.contrib.auth.models import User

class Cuenta(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    saldo = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Cuenta de {self.usuario.username}"

class Contacto(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contactos')
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(max_length=254, default="correo@banco.com") # Nuevo campo
    alias = models.CharField(max_length=50)
    banco = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.nombre} ({self.correo})"

class Transaccion(models.Model):
    emisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transferencias_enviadas')
    receptor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transferencias_recibidas')
    titulo = models.CharField(max_length=100)
    monto = models.DecimalField(max_digits=15, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"{self.titulo}: ${self.monto}"

# --- NUEVA FUNCIONALIDAD ---
class Bolsillo(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bolsillos')
    nombre_meta = models.CharField(max_length=100) # Ej: "Simulador de discos protoplanetarios"
    monto_objetivo = models.DecimalField(max_digits=15, decimal_places=2)
    saldo_actual = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.nombre_meta} - ${self.saldo_actual} / ${self.monto_objetivo}"