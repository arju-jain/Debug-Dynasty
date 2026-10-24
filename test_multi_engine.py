import multi_error_engine

test_code = """def calculate_metrics(numbers)
    val = math.sqrt(16)
    if numbers = []:
        return 0
    total = sum(numbers
    return total - len(numbers)
"""

res = multi_error_engine.analyze_code_multi_error("python", test_code, "Calculate sum of numbers")

print("Total issues detected:", len(res["issues"]))
for i, iss in enumerate(res["issues"]):
    print(f"  {i+1}. Line {iss['line']}:{iss.get('column',0)} [{iss['category']}] ({iss['severity']}): {iss['message']}")

print("\nVerification status:", res["verification_status"])
print("Is valid fix:", res["is_valid_fix"])
print("Validation note:", res["validation_note"])
print("\n--- Corrected Code ---")
print(res["corrected_code"])
