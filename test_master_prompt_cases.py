"""
Automated Backend Test Suite for Debug Dynasty Master Prompt Requirements
Verifies Test A through Test I:
- Test A: Multiple syntax errors
- Test B: Syntax and undefined variable
- Test C: Logic error (negative numbers max)
- Test D: Runtime error (ZeroDivisionError)
- Test E: Correct code (0 errors)
- Test F: Negative numbers boundary
- Test G: Empty input validation
- Test H: Non-Python code (JavaScript)
- Test I: Fix validation failure
"""

import sys
import multi_error_engine

def test_suite():
    print("==================================================")
    print("RUNNING MASTER PROMPT TESTS (Test A -> Test I)")
    print("==================================================")
    
    passed_tests = 0
    total_tests = 9

    # ----------------------------------------------------
    # Test A: Multiple syntax errors
    # ----------------------------------------------------
    print("\n--- Test A: Multiple Syntax Errors ---")
    code_a = """def calculate_total(numbers)
    total = 0

    for num in numbers
        total += num

    print("Total:", total
"""
    res_a = multi_error_engine.analyze_code_multi_error("python", code_a)
    print(f"Issues detected: {len(res_a['issues'])}")
    for iss in res_a['issues']:
        print(f"  Line {iss['line']}:{iss.get('column')}: [{iss['category']}] {iss['message']}")
    print(f"Fix valid: {res_a['is_valid_fix']}, Status: {res_a['verification_status']}")
    
    # Must detect line 1 colon, line 4 colon, line 6/7 unclosed parenthesis
    issue_lines_a = {iss['line'] for iss in res_a['issues']}
    assert 1 in issue_lines_a, f"Test A: Line 1 colon error not detected! Found lines: {issue_lines_a}"
    assert 4 in issue_lines_a, f"Test A: Line 4 colon error not detected! Found lines: {issue_lines_a}"
    assert any(iss['line'] in (6, 7) and "bracket" in iss['message'].lower() or "unclosed" in iss['message'].lower() for iss in res_a['issues']), "Test A: Unclosed paren not detected!"
    assert res_a['is_valid_fix'] == True, "Test A: Proposed fix failed validation!"
    print("[OK] Test A Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test B: Syntax and undefined variable
    # ----------------------------------------------------
    print("\n--- Test B: Syntax and Undefined Variable ---")
    code_b = """def calculate_average(numbers):
    total = 0

    for num in numbers
        total += number

    average = total / len(numbers)
    print("Average:", average
"""
    res_b = multi_error_engine.analyze_code_multi_error("python", code_b)
    print(f"Issues detected: {len(res_b['issues'])}")
    for iss in res_b['issues']:
        print(f"  Line {iss['line']}:{iss.get('column')}: [{iss['category']}] {iss['message']}")
    print(f"Fix valid: {res_b['is_valid_fix']}, Status: {res_b['verification_status']}")

    issue_msgs_b = [iss['message'] for iss in res_b['issues']]
    assert any("colon" in m.lower() for m in issue_msgs_b), "Test B: Missing colon not detected!"
    assert any("number" in m for m in issue_msgs_b), "Test B: Undefined variable 'number' not detected!"
    assert any("unclosed" in m.lower() or "bracket" in m.lower() for m in issue_msgs_b), "Test B: Unclosed print paren not detected!"
    assert len(res_b['issues']) >= 3, f"Test B expected >= 3 issues, got {len(res_b['issues'])}"
    print("[OK] Test B Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test C: Logic error (find_maximum initialized to 0)
    # ----------------------------------------------------
    print("\n--- Test C: Logic Error in Maximum Function ---")
    code_c = """def find_maximum(numbers):
    max_value = 0

    for num in numbers:
        if num > max_value:
            max_value = num

    return max_value

print(find_maximum([-10, -25, -5]))
"""
    res_c = multi_error_engine.analyze_code_multi_error("python", code_c)
    print(f"Issues detected: {len(res_c['issues'])}")
    for iss in res_c['issues']:
        print(f"  Line {iss['line']}: [{iss['category']}] {iss['message']}")
    print(f"Fix valid: {res_c['is_valid_fix']}, Status: {res_c['verification_status']}")

    assert any(iss['category'] == "Logic" for iss in res_c['issues']), "Test C: Logic error not flagged!"
    assert any("negative" in iss['explanation'].lower() or "0" in iss['message'] for iss in res_c['issues']), "Test C: Negative numbers explanation missing!"
    # Ensure syntax error was NOT falsely reported
    assert not any(iss['category'] == "Syntax" for iss in res_c['issues']), "Test C: False syntax error reported on valid code!"
    
    # Test the corrected code execution
    exec_c = multi_error_engine.run_isolated_execution(res_c['corrected_code'])
    print(f"Corrected execution output: {exec_c['stdout'].strip()}")
    assert exec_c['stdout'].strip() == "-5", f"Test C: Expected output -5, got {exec_c['stdout'].strip()}"
    print("[OK] Test C Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test D: Runtime error (ZeroDivisionError)
    # ----------------------------------------------------
    print("\n--- Test D: Runtime Error (ZeroDivisionError) ---")
    code_d = """def divide_numbers(a, b):
    return a / b

print(divide_numbers(10, 0))
"""
    res_d = multi_error_engine.analyze_code_multi_error("python", code_d)
    print(f"Issues detected: {len(res_d['issues'])}")
    for iss in res_d['issues']:
        print(f"  Line {iss['line']}: [{iss['category']}] {iss['message']}")
    
    assert any("division by zero" in iss['message'].lower() or "zerodivisionerror" in iss['message'].lower() for iss in res_d['issues']), "Test D: Zero division not detected!"
    print("[OK] Test D Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test E: Correct code
    # ----------------------------------------------------
    print("\n--- Test E: Correct Code ---")
    code_e = """def add_numbers(a, b):
    return a + b

print(add_numbers(10, 20))
"""
    res_e = multi_error_engine.analyze_code_multi_error("python", code_e)
    print(f"Issues detected: {len(res_e['issues'])}")
    print(f"Execution output: {res_e['execution_result']['stdout'].strip() if res_e['execution_result'] else 'None'}")
    
    assert len(res_e['issues']) == 0, f"Test E: Expected 0 issues, got {len(res_e['issues'])}"
    assert res_e['verification_status'] == "Validated", "Test E: Expected Validated status"
    assert res_e['execution_result'] is not None and res_e['execution_result']['stdout'].strip() == "30", "Test E: Expected output 30"
    print("[OK] Test E Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test F: Negative numbers boundary
    # ----------------------------------------------------
    print("\n--- Test F: Negative Numbers Maximum ---")
    code_f = """def find_maximum(numbers):
    max_value = 0

    for num in numbers:
        if num > max_value:
            max_value = num

    return max_value

print(find_maximum([-3, -8, -1]))
"""
    res_f = multi_error_engine.analyze_code_multi_error("python", code_f)
    print(f"Issues detected: {len(res_f['issues'])}")
    exec_f = multi_error_engine.run_isolated_execution(res_f['corrected_code'])
    print(f"Corrected execution output: {exec_f['stdout'].strip()}")
    assert exec_f['stdout'].strip() == "-1", f"Test F: Expected output -1, got {exec_f['stdout'].strip()}"
    print("[OK] Test F Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test G: Empty input
    # ----------------------------------------------------
    print("\n--- Test G: Empty Input Validation ---")
    res_g = multi_error_engine.analyze_code_multi_error("python", "   \n  \t  ")
    print(f"Detected issue: {res_g['detected_issue']}")
    assert res_g['is_valid_fix'] == False, "Test G: Empty code should not be marked valid"
    assert "empty" in res_g['detected_issue'].lower(), "Test G: Missing empty validation message"
    print("[OK] Test G Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test H: Non-Python code (JavaScript)
    # ----------------------------------------------------
    print("\n--- Test H: Non-Python Code (JavaScript) ---")
    code_h = """function greet(name) {
    return "Hello, " + name;
}
console.log(greet("World"));
"""
    res_h = multi_error_engine.analyze_code_multi_error("javascript", code_h)
    print(f"Issues detected: {len(res_h['issues'])}, Detected issue: {res_h['detected_issue']}")
    assert len(res_h['issues']) == 0, f"Test H: Expected 0 issues for valid JS, got {len(res_h['issues'])}"
    assert not any("python" in iss['message'].lower() for iss in res_h['issues']), "Test H: Python errors reported on JS code!"
    print("[OK] Test H Passed!")
    passed_tests += 1

    # ----------------------------------------------------
    # Test I: Fix validation failure
    # ----------------------------------------------------
    print("\n--- Test I: Fix Validation Failure ---")
    bad_fix = """def broken_fix(a, b):
    return a + (b *
"""
    val_i = multi_error_engine.validate_code_fix(code_a, bad_fix, "python")
    print(f"Validation status: {val_i['verification_status']}, Is valid: {val_i['is_valid']}")
    assert val_i['is_valid'] == False, "Test I: Broken fix marked as valid!"
    assert val_i['verification_status'] == "Validation Failed", f"Test I: Status was {val_i['verification_status']}"
    print("[OK] Test I Passed!")
    passed_tests += 1

    print("\n==================================================")
    print(f"ALL TESTS PASSED: {passed_tests}/{total_tests}")
    print("==================================================")

if __name__ == "__main__":
    test_suite()
