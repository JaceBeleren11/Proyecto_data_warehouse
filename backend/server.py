import socket
import threading
import json
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Obtener la ruta del directorio donde está este script (server.py)
basedir = os.path.abspath(os.path.dirname(__file__))
# Unir esa ruta con el nombre de tu archivo de credenciales
ruta_env = os.path.join(basedir, "credenciales.env")

# Cargar el archivo usando la ruta completa
load_dotenv(ruta_env)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_db(origen, contenido):
    try:
        data = {"origen": origen, "contenido": contenido}
        supabase.table("registros").insert(data).execute()
        print(f"Guardado en DB desde {origen}")
    except Exception as e:
        print(f"Error guardando en DB: {e}")

def handle_tcp():
    host, port = '127.0.0.1', 12000
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((host, port))
    server.listen(5)
    print(f"Servidor TCP a la escucha en puerto {port}")

    def client_thread(conn):
        with conn:
            buffer = ""
            while True:
                data = conn.recv(1024)
                if not data:
                    break
                buffer += data.decode('utf-8')
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line:
                        insert_db("TCP", line)

    while True:
        conn, addr = server.accept()
        threading.Thread(target=client_thread, args=(conn,), daemon=True).start()

def handle_udp():
    host, port = '127.0.0.1', 12001
    server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server.bind((host, port))
    print(f"Servidor UDP a la escucha en puerto {port}")

    while True:
        data, addr = server.recvfrom(1024)
        if data:
            mensaje = data.decode('utf-8')
            insert_db("UDP", mensaje)

if __name__ == "__main__":
    # Concurrencia con hilos
    threading.Thread(target=handle_tcp, daemon=True).start()
    threading.Thread(target=handle_udp, daemon=True).start()
    
    # Mantener el script principal corriendo
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("Servidor apagado.")