from django import template

register = template.Library()

@register.filter(name='clp')
def clp(value):
    """
    Convierte un valor numérico a formato moneda chilena estricto (CLP).
    Ejemplo: 1500000.50 -> 1.500.000
    Garantiza puntos para los miles en lugar de depender de configuraciones regionales del SO.
    """
    try:
        val = int(round(float(value)))
        # Formatear usando la sintaxis moderna con coma para miles, y luego reemplazar coma por punto
        formateo_coma = f"{val:,}"
        return formateo_coma.replace(",", ".")
    except (ValueError, TypeError):
        return value
