from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import os

app = FastAPI()

# Permitir conexiones desde el Frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de rutas y variables de entorno
basedir = os.path.abspath(os.path.dirname(__file__))
ruta_env = os.path.join(basedir, "credenciales.env")
load_dotenv(ruta_env)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/api/datos")
def get_datos():
    # Ingesta en tiempo real
    response = supabase.table("registros").select("*").order("fecha", desc=True).limit(150).execute()
    return response.data

@app.get("/api/historico-ordenes")
def obtener_historico_ordenes():
    # Histórico general para la gráfica de Dona
    res = supabase.table("olist_orders_dataset").select("order_id, order_status, order_purchase_timestamp").limit(500).execute()
    return res.data

@app.get("/api/metrica-logistica")
def obtener_metrica_logistica():
    # Consulta a la vista SQL que creaste en Supabase
    res = supabase.table("vw_metrica_logistica").select("*").execute()
    return res.data

@app.get("/api/metrica-negocio")
def obtener_metrica_negocio():
    # Consulta a la vista SQL que creaste en Supabase (Traemos todas para la tabla, el frontend filtra el top 10 para la gráfica)
    res = supabase.table("vw_metrica_negocio").select("*").execute()
    return res.data