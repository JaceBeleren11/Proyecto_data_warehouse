import socket
import csv
import time

def start_tcp_client():
    host = '127.0.0.1'
    port = 12000
    file_path = 'backend/datos/olist_orders_dataset.csv' # Asegúrate de que la ruta sea correcta

    # 1. Crear el socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        # 2. Conectar al servidor
        s.connect((host, port))
        print(f"Conectado al servidor {host}:{port}")

        # 3. Abrir y leer el archivo
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Saltar encabezado si existe

            for row in reader:
                data = ",".join(row)
                # 4. Enviar datos (Asegúrate de que esta línea esté indentada dentro del 'try')
                s.sendall((data + '\n').encode('utf-8'))
                print(f"Enviado: {row[0]}") # Imprime el ID para trackear
                time.sleep(1.5)  # Pequeña pausa para no saturar

    except FileNotFoundError:
        print(f"Error: No se encontró el archivo en {file_path}")
    except ConnectionRefusedError:
        print("Error: No se pudo conectar. ¿Está corriendo server.py?")
    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")
    finally:
        # 5. Cerrar el socket SIEMPRE al final, fuera del bucle
        s.close()
        print("Conexión cerrada.")

if __name__ == "__main__":
    start_tcp_client()