from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from .models import Cuenta, Transaccion, Contacto, Bolsillo
from decimal import Decimal
from django.db.models import Q
from django.db import transaction

def login_view(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        user = authenticate(request, username=u, password=p)
        if user is not None:
            login(request, user)
            return redirect('menu')
        else:
            messages.error(request, 'Usuario o contraseña incorrectos.')
    return render(request, 'alkewallet/index.html')

def registro(request):
    if request.method == 'POST':
        nombre = request.POST.get('first_name')
        email = request.POST.get('username')
        password = request.POST.get('password')
        
        if User.objects.filter(username=email).exists():
            messages.error(request, 'El correo ya está registrado.')
        else:
            user = User.objects.create_user(username=email, email=email, password=password, first_name=nombre)
            Cuenta.objects.create(usuario=user, saldo=0.00)
            login(request, user)
            return redirect('menu')
            
    return render(request, 'alkewallet/register.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required(login_url='login')
def deposit(request):
    if request.method == 'POST':
        # Obtengo el monto enviado por el formulario HTML de depósito
        monto_str = request.POST.get('monto')
        if monto_str:
            monto_decimal = Decimal(monto_str)
            
            # Consulto la cuenta de mi usuario actualmente conectado
            cuenta_usuario = Cuenta.objects.get(usuario=request.user)
            
            # Sumo el monto a mi saldo y guardo los cambios en SQLite (uso Decimal para evitar problemas de precisión)
            cuenta_usuario.saldo += monto_decimal
            cuenta_usuario.save()
            
            # Registro automáticamente la transacción en mi historial
            Transaccion.objects.create(
                emisor=request.user,
                receptor=request.user,
                titulo="Depósito en Billetera",
                monto=monto_decimal
            )
            
            # Preparo el mensaje de éxito que luego interceptaré con SweetAlert en la vista del menú
            messages.success(request, f"¡Agregaste exitosamente ${monto_decimal} a tu billetera!")
            return redirect('menu')
            
    return render(request, 'alkewallet/deposit.html')

@login_required(login_url='login')
def menu(request):
    # Busco la cuenta específica de este usuario
    cuenta_usuario = Cuenta.objects.get(usuario=request.user)
    
    # Obtener historial para el gráfico (orden cronológico)
    movimientos = Transaccion.objects.filter(
        Q(emisor=request.user) | Q(receptor=request.user)
    ).order_by('fecha')
    
    history_data = []
    for mov in movimientos:
        titulo = mov.titulo or ""
        es_ingreso = False
        
        # Misma lógica de visualización que en transacciones
        if 'Aporte' in titulo:
            es_ingreso = False
        elif 'Retiro' in titulo or 'Cierre' in titulo:
            es_ingreso = True
        elif mov.emisor == mov.receptor or mov.receptor == request.user:
            es_ingreso = True
            
        history_data.append({
            'fecha': mov.fecha.isoformat(),
            'monto': float(mov.monto),
            'es_ingreso': es_ingreso
        })

    contexto = {
        'saldo': cuenta_usuario.saldo,
        'history_json': json.dumps(history_data)
    }
    return render(request, 'alkewallet/menu.html', contexto)

from django.http import JsonResponse
import json

@login_required(login_url='login')
def sendmoney(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username_destino = data.get('username')
            monto_str = data.get('monto')
            
            monto_decimal = Decimal(str(monto_str))
            if monto_decimal <= 0:
                return JsonResponse({'success': False, 'message': 'El monto debe ser mayor a 0.'})
            
            cuenta_origen = Cuenta.objects.get(usuario=request.user)
            if cuenta_origen.saldo < monto_decimal:
                return JsonResponse({'success': False, 'message': 'Saldo insuficiente.'})
            
            try:
                usuario_destino = User.objects.get(username=username_destino)
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'message': f'La persona con alias/email "{username_destino}" no existe en la base de datos.'})
                
            if request.user == usuario_destino:
                return JsonResponse({'success': False, 'message': 'No puedes enviarte dinero a ti mismo.'})
                
            cuenta_destino = Cuenta.objects.get(usuario=usuario_destino)
            
            # Realizamos la transferencia
            cuenta_origen.saldo -= monto_decimal
            cuenta_origen.save()
            
            cuenta_destino.saldo += monto_decimal
            cuenta_destino.save()
            
            # Registramos la transacción
            Transaccion.objects.create(
                emisor=request.user,
                receptor=usuario_destino,
                titulo=f"Transferencia",
                monto=monto_decimal
            )
            
            return JsonResponse({'success': True, 'message': f'Envío exitoso a {usuario_destino.first_name or usuario_destino.username}'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    # Para GET
    cuenta_usuario = Cuenta.objects.get(usuario=request.user)
    contactos = Contacto.objects.filter(usuario=request.user)
    
    contactos_lista = []
    for c in contactos:
        contactos_lista.append({
            'nombre': c.nombre,
            'alias': c.alias,
            'correo': c.correo,
            'banco': c.banco
        })
        
    contexto = {
        'saldo': cuenta_usuario.saldo,
        'contactos_json': json.dumps(contactos_lista)
    }
    return render(request, 'alkewallet/sendmoney.html', contexto)

@login_required(login_url='login')
def add_contact(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            alias = data.get('alias')
            correo = data.get('correo')
            banco = data.get('banco')
            
            if not all([nombre, alias, correo, banco]):
                return JsonResponse({'success': False, 'message': 'Faltan datos por completar.'})
                
            if not User.objects.filter(email=correo).exists() and not User.objects.filter(username=correo).exists():
                return JsonResponse({'success': False, 'message': f'La persona con correo "{correo}" no está registrada en la aplicación.'})
                
            if correo == request.user.email or correo == request.user.username:
                return JsonResponse({'success': False, 'message': 'No puedes agregarte a ti mismo como contacto.'})
                
            # Evitar duplicados
            if Contacto.objects.filter(usuario=request.user, correo=correo).exists():
                return JsonResponse({'success': False, 'message': 'Ya tienes a este usuario en tus contactos.'})
                
            Contacto.objects.create(
                usuario=request.user,
                nombre=nombre,
                alias=alias,
                correo=correo,
                banco=banco
            )
            
            return JsonResponse({'success': True, 'message': 'Contacto agregado correctamente.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'})

@login_required(login_url='login')
def delete_contact(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            correo = data.get('correo')
            
            Contacto.objects.filter(usuario=request.user, correo=correo).delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'})

@login_required(login_url='login')
def transactions(request):
    # Busco todas mis transacciones filtrando por el usuario actual como emisor o receptor.
    # Uso .order_by('-fecha') para asegurar que las fechas más recientes salgan arriba.
    lista_movimientos = Transaccion.objects.filter(
        Q(emisor=request.user) | Q(receptor=request.user)
    ).order_by('-fecha')
    # Utilizo el Paginator oficial de Django para dividir mis registros de a 5 por página.
    paginator = Paginator(lista_movimientos, 5)
    
    # Reviso la URL buscando el parámetro "?page=" para saber en qué vista de la paginación estoy
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Envío este objeto paginado al contexto de mi plantilla HTML
    contexto = {'page_obj': page_obj}
    return render(request, 'alkewallet/transactions.html', contexto)

# ----------------- BOLSILLOS (METAS DE AHORRO) -----------------

@login_required(login_url='login')
def bolsillos(request):
    """Vista principal para renderizar el HTML de bolsillos."""
    cuenta_usuario = Cuenta.objects.get(usuario=request.user)
    mis_bolsillos = Bolsillo.objects.filter(usuario=request.user)
    
    bolsillos_lista = []
    for b in mis_bolsillos:
        # Calcular porcentaje de progreso
        progreso = 0
        if b.monto_objetivo > 0:
            progreso = min(int((b.saldo_actual / b.monto_objetivo) * 100), 100)
            
        bolsillos_lista.append({
            'id': b.id,
            'nombre_meta': b.nombre_meta,
            'saldo_actual': float(b.saldo_actual),
            'monto_objetivo': float(b.monto_objetivo),
            'progreso': progreso
        })
        
    contexto = {
        'saldo': cuenta_usuario.saldo,
        'bolsillos_json': json.dumps(bolsillos_lista)
    }
    return render(request, 'alkewallet/bolsillos.html', contexto)

@login_required(login_url='login')
def create_bolsillo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre_meta = data.get('nombre_meta')
            monto_objetivo = Decimal(data.get('monto_objetivo', 0))
            
            if not nombre_meta or monto_objetivo <= 0:
                return JsonResponse({'success': False, 'message': 'Datos inválidos para la meta.'})
                
            Bolsillo.objects.create(
                usuario=request.user,
                nombre_meta=nombre_meta,
                monto_objetivo=monto_objetivo,
                saldo_actual=0
            )
            return JsonResponse({'success': True, 'message': 'Bolsillo creado correctamente'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'})

@login_required(login_url='login')
def fund_bolsillo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            bolsillo_id = data.get('id')
            monto = Decimal(data.get('monto', 0))
            
            if monto <= 0:
                return JsonResponse({'success': False, 'message': 'El monto debe ser mayor a 0.'})
                
            with transaction.atomic():
                cuenta = Cuenta.objects.select_for_update().get(usuario=request.user)
                bolsillo = Bolsillo.objects.select_for_update().get(id=bolsillo_id, usuario=request.user)
                
                if cuenta.saldo < monto:
                    return JsonResponse({'success': False, 'message': 'Saldo insuficiente en tu cuenta principal para este aporte.'})
                    
                # Descontar de cuenta y agregar a bolsillo
                cuenta.saldo -= monto
                cuenta.save()
                
                bolsillo.saldo_actual += monto
                bolsillo.save()
                
                # Registrar el movimiento virtual como transacción propia para el historial
                Transaccion.objects.create(
                    emisor=request.user,
                    receptor=request.user,
                    titulo=f'Aporte a bolsillo: {bolsillo.nombre_meta}',
                    monto=monto
                )
                
            return JsonResponse({'success': True, 'message': 'Aporte realizado correctamente.'})
        except Bolsillo.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'El bolsillo no existe.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'})

@login_required(login_url='login')
def withdraw_bolsillo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            bolsillo_id = data.get('id')
            monto = Decimal(data.get('monto', 0))
            
            if monto <= 0:
                return JsonResponse({'success': False, 'message': 'El monto debe ser mayor a 0.'})
                
            with transaction.atomic():
                cuenta = Cuenta.objects.select_for_update().get(usuario=request.user)
                bolsillo = Bolsillo.objects.select_for_update().get(id=bolsillo_id, usuario=request.user)
                
                if bolsillo.saldo_actual < monto:
                    return JsonResponse({'success': False, 'message': 'El bolsillo no tiene fondos suficientes para este retiro.'})
                    
                # Extraer del bolsillo y devolver a la cuenta principal
                bolsillo.saldo_actual -= monto
                bolsillo.save()
                
                cuenta.saldo += monto
                cuenta.save()
                
                Transaccion.objects.create(
                    emisor=request.user,
                    receptor=request.user,
                    titulo=f'Retiro de bolsillo: {bolsillo.nombre_meta}',
                    monto=monto
                )
                
            return JsonResponse({'success': True, 'message': 'Monto retirado y devuelto a tu cuenta.'})
        except Bolsillo.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'El bolsillo no existe.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'})

@login_required(login_url='login')
def delete_bolsillo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            bolsillo_id = data.get('id')
            
            with transaction.atomic():
                cuenta = Cuenta.objects.select_for_update().get(usuario=request.user)
                bolsillo = Bolsillo.objects.select_for_update().get(id=bolsillo_id, usuario=request.user)
                
                monto_restante = bolsillo.saldo_actual
                
                # Si tenía dinero ahorrado, devolvérselo a la cuenta
                if monto_restante > 0:
                    cuenta.saldo += monto_restante
                    cuenta.save()
                    
                    Transaccion.objects.create(
                        emisor=request.user,
                        receptor=request.user,
                        titulo=f'Cierre de bolsillo: {bolsillo.nombre_meta}',
                        monto=monto_restante
                    )
                    
                bolsillo.delete()
                
            return JsonResponse({'success': True, 'message': 'Bolsillo eliminado y fondos regresados.'})
        except Bolsillo.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'El bolsillo no existe.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'})

# ----------------- PERFIL DE USUARIO -----------------

@login_required(login_url='login')
def perfil(request):
    """Vista principal para renderizar los datos del perfil del usuario."""
    cuenta_usuario = Cuenta.objects.get(usuario=request.user)
    
    contexto = {
        'cuenta': cuenta_usuario,
        'saldo': cuenta_usuario.saldo
    }
    return render(request, 'alkewallet/perfil.html', contexto)
