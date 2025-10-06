# scripts/index_documents.py
import os, json
import requests
from supabase import create_client
import psycopg2
from psycopg2.extras import execute_values

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
DB_URL = os.getenv("DATABASE_URL")  # postgres url
EMBED_SERVICE = os.getenv("EMBED_SERVICE_URL", "http://127.0.0.1:8700/embed")
DOC_GLOB = "data/docs/*.md"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
conn = psycopg2.connect(DB_URL)

def fetch_local_docs():
    import glob
    docs = []
    for path in glob.glob(DOC_GLOB):
        with open(path, "r", encoding="utf-8") as f:
            txt = f.read()
        docs.append({
            "community_id": None,
            "area_code": None,
            "title": os.path.basename(path),
            "content": txt,
            "source": path,
            "metadata": {}
        })
    return docs

def fetch_from_supabase():
    # pull stories and proposals — adapt table names
    docs = []
    for tbl in ("stories", "proposals", "plans"):
        res = supabase.table(tbl).select("id,title,body,community_id,area_code").execute()
        if res.data:
            for r in res.data:
                docs.append({
                    "community_id": r.get("community_id"),
                    "area_code": r.get("area_code"),
                    "title": r.get("title") or f"{tbl}:{r.get('id')}",
                    "content": r.get("body") or "",
                    "source": f"supabase:{tbl}/{r.get('id')}",
                    "metadata": {"table": tbl}
                })
    return docs

def embed_texts(texts):
    r = requests.post(EMBED_SERVICE, json={"texts": texts}, timeout=120)
    r.raise_for_status()
    return r.json()["embeddings"]

def upsert_docs(docs):
    with conn.cursor() as cur:
        rows = []
        for d in docs:
            rows.append((
                d.get("community_id"),
                d.get("area_code"),
                d["title"],
                d["content"],
                d["source"],
                json.dumps(d.get("metadata", {})),
                d["embedding"]
            ))
        execute_values(cur,
            """
            INSERT INTO ai_documents (community_id, area_code, title, content, source, metadata, embedding)
            VALUES %s
            ON CONFLICT (id) DO UPDATE
            SET content = EXCLUDED.content, metadata = EXCLUDED.metadata, embedding = EXCLUDED.embedding, title = EXCLUDED.title;
            """,
            rows,
            template="(%s,%s,%s,%s,%s,%s,%s)"
        )
        conn.commit()

def main():
    docs = fetch_local_docs() + fetch_from_supabase()
    if not docs:
        print("No docs found.")
        return
    texts = [d["content"][:2000] for d in docs]  # trim long docs
    print(f"Embedding {len(texts)} docs via {EMBED_SERVICE}")
    embeddings = embed_texts(texts)
    for i, d in enumerate(docs):
        d["embedding"] = embeddings[i]
    upsert_docs(docs)
    print("Indexed", len(docs))

if __name__ == "__main__":
    main()