import socket
import time
import random
import json

def start_udp_client():
    host = '127.0.0.1'
    port = 12001

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        while True:
            data = {
                "sensor_id": random.randint(1, 10),
                "temperatura": round(random.uniform(20.0, 35.0), 2),
                "velocidad": round(random.uniform(0.0, 100.0), 2)
            }
            mensaje = json.dumps(data)
            s.sendto(mensaje.encode('utf-8'), (host, port))
            print(f"Enviado UDP: {mensaje}")
            time.sleep(0.5) # Pausa de 0.5 segundos

if __name__ == "__main__":
    start_udp_client()