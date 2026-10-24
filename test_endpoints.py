import urllib.request
import urllib.error
import json

def test_endpoints():
    print("--- 1. Testing Development Proxy (http://localhost:5173/) ---")
    try:
        with urllib.request.urlopen("http://localhost:5173/api/health") as res:
            data = json.loads(res.read().decode())
            print("Vite Proxy /api/health:", res.status, data["status"])
    except Exception as e:
        print("Vite Proxy Error:", e)

    print("\n--- 2. Testing Production Single-Server (http://localhost:8000/) ---")
    try:
        with urllib.request.urlopen("http://localhost:8000/") as res:
            html = res.read().decode()
            print("FastAPI / (Root HTML):", res.status, "Has HTML:", "<!DOCTYPE html>" in html)
    except Exception as e:
        print("FastAPI Root Error:", e)

    try:
        with urllib.request.urlopen("http://localhost:8000/debugger") as res:
            html = res.read().decode()
            print("FastAPI /debugger (SPA Fallback):", res.status, "Has HTML:", "<!DOCTYPE html>" in html)
    except Exception as e:
        print("FastAPI SPA Error:", e)

    try:
        urllib.request.urlopen("http://localhost:8000/api/nonexistent-route")
        print("FastAPI unknown API: Should have failed!")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print("FastAPI unknown API:", e.code, "ContentType:", e.headers.get("content-type"), "Body:", body.strip())
    except urllib.error.URLError as e:
        print("FastAPI Server offline (expected during offline test run):", e)

if __name__ == "__main__":
    test_endpoints()
