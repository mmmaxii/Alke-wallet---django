from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('registro/', views.registro, name='registro'),
    path('logout/', views.logout_view, name='logout'),
    path('deposit/', views.deposit, name='deposit'),
    path('menu/', views.menu, name='menu'),
    path('sendmoney/', views.sendmoney, name='sendmoney'),
    path('add_contact/', views.add_contact, name='add_contact'),
    path('delete_contact/', views.delete_contact, name='delete_contact'),
    path('transactions/', views.transactions, name='transactions'),
    
    # Rutas para Bolsillos
    path('bolsillos/', views.bolsillos, name='bolsillos'),
    path('create_bolsillo/', views.create_bolsillo, name='create_bolsillo'),
    path('fund_bolsillo/', views.fund_bolsillo, name='fund_bolsillo'),
    path('withdraw_bolsillo/', views.withdraw_bolsillo, name='withdraw_bolsillo'),
    path('delete_bolsillo/', views.delete_bolsillo, name='delete_bolsillo'),
    
    # Ruta Mi Perfil
    path('perfil/', views.perfil, name='perfil'),
]
