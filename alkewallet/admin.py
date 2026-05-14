from django.contrib import admin
from .models import Cuenta, Transaccion, Contacto, Bolsillo

# Personalizamos el título del panel de administración
admin.site.site_header = "Administración de Alke Wallet"
admin.site.site_title = "Alke Wallet Portal"
admin.site.index_title = "Bienvenido al portal de administración"

@admin.register(Cuenta)
class CuentaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'saldo')
    search_fields = ('usuario__username', 'usuario__email')
    list_filter = ('saldo',)

@admin.register(Transaccion)
class TransaccionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'emisor', 'receptor', 'monto', 'fecha')
    search_fields = ('titulo', 'emisor__username', 'emisor__first_name', 'receptor__username')
    list_filter = ('fecha',)
    date_hierarchy = 'fecha'

@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'alias', 'banco', 'usuario')
    search_fields = ('nombre', 'alias')

@admin.register(Bolsillo)
class BolsilloAdmin(admin.ModelAdmin):
    list_display = ('nombre_meta', 'saldo_actual', 'monto_objetivo', 'usuario')
    search_fields = ('nombre_meta',)
