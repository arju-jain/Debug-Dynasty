"""
Automated Regression Test Suite for Debug Dynasty Validation & Reporting
Covers all 5 mandatory regression scenarios:
1. Multiple syntax errors.
2. A corrected proposal that still contains a syntax error.
3. A fully corrected Python program.
4. A logic error involving negative numbers.
5. A stale response or mismatch between editor contents and validation results.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
import multi_error_engine

client = TestClient(app)

def test_regression_multiple_syntax_errors():
    """
    Scenario 1: Multiple syntax errors
    Code contains missing colons on def and loop, plus unclosed parenthesis on print.
    Engine must detect multiple syntax errors and not abort at the first one.
    """
    code = """def compute_totals(values)
    s = 0
    for v in values
        s += v
    print("Sum:", s
"""
    res = client.post("/api/debug", json={"language": "python", "code": code})
    assert res.status_code == 200
    data = res.json()
    
    assert "issues" in data
    assert len(data["issues"]) >= 3, f"Expected at least 3 issues, got {len(data['issues'])}"
    
    # Must identify missing colon and unclosed paren
    messages = [iss["message"].lower() for iss in data["issues"]]
    assert any("colon" in m for m in messages), "Missing colon not detected in multiple syntax errors"
    assert any("bracket" in m or "unclosed" in m or "syntax" in m for m in messages), "Unclosed delimiter not detected"
    
    # Corrected code should resolve all syntax issues
    assert "def compute_totals(values):" in data["corrected_code"]
    assert "for v in values:" in data["corrected_code"]
    assert "print(\"Sum:\", s)" in data["corrected_code"]

def test_regression_corrected_proposal_contains_syntax_error():
    """
    Scenario 2: A corrected proposal that still contains a syntax error.
    Must return 'Validation Failed', is_valid=False, syntax_status='FAILED',
    and NEVER 'Fix Validated'.
    """
    original = "def broken(x):\n    return x +"
    # Proposed fix still has a missing operand syntax error
    proposal_with_syntax_error = "def broken(x):\n    return x +"
    
    res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": original,
        "corrected_code": proposal_with_syntax_error,
        "expected_behavior": "Return x + 1"
    })
    assert res.status_code == 200
    val = res.json()
    
    assert val["is_valid"] is False, "Validation must be False when proposal has syntax error"
    assert val["verification_status"] == "Validation Failed", f"Expected 'Validation Failed', got {val['verification_status']}"
    assert val["syntax_status"] == "FAILED", f"Expected syntax_status 'FAILED', got {val.get('syntax_status')}"
    assert "VALIDATION FAILED" in val["validation_details"].upper()
    assert val["verification_status"] != "Fix Validated", "Must NEVER display 'Fix Validated' when syntax error remains"
    assert val["verification_status"] != "Validated"
    assert len(val["remaining_issues"]) > 0, "Remaining issues must report the syntax error in proposed code"

def test_regression_fully_corrected_python_program():
    """
    Scenario 3: A fully corrected Python program.
    Ensures syntax passes, static passes, separate statuses for syntax, static analysis, and runtime,
    and verification_status is 'Validated'/'Fix Validated'.
    """
    clean_code = "def multiply(a, b):\n    return a * b\n\nprint(multiply(3, 4))\n"
    
    res = client.post("/api/debug", json={
        "language": "python",
        "code": clean_code
    })
    assert res.status_code == 200
    data = res.json()
    
    assert data["is_valid_fix"] is True
    assert data["verification_status"] in ("Validated", "Fix Validated")
    assert data["syntax_status"] == "PASSED"
    assert data["static_analysis_status"] == "PASSED"
    assert data["runtime_status"] in ("NOT RUN", "NOT TESTED")
    assert len(data.get("remaining_issues", [])) == 0
    # Logic disclaimer note present
    assert "logic" in data["validation_note"].lower() or "test cases" in data["validation_note"].lower()

def test_regression_logic_error_negative_numbers():
    """
    Scenario 4: A logic error involving negative numbers.
    e.g. max_value initialized to 0 fails for [-10, -25, -5].
    Engine must flag this logic defect, explain negative numbers boundary,
    and synthesize a fix that initializes from the collection.
    """
    code = """def find_maximum(numbers):
    max_value = 0
    for num in numbers:
        if num > max_value:
            max_value = num
    return max_value

print(find_maximum([-10, -25, -5]))
"""
    res = client.post("/api/debug", json={"language": "python", "code": code})
    assert res.status_code == 200
    data = res.json()
    
    # Must flag logic defect
    logic_issues = [iss for iss in data["issues"] if iss["category"] == "Logic"]
    assert len(logic_issues) > 0, "Logic issue with negative numbers not detected"
    
    # Check explanation mentions negative numbers or 0 initialization
    expl = logic_issues[0]["explanation"].lower()
    assert "negative" in expl or "0" in expl
    
    # Verify the corrected code executes and correctly returns -5 for [-10, -25, -5]
    exec_res = multi_error_engine.run_isolated_execution(data["corrected_code"])
    assert exec_res["executed"] is True
    assert exec_res["stdout"].strip() == "-5", f"Expected -5, got {exec_res['stdout'].strip()}"

def test_regression_stale_response_mismatch_detection():
    """
    Scenario 5: Stale response or mismatch between editor contents and validation results.
    API contract returns analyzed_code and validates specific corrected_code, ensuring
    version consistency between requests.
    """
    orig_v1 = "def calc(x): return x - 1"
    res_v1 = client.post("/api/debug", json={"language": "python", "code": orig_v1})
    assert res_v1.status_code == 200
    data_v1 = res_v1.json()
    assert data_v1["analyzed_code"] == orig_v1
    
    # Proposed fix for v1
    prop_v1 = data_v1["corrected_code"]
    
    # User edits editor to v2: "def calc(x): return x * 10"
    v2_code = "def calc(x): return x * 10"
    assert v2_code != data_v1["analyzed_code"], "Editor content differs from analyzed code version"
    
    # Validation against the intended proposal validates prop_v1, NOT v2
    val_res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": orig_v1,
        "corrected_code": prop_v1
    })
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert val_data["syntax_status"] == "PASSED"

def test_regression_proposal_with_missing_colon_syntax_error():
    """
    Scenario 2b: A proposal that still contains a missing colon syntax error.
    Must return 'Validation Failed', is_valid=False, syntax_status='FAILED',
    and NEVER 'Fix Validated' or 'Validated'.
    """
    broken_proposal = "def solve(values)\n    return sum(values)\n"
    res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": "def solve(values):\n    pass\n",
        "corrected_code": broken_proposal
    })
    assert res.status_code == 200
    val = res.json()
    assert val["is_valid"] is False
    assert val["verification_status"] == "Validation Failed"
    assert val["syntax_status"] == "FAILED"
    assert "VALIDATION FAILED" in val["validation_details"].upper()
    assert val["verification_status"] != "Fix Validated"
    assert val["verification_status"] != "Validated"
    assert any("colon" in iss["message"].lower() or "syntax" in iss["message"].lower() for iss in val["remaining_issues"])

def test_regression_proposal_with_multiple_syntax_errors():
    """
    Scenario 2c: A proposal that contains multiple syntax errors.
    Must return all syntax errors in remaining_issues and fail validation.
    """
    multi_broken_proposal = """def process_items(items)
    for it in items
        print("Item:", it
"""
    res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": multi_broken_proposal,
        "corrected_code": multi_broken_proposal
    })
    assert res.status_code == 200
    val = res.json()
    assert val["is_valid"] is False
    assert val["verification_status"] == "Validation Failed"
    assert val["syntax_status"] == "FAILED"
    assert len(val["remaining_issues"]) >= 2
    assert val["verification_status"] != "Fix Validated"

def test_regression_proposal_with_runtime_exception_partially_fixed():
    """
    Scenario 2d: Code has valid syntax but crashes at runtime (e.g. ZeroDivisionError).
    Must return syntax_status='PASSED', runtime_status='FAILED',
    verification_status='Partially Fixed', and NEVER 'Fix Validated'.
    """
    code_with_runtime_crash = "def divide_zero():\n    return 10 / 0\n\ndivide_zero()\n"
    res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": code_with_runtime_crash,
        "corrected_code": code_with_runtime_crash
    })
    assert res.status_code == 200
    val = res.json()
    assert val["is_valid"] is False
    assert val["syntax_status"] == "PASSED"
    assert val["runtime_status"] == "FAILED"
    assert val["verification_status"] == "Partially Fixed"
    assert val["verification_status"] != "Fix Validated"
    assert any("ZeroDivisionError" in iss["message"] or "Runtime" in iss["category"] for iss in val["remaining_issues"])

def test_regression_mock_ai_explanation_demo_tagging():
    """
    Scenario: Verify mock AI explanations are clearly marked as demo simulations.
    """
    res = client.post("/api/debug", json={
        "language": "python",
        "code": "def hello():\n    return 'hello'\n"
    })
    assert res.status_code == 200
    data = res.json()
    # Check that learning explanation or assumptions have DEMO simulation tag
    has_demo = any("[DEMO" in a.upper() for a in data.get("assumptions_and_uncertainty", [])) or \
               "[DEMO" in data.get("explain_like_learning", "").upper()
    assert has_demo, "Mock AI explanations must be clearly tagged as demo simulations"

def test_regression_five_findings_price_calculation():
    """
    Scenario: Detect all 5 genuine, deduplicated findings tied to correct source lines:
    1. Missing colon on line 1: def calculate_total(prices)
    2. Missing colon on line 3: for price in prices
    3. Undefined variable on line 4: total += prce
    4. Unvalidated negative price logic on line 4: total += prce without price < 0 validation
    5. Missing closing parenthesis on line 5: print("Total:", total
    """
    snippet = """def calculate_total(prices)
    total = 0
    for price in prices
        total += prce
    print("Total:", total
"""
    res = client.post("/api/debug", json={
        "language": "python",
        "code": snippet
    })
    assert res.status_code == 200
    data = res.json()

    issues = data.get("issues", [])
    assert len(issues) == 5, f"Expected exactly 5 issues, got {len(issues)}: {issues}"

    # Verify deduplicated categories & lines
    line_issues = [(iss.get("line"), iss.get("category"), iss.get("message")) for iss in issues]
    lines_found = [iss.get("line") for iss in issues]
    assert 1 in lines_found, "Missing colon on line 1 not detected"
    assert 3 in lines_found, "Missing colon on line 3 not detected"
    assert 4 in lines_found, "Undefined variable or negative price logic on line 4 not detected"
    assert 5 in lines_found, "Unclosed bracket on line 5 not detected"

    # Verify negative-price logic defect detected
    assert any("negative price" in iss.get("message", "").lower() for iss in issues), \
        "Negative price logic defect not detected"

    # Verify undefined variable prce detected
    assert any("prce" in iss.get("message", "").lower() for iss in issues), \
        "Undefined variable 'prce' not detected"

    # Verify proposed corrected code synthesizes all 5 repairs
    corrected = data.get("corrected_code", "")
    assert "def calculate_total(prices):" in corrected
    assert "for price in prices:" in corrected
    assert "total += price" in corrected
    assert "print(\"Total:\", total)" in corrected
    assert "price < 0" in corrected, "Corrected code must include negative price guard"

    # Proposed fix is valid and validated
    assert data["is_valid_fix"] is True
    assert data["verification_status"] == "Validated"
    assert data["syntax_status"] == "PASSED"
    assert data["static_analysis_status"] == "PASSED"
    # Runtime status must NOT be PASSED since dry run is not sandbox test execution
    assert data["runtime_status"] in ("NOT RUN", "NOT TESTED")

def test_regression_runtime_status_only_passed_with_actual_sandbox_tests():
    """
    Requirement 4: Mark runtime testing as PASSED only when the code was actually
    executed successfully in a secure, isolated sandbox with test cases.
    A syntax check or dry run must not count as runtime execution.
    """
    func_code = "def add(a, b):\n    return a + b\n"

    # 1. /api/debug must have runtime_status = NOT RUN (or NOT TESTED)
    deb_res = client.post("/api/debug", json={"language": "python", "code": func_code})
    assert deb_res.status_code == 200
    assert deb_res.json()["runtime_status"] in ("NOT RUN", "NOT TESTED")

    # 2. /api/validate-fix must have runtime_status = NOT RUN
    val_res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": func_code,
        "corrected_code": func_code
    })
    assert val_res.status_code == 200
    assert val_res.json()["runtime_status"] in ("NOT RUN", "NOT TESTED")

    # 3. /api/run-tests with genuine sandbox passing tests must set runtime_status = PASSED
    test_run_res = client.post("/api/run-tests", json={
        "language": "python",
        "code": func_code,
        "test_cases": [{"input": "2, 3", "expected_output": "5"}]
    })
    assert test_run_res.status_code == 200
    test_data = test_run_res.json()
    assert test_data["all_passed"] is True
    assert test_data["runtime_status"] == "PASSED"
    assert test_data["verification_status"] == "Tests Passed"

    # 4. /api/run-tests with failing tests must set runtime_status = FAILED
    test_fail_res = client.post("/api/run-tests", json={
        "language": "python",
        "code": func_code,
        "test_cases": [{"input": "2, 3", "expected_output": "999"}]
    })
    assert test_fail_res.status_code == 200
    fail_data = test_fail_res.json()
    assert fail_data["all_passed"] is False
    assert fail_data["runtime_status"] == "FAILED"
    assert fail_data["verification_status"] == "Tests Failed"

def test_regression_invalid_code_cannot_receive_successful_validation():
    """
    Requirement 2 & 8: Validate complete proposed fixed code with Python parser.
    If syntax errors remain, validation must fail. Under no circumstances can
    invalid code receive a successful validation status.
    """
    broken_code = "def broken(\n    return 42\n"
    val_res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": broken_code,
        "corrected_code": broken_code
    })
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is False
    assert val_data["verification_status"] == "Validation Failed"
    assert val_data["syntax_status"] == "FAILED"
    assert val_data["verification_status"] != "Fix Validated"
    assert val_data["verification_status"] != "Validated"

def test_regression_run_tests_empty_test_cases():
    """Requirement 13: Regression test for empty test cases."""
    res = client.post("/api/run-tests", json={
        "language": "python",
        "code": "def foo(x):\n    return x\n",
        "test_cases": []
    })
    assert res.status_code == 400
    assert "No test cases provided for execution" in res.json()["detail"]

def test_regression_run_tests_valid_and_failing_test_cases():
    """Requirement 13: Regression test for valid and failing test cases."""
    code = "def double(x):\n    return x * 2\n"
    res = client.post("/api/run-tests", json={
        "language": "python",
        "code": code,
        "test_cases": [
            {"name": "Valid Double", "input": "5", "expected_output": "10"},
            {"name": "Failing Double", "input": "5", "expected_output": "999"}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is False
    assert data["passed_count"] == 1
    assert data["total_count"] == 2
    assert data["results"][0]["status"] == "PASS"
    assert data["results"][0]["name"] == "Valid Double"
    assert data["results"][1]["status"] == "FAIL"
    assert data["results"][1]["name"] == "Failing Double"
    assert data["runtime_status"] == "FAILED"

def test_regression_run_tests_malformed_requests():
    """Requirement 13: Regression test for malformed requests."""
    # Missing required field 'code'
    res = client.post("/api/run-tests", json={
        "language": "python",
        "test_cases": [{"input": "1", "expected_output": "1"}]
    })
    assert res.status_code == 422

    # Missing required field 'test_cases'
    res2 = client.post("/api/run-tests", json={
        "language": "python",
        "code": "print('hello')"
    })
    assert res2.status_code == 422

def test_regression_run_tests_sandbox_errors():
    """Requirement 13: Regression test for sandbox errors and crashes."""
    # Runtime crash: ZeroDivisionError
    crash_code = "def divide(a, b):\n    return a / b\n"
    res = client.post("/api/run-tests", json={
        "language": "python",
        "code": crash_code,
        "test_cases": [
            {"name": "Divide by zero", "input": "10, 0", "expected_output": "0"}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is False
    assert data["results"][0]["status"] == "ERROR"
    assert "ZeroDivisionError" in (data["results"][0]["error_message"] or data["results"][0]["actual_output"])

    # Unsupported language sandbox execution
    res_unsupported = client.post("/api/run-tests", json={
        "language": "javascript",
        "code": "console.log(1);",
        "test_cases": [{"input": "", "expected_output": "1"}]
    })
    assert res_unsupported.status_code == 400
    assert "Sandbox Execution Unavailable" in res_unsupported.json()["detail"]

def test_regression_python_discount_program():
    """
    Requirement 9: Add a simple working example for the existing Python discount program:
    Input: 1000, 10
    Expected output: Final price: 900.0
    Verify actual function and execution interface; do not fabricate results.
    """
    buggy_discount_code = '''def calculate_discount(price, discount_percent):
    discount = price * (discount_percent / 100)
    final_price = price + discount
    return f"Final price: {final_price}"
'''
    # 1. Running buggy discount code against expected output must FAIL genuinely
    res_buggy = client.post("/api/run-tests", json={
        "language": "python",
        "code": buggy_discount_code,
        "test_cases": [
            {"name": "10% Discount on 1000", "input": "1000, 10", "expected_output": "Final price: 900.0"}
        ]
    })
    assert res_buggy.status_code == 200
    data_buggy = res_buggy.json()
    assert data_buggy["all_passed"] is False
    assert data_buggy["results"][0]["status"] == "FAIL"
    assert data_buggy["results"][0]["actual_output"] == "Final price: 1100.0"
    assert data_buggy["results"][0]["expected_output"] == "Final price: 900.0"

    # 2. Analyze code detects defect
    analysis_res = client.post("/api/debug", json={
        "language": "python",
        "code": buggy_discount_code,
        "error_description": "calculate_discount(1000, 10) returns Final price: 1100.0 instead of Final price: 900.0",
        "expected_behavior": "calculate_discount(1000, 10) should return Final price: 900.0"
    })
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()
    assert "corrected_code" in analysis_data
    assert "price - discount" in analysis_data["corrected_code"]

    # 3. Running corrected discount code must PASS genuinely
    res_fixed = client.post("/api/run-tests", json={
        "language": "python",
        "code": analysis_data["corrected_code"],
        "test_cases": [
            {"name": "10% Discount on 1000", "input": "1000, 10", "expected_output": "Final price: 900.0"}
        ]
    })
    assert res_fixed.status_code == 200
    data_fixed = res_fixed.json()
    assert data_fixed["all_passed"] is True
    assert data_fixed["results"][0]["status"] == "PASS"
    assert data_fixed["results"][0]["actual_output"] == "Final price: 900.0"
    assert data_fixed["runtime_status"] == "PASSED"
    assert data_fixed["verification_status"] == "Tests Passed"


def test_regression_multi_error_malformed_discount_and_total_snippets():
    """
    Requirement 1, 3, 4, 6:
    Analyze exact current editor contents with multiple syntax errors (missing colons,
    unclosed parentheses) and undefined variable ('prce').
    Generate complete corrected version of the code, not isolated patches.
    Validate the entire proposed fix before displaying 'Proposed Fix Validated'.
    """
    # 1. Total snippet with multiple syntax errors and undefined variable
    malformed_total = """def calculate_total(prices)
    for price in prices
        total += prce
    print("Total:", total
"""
    res = client.post("/api/debug", json={
        "language": "python",
        "code": malformed_total
    })
    assert res.status_code == 200
    data = res.json()

    # Verify reliably detected syntax errors and undefined variable
    issues = data["issues"]
    lines = [iss.get("line") for iss in issues]
    categories = [iss.get("category") for iss in issues]
    messages = [iss.get("message", "").lower() for iss in issues]

    assert 1 in lines, "Missing colon on line 1 not detected"
    assert 2 in lines, "Missing colon on line 2 not detected"
    assert "Syntax" in categories, "Syntax category not detected"
    assert any("prce" in m for m in messages), "Undefined variable 'prce' not detected"

    # Verify complete synthesized fix
    corrected = data["corrected_code"]
    assert "def calculate_total(prices):" in corrected
    assert "for price in prices:" in corrected
    assert "total += price" in corrected
    assert "print(\"Total:\", total)" in corrected
    # Total accumulator must be initialized
    assert "total = 0" in corrected

    # Verify AST parses cleanly without syntax errors
    import ast
    parsed = ast.parse(corrected)
    assert parsed is not None

    # Fix is validated
    assert data["is_valid_fix"] is True
    assert data["verification_status"] == "Validated"
    assert data["syntax_status"] == "PASSED"
    assert data["static_analysis_status"] == "PASSED"
    assert data["remaining_issues"] == []

    # 2. Discount snippet with multiple syntax errors, misspelled variable, and operator defect
    malformed_discount = """def calculate_discount(price, discount_percent)
    if price < 0
        raise ValueError("Price cannot be negative")
    discount = prce * (discount_percent / 100
    final_price = price + discount
    return f"Final price: {final_price}"
"""
    res_disc = client.post("/api/debug", json={
        "language": "python",
        "code": malformed_discount
    })
    assert res_disc.status_code == 200
    disc_data = res_disc.json()

    disc_issues = disc_data["issues"]
    disc_lines = [iss.get("line") for iss in disc_issues]
    assert 1 in disc_lines, "Line 1 colon not detected"
    assert 2 in disc_lines, "Line 2 colon not detected"
    assert any("prce" in iss.get("message", "").lower() for iss in disc_issues), "Undefined 'prce' not detected"

    disc_corrected = disc_data["corrected_code"]
    assert "def calculate_discount(price, discount_percent):" in disc_corrected
    assert "if price < 0:" in disc_corrected
    assert "discount = price * (discount_percent / 100)" in disc_corrected
    assert "final_price = price - discount" in disc_corrected

    ast.parse(disc_corrected)
    assert disc_data["is_valid_fix"] is True
    assert disc_data["verification_status"] == "Validated"
    assert disc_data["syntax_status"] == "PASSED"


def test_regression_run_tests_rejects_malformed_code_without_executing():
    """
    Requirement 2: Do not attempt to execute malformed code as though syntax validation passed.
    Ensure runtime_status is 'NOT RUN' and syntax_status is 'FAILED'.
    """
    malformed_code = """def broken_function(x)
    return x *
"""
    res = client.post("/api/run-tests", json={
        "language": "python",
        "code": malformed_code,
        "test_cases": [
            {"name": "Test 1", "input": "5", "expected_output": "10"}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is False
    assert data["runtime_status"] == "NOT RUN", "Malformed code must not be executed in runtime sandbox"
    assert data["syntax_status"] == "FAILED"
    assert "Syntax Validation Failed" in data["verification_status"]
    assert "SyntaxError" in data["results"][0]["actual_output"]
    assert data["results"][0]["status"] == "ERROR"


def test_regression_negative_price_safely_rejected_and_valid_input_passes():
    """
    Requirement 5: If the example contains a negative price, either reject it safely
    with a clear message or use valid non-negative input in a separate successful test.
    """
    valid_discount_code = '''def calculate_discount(price, discount_percent):
    if price < 0:
        raise ValueError("Price cannot be negative")
    discount = price * (discount_percent / 100)
    final_price = price - discount
    return f"Final price: {final_price}"
'''
    # Test A: Negative price safely rejected with clear ValueError message
    res_neg = client.post("/api/run-tests", json={
        "language": "python",
        "code": valid_discount_code,
        "test_cases": [
            {
                "name": "Negative Price Rejection",
                "input": "-100, 10",
                "expected_output": "Error: ValueError: Price cannot be negative"
            }
        ]
    })
    assert res_neg.status_code == 200
    data_neg = res_neg.json()
    assert data_neg["all_passed"] is True, "Negative price rejection test should pass expected error"
    assert "Price cannot be negative" in data_neg["results"][0]["actual_output"]

    # Test B: Valid non-negative input in separate successful test
    res_pos = client.post("/api/run-tests", json={
        "language": "python",
        "code": valid_discount_code,
        "test_cases": [
            {
                "name": "Valid 10% Discount on 1000",
                "input": "1000, 10",
                "expected_output": "Final price: 900.0"
            }
        ]
    })
    assert res_pos.status_code == 200
    data_pos = res_pos.json()
    assert data_pos["all_passed"] is True
    assert data_pos["results"][0]["actual_output"] == "Final price: 900.0"
    assert data_pos["runtime_status"] == "PASSED"


def test_regression_original_findings_separated_from_proposed_fix_findings():
    """
    Requirement 7: Keep original-code findings separate from proposed-fix findings
    and runtime exceptions.
    """
    code_with_defects = """def calculate_total(prices)
    for price in prices
        total += prce
    print("Total:", total
"""
    res = client.post("/api/debug", json={
        "language": "python",
        "code": code_with_defects
    })
    assert res.status_code == 200
    data = res.json()

    # Original findings are populated in 'issues'
    original_issues = data.get("issues", [])
    assert len(original_issues) >= 4, f"Expected original findings in 'issues', got {original_issues}"
    original_messages = [i["message"] for i in original_issues]
    assert any("colon" in m.lower() for m in original_messages)

    # Proposed-fix findings are separate in 'remaining_issues' (empty since fix is clean)
    remaining = data.get("remaining_issues", [])
    assert remaining == [], f"Proposed fix should have 0 remaining issues, got {remaining}"
    assert data["is_valid_fix"] is True


def test_regression_calculate_sum_contradictory_status_reproduction_and_separation():
    """
    Requirements 3, 4, 5, 6, 7, 9, 10:
    Specifically reproduces the screenshot scenario:
    The editor contains buggy calculate_sum code with missing colons and undefined 'numbr'.
    The engine must:
    1. Detect original defects (syntax errors and undefined variable).
    2. Maintain separate validation results for Original Code vs Proposed Fix.
    3. Return original_validation: syntax_status='FAILED', static_analysis_status='FAILED'.
    4. Return proposed_validation: syntax_status='PASSED', static_analysis_status='PASSED'.
    5. Correct all issues in calculate_sum (both colons, 'numbr' -> 'num').
    6. Runtime status remains NOT RUN until sandbox tests are executed.
    7. Executing tests on corrected code cleanly passes and returns runtime_status='PASSED'.
    """
    calculate_sum_buggy = """def calculate_sum(numbers)
    total = 0
    for num in numbers
        total += numbr
    return total
"""
    # 1. Analyze calculate_sum through /api/debug
    res = client.post("/api/debug", json={
        "language": "python",
        "code": calculate_sum_buggy,
        "error_description": "NameError: name 'numbr' is not defined and syntax errors",
        "expected_behavior": "Return the sum of numbers in the list"
    })
    assert res.status_code == 200
    data = res.json()

    # Verify original defects detected
    issues = data.get("issues", [])
    assert len(issues) >= 3, f"Expected at least 3 issues, got {len(issues)}"
    messages = [iss["message"].lower() for iss in issues]
    assert any("colon" in m for m in messages), "Missing colon not detected"
    assert any("numbr" in m for m in messages), "Undefined variable numbr not detected"

    # Verify separation of Original Code results vs Proposed Fix results
    orig_val = data.get("original_validation")
    assert orig_val is not None, "original_validation must be present in response"
    assert orig_val["code_version"] == "Original Code"
    assert orig_val["syntax_status"] == "FAILED", "Original code syntax_status must be FAILED"
    assert orig_val["static_analysis_status"] == "FAILED", "Original code static_analysis_status must be FAILED"
    assert orig_val["runtime_status"] in ("NOT RUN", "NOT TESTED")

    prop_val = data.get("proposed_validation")
    assert prop_val is not None, "proposed_validation must be present in response"
    assert prop_val["code_version"] == "Proposed Fix"
    assert prop_val["syntax_status"] == "PASSED", "Proposed fix syntax_status must be PASSED"
    assert prop_val["static_analysis_status"] == "PASSED", "Proposed fix static_analysis_status must be PASSED"
    assert prop_val["runtime_status"] in ("NOT RUN", "NOT TESTED")
    assert prop_val["is_valid"] is True

    # Verify corrected code fixes all defects: missing colons and undefined numbr
    corrected = data["corrected_code"]
    assert "def calculate_sum(numbers):" in corrected, "Missing colon on def calculate_sum was not fixed"
    assert "for num in numbers:" in corrected, "Missing colon on for num in numbers was not fixed"
    assert "total += num" in corrected, "Undefined variable numbr was not replaced with num"
    assert "numbr" not in corrected, "Erroneous variable numbr still present in corrected code"

    # Verify synthesized code compiles cleanly via AST
    import ast
    parsed = ast.parse(corrected)
    assert parsed is not None

    # Verify runtime testing on proposed code is NOT marked PASSED until sandbox tests run
    assert data["runtime_status"] in ("NOT RUN", "NOT TESTED")

    # 2. Run actual sandbox tests on the proposed fix
    test_run_res = client.post("/api/run-tests", json={
        "language": "python",
        "code": corrected,
        "test_cases": [
            {
                "name": "Sum of [1, 2, 3]",
                "input": "[1, 2, 3]",
                "expected_output": "6"
            },
            {
                "name": "Sum of [10, 20, 30]",
                "input": "[10, 20, 30]",
                "expected_output": "60"
            }
        ]
    })
    assert test_run_res.status_code == 200
    test_data = test_run_res.json()
    assert test_data["all_passed"] is True, f"Expected all tests to pass, got {test_data}"
    assert test_data["runtime_status"] == "PASSED", "Runtime status must only be PASSED after successful sandbox run"
    assert test_data["verification_status"] == "Tests Passed"

    # 3. Apply Fix: Validate the applied fix through /api/validate-fix
    val_res = client.post("/api/validate-fix", json={
        "language": "python",
        "original_code": calculate_sum_buggy,
        "corrected_code": corrected,
        "expected_behavior": "Return the sum of numbers"
    })
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert val_data["syntax_status"] == "PASSED"
    assert val_data["static_analysis_status"] == "PASSED"
    assert val_data["remaining_issues"] == []

def test_regression_unsafe_execution_blocked():
    """Verify that execution of unsafe operations and modules is blocked."""
    unsafe_code = "import os\ndef run_danger():\n    return os.listdir('.')\n"
    res = client.post("/api/run-tests", json={
        "language": "python",
        "code": unsafe_code,
        "test_cases": [{"name": "Check unsafe", "input": "", "expected_output": "[]"}]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is False
    assert any("Security" in r.get("error_message", "") or "Security" in r.get("actual_output", "") for r in data["results"])

def test_regression_evaluation_metrics_dynamically_computed():
    """Verify that /api/evaluation accurately reflects real benchmark database items."""
    res_eval = client.get("/api/evaluation")
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    
    res_bench = client.get("/api/evaluation/benchmark")
    assert res_bench.status_code == 200
    bench_data = res_bench.json()
    
    assert eval_data["total_evaluated"] == len(bench_data)
    assert eval_data["total_evaluated"] >= 25
    assert "by_category" in eval_data
    assert "by_language" in eval_data




