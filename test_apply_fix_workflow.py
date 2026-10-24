"""
Apply Fix & Validation Workflow Tests for Debug Dynasty.
Covers the 5 requirement areas:
1. Apply Fix - complete code replacement, not partial patches
2. Find Bugs - exact current editor analysis, updated findings
3. Multi-stage validation - PASS/FAIL/NOT RUN per stage, code version binding
4. Run Tests - Add Test Case functional, sandbox execution, empty list, passing/failing
5. Regression - syntax error, corrected version, failed runtime, empty test list, post-edit invalidation
"""

import pytest
from fastapi.testclient import TestClient
from main import app
import multi_error_engine
import ast

client = TestClient(app)

def test_apply_fix_corrected_code_is_complete_and_valid():
    buggy_code = """def calculate_total(prices)
    total = 0
    for price in prices
        total += price
    print("Total:", total
"""
    res = client.post("/api/debug", json={"language": "python", "code": buggy_code})
    assert res.status_code == 200
    data = res.json()
    corrected = data["corrected_code"]
    parsed = ast.parse(corrected)
    assert parsed is not None
    assert "calculate_total" in corrected
    assert "def calculate_total(prices):" in corrected
    assert "for price in prices:" in corrected

def test_apply_fix_original_code_preserved_in_analyzed_code():
    original = "def add(a, b):\n    return a - b\n"
    res = client.post("/api/debug", json={"language": "python", "code": original, "error_description": "wrong result", "expected_behavior": "should add"})
    assert res.status_code == 200
    data = res.json()
    assert data["analyzed_code"] == original

def test_validate_fix_broken_proposal_not_validated():
    broken = "def broken(\n    return 42\n"
    res = client.post("/api/validate-fix", json={"language": "python", "original_code": "def broken(x):\n    return x\n", "corrected_code": broken, "expected_behavior": "return 42"})
    assert res.status_code == 200
    val = res.json()
    assert val["is_valid"] is False
    assert val["verification_status"] == "Validation Failed"
    assert val["syntax_status"] == "FAILED"
    assert val["verification_status"] != "Fix Validated"

def test_find_bugs_analyzes_exact_submitted_code():
    code_v1 = "def compute(x):\n    return x * 2\n"
    res1 = client.post("/api/debug", json={"language": "python", "code": code_v1})
    assert res1.status_code == 200
    assert res1.json()["analyzed_code"] == code_v1

def test_find_bugs_updates_findings_with_line_numbers():
    code = "def compute_totals(values)\n    s = 0\n    for v in values\n        s += v\n"
    res = client.post("/api/debug", json={"language": "python", "code": code})
    assert res.status_code == 200
    data = res.json()
    issues = data["issues"]
    assert len(issues) >= 2
    lines_with_issues = [iss["line"] for iss in issues if iss.get("line")]
    assert 1 in lines_with_issues
    assert 3 in lines_with_issues

def test_multistage_runtime_only_passed_via_run_tests():
    code = "def add(a, b):\n    return a + b\n"
    res_debug = client.post("/api/debug", json={"language": "python", "code": code})
    assert res_debug.status_code == 200
    assert res_debug.json()["runtime_status"] in ("NOT RUN", "NOT TESTED")
    res_val = client.post("/api/validate-fix", json={"language": "python", "original_code": code, "corrected_code": code})
    assert res_val.status_code == 200
    assert res_val.json()["runtime_status"] in ("NOT RUN", "NOT TESTED")
    res_test = client.post("/api/run-tests", json={"language": "python", "code": code, "test_cases": [{"name": "T", "input": "2, 3", "expected_output": "5"}]})
    assert res_test.status_code == 200
    assert res_test.json()["runtime_status"] == "PASSED"

def test_run_tests_empty_list_returns_400():
    res = client.post("/api/run-tests", json={"language": "python", "code": "def foo(x):\n    return x\n", "test_cases": []})
    assert res.status_code == 400
    assert "No test cases provided" in res.json()["detail"]

def test_run_tests_invalid_structure_returns_422():
    res = client.post("/api/run-tests", json={"language": "python", "code": "def add(a, b):\n    return a + b\n", "test_cases": [{"name": "Bad", "input": "1, 2", "expected_output": ""}]})
    assert res.status_code == 422

def test_run_tests_passes_correct_code():
    code = "def add(a, b):\n    return a + b\n"
    res = client.post("/api/run-tests", json={"language": "python", "code": code, "test_cases": [{"name": "Two positives", "input": "3, 4", "expected_output": "7"}, {"name": "Negative", "input": "-5, 5", "expected_output": "0"}]})
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is True
    assert data["passed_count"] == 2
    assert data["results"][0]["name"] == "Two positives"
    assert data["results"][0]["status"] == "PASS"
    assert data["runtime_status"] == "PASSED"

def test_run_tests_fails_buggy_code():
    buggy = "def add(a, b):\n    return a - b\n"
    res = client.post("/api/run-tests", json={"language": "python", "code": buggy, "test_cases": [{"name": "Add check", "input": "3, 4", "expected_output": "7"}]})
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is False
    assert data["results"][0]["status"] == "FAIL"
    assert data["runtime_status"] == "FAILED"

def test_run_tests_shows_both_pass_and_fail():
    code = "def double(x):\n    return x * 2\n"
    res = client.post("/api/run-tests", json={"language": "python", "code": code, "test_cases": [{"name": "Pass", "input": "5", "expected_output": "10"}, {"name": "Fail", "input": "5", "expected_output": "999"}]})
    assert res.status_code == 200
    data = res.json()
    assert data["passed_count"] == 1
    assert data["total_count"] == 2
    results = {r["name"]: r for r in data["results"]}
    assert results["Pass"]["status"] == "PASS"
    assert results["Pass"]["actual_output"] == "10"
    assert results["Fail"]["status"] == "FAIL"
    assert results["Fail"]["actual_output"] == "10"
    assert results["Fail"]["expected_output"] == "999"

def test_run_tests_syntax_error_not_executed():
    malformed = "def broken(x\n    return x * 2\n"
    res = client.post("/api/run-tests", json={"language": "python", "code": malformed, "test_cases": [{"name": "Test", "input": "5", "expected_output": "10"}]})
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is False
    assert data["syntax_status"] == "FAILED"
    assert data["runtime_status"] == "NOT RUN"
    assert data["results"][0]["status"] == "ERROR"

def test_run_tests_unsupported_lang_returns_400():
    for lang in ("javascript", "typescript", "java", "cpp", "c"):
        res = client.post("/api/run-tests", json={"language": lang, "code": "print('hello')", "test_cases": [{"input": "", "expected_output": "hello"}]})
        assert res.status_code == 400, f"{lang} must return 400, got {res.status_code}"
        assert "Sandbox Execution Unavailable" in res.json()["detail"]

def test_code_version_binding_analyzed_code_matches_submission():
    code = "def calc(x):\n    return x - 1\n"
    res = client.post("/api/debug", json={"language": "python", "code": code})
    assert res.status_code == 200
    assert res.json()["analyzed_code"] == code
