"""
FastAPI Endpoint Integration Tests for Debug Dynasty
Tests /api/health, /api/debug, /api/validate-fix, /api/run-tests, /api/history, /api/evaluation
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all_endpoints():
    print("==================================================")
    print("TESTING FASTAPI BACKEND API ENDPOINTS")
    print("==================================================")

    # 1. /api/health
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    print("[OK] GET /api/health passed")

    # 2. /api/languages
    res = client.get("/api/languages")
    assert res.status_code == 200
    langs = res.json()
    assert len(langs) >= 5
    print(f"[OK] GET /api/languages passed ({len(langs)} languages)")

    # 3. /api/debug with Multiple Syntax Errors (Test A)
    code_a = """def calculate_total(numbers)
    total = 0

    for num in numbers
        total += num

    print("Total:", total
"""
    res = client.post("/api/debug", json={"language": "python", "code": code_a})
    assert res.status_code == 200
    data = res.json()
    assert "issues" in data, "Response missing 'issues' field"
    assert len(data["issues"]) >= 3, f"Expected at least 3 issues, got {len(data['issues'])}"
    assert data["is_valid_fix"] == True
    assert data["verification_status"] == "Validated"
    assert "def calculate_total(numbers):" in data["corrected_code"]
    print(f"[OK] POST /api/debug Test A passed ({len(data['issues'])} issues detected, status: {data['verification_status']})")

    # 4. /api/debug with Empty Code (Test G)
    res_empty = client.post("/api/debug", json={"language": "python", "code": "   "})
    assert res_empty.status_code == 400
    assert "empty" in res_empty.json()["detail"].lower()
    print("[OK] POST /api/debug Empty Code correctly returned HTTP 400")

    # 5. /api/validate-fix with Valid Fix
    res_val = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": "def add(a, b): return a - b",
        "corrected_code": "def add(a, b): return a + b",
        "expected_behavior": "Addition"
    })
    assert res_val.status_code == 200
    assert res_val.json()["is_valid"] == True
    assert res_val.json()["verification_status"] == "Validated"
    print("[OK] POST /api/validate-fix valid fix passed")

    # 6. /api/validate-fix with Broken Fix (Test I)
    res_broken = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": "def add(a, b): return a - b",
        "corrected_code": "def add(a, b: return a +",
        "expected_behavior": "Addition"
    })
    assert res_broken.status_code == 200
    assert res_broken.json()["is_valid"] == False
    assert res_broken.json()["verification_status"] == "Validation Failed"
    print("[OK] POST /api/validate-fix broken fix correctly marked Validation Failed")

    # 7. /api/run-tests for Python
    res_tests = client.post("/api/run-tests", json={
        "language": "python",
        "code": "def add_numbers(a, b):\n    return a + b\n",
        "test_cases": [
            {"input": "10, 20", "expected_output": "30"},
            {"input": "-5, 5", "expected_output": "0"}
        ]
    })
    assert res_tests.status_code == 200
    data_t = res_tests.json()
    assert data_t["all_passed"] == True
    assert data_t["passed_count"] == 2
    print(f"[OK] POST /api/run-tests passed ({data_t['passed_count']}/{data_t['total_count']} passed)")

    # 8. /api/run-tests for C++ (should reject isolated runner with clean error)
    res_cpp = client.post("/api/run-tests", json={
        "language": "cpp",
        "code": "int main() { return 0; }",
        "test_cases": [{"input": "", "expected_output": ""}]
    })
    assert res_cpp.status_code == 400
    assert "sandbox execution unavailable" in res_cpp.json()["detail"].lower()
    print("[OK] POST /api/run-tests C++ correctly reported sandbox unavailable")

    # 9. /api/history
    res_hist = client.get("/api/history")
    assert res_hist.status_code == 200
    assert isinstance(res_hist.json(), list)
    print(f"[OK] GET /api/history passed ({len(res_hist.json())} sessions retrieved)")

    # 10. /api/evaluation
    res_eval = client.get("/api/evaluation")
    assert res_eval.status_code == 200
    assert "total_evaluated" in res_eval.json()
    print("[OK] GET /api/evaluation passed")

    print("\n==================================================")
    print("ALL API ENDPOINT INTEGRATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_all_endpoints()
