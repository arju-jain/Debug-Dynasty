export interface CodeExample {
  title: string;
  language: string;
  code: string;
  error_description: string;
  expected_behavior: string;
  stdin?: string;
  test_cases: Array<{ name?: string; input: string; expected_output: string }>;
}

export const CODE_EXAMPLES: Record<string, CodeExample> = {
  python: {
    title: 'Python: Discount Calculation Operator Defect',
    language: 'python',
    code: `def calculate_discount(price, discount_percent):
    # Bug: Adds discount instead of subtracting
    discount = price * (discount_percent / 100)
    final_price = price + discount
    return f"Final price: {final_price}"
`,
    error_description: 'calculate_discount(1000, 10) returns "Final price: 1100.0" instead of "Final price: 900.0"',
    expected_behavior: 'Discount should be deducted from the base price: calculate_discount(1000, 10) must return "Final price: 900.0"',
    stdin: '',
    test_cases: [
      { name: '10% Discount on 1000', input: '1000, 10', expected_output: 'Final price: 900.0' },
      { name: '20% Discount on 500', input: '500, 20', expected_output: 'Final price: 400.0' },
      { name: '0% Discount on 100', input: '100, 0', expected_output: 'Final price: 100.0' },
    ],
  },
  javascript: {
    title: 'JavaScript: Async Race Condition & Array Mutation',
    language: 'javascript',
    code: `function mergeIntervals(intervals) {
    if (!intervals.length) return [];
    
    // Bug: sorting without comparator coerces numbers to strings ("10" < "2")
    intervals.sort();
    
    const result = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const last = result[result.length - 1];
        
        // Bug: off-by-one boundary check and mutation
        if (current[0] < last[1]) {
            last[1] = Math.max(last[1], current[1]);
        } else {
            result.push(current);
        }
    }
    return result;
}
`,
    error_description: 'Intervals like [[1,4],[4,5]] are not merged because strictly less condition fails; alphabetical sort ruins multi-digit numbers like 10.',
    expected_behavior: 'Merge overlapping and contiguous intervals: [[1,4],[4,5]] should produce [[1,5]]. Numbers must be sorted numerically by start position.',
    stdin: '',
    test_cases: [
      { input: '[[1,4],[4,5]]', expected_output: '[[1,5]]' },
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expected_output: '[[1,6],[8,10],[15,18]]' },
    ],
  },
  java: {
    title: 'Java: Binary Search Integer Overflow & Null Safety',
    language: 'java',
    code: `public class BinarySearch {
    public static int search(int[] nums, int target) {
        if (nums == null) return -1;
        int low = 0;
        int high = nums.length; // Bug: should be nums.length - 1

        while (low <= high) {
            // Bug: low + high can overflow 32-bit signed integer for large arrays
            int mid = (low + high) / 2;
            
            if (nums[mid] == target) { // ArrayIndexOutOfBoundsException possible
                return mid;
            } else if (nums[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }
}
`,
    error_description: 'ArrayIndexOutOfBoundsException when target is greater than all elements; (low + high) overflows on large arrays.',
    expected_behavior: 'High should be initialized to nums.length - 1 and mid should be calculated using low + (high - low) / 2.',
    stdin: '',
    test_cases: [
      { input: '[-1,0,3,5,9,12], 9', expected_output: '4' },
      { input: '[-1,0,3,5,9,12], 2', expected_output: '-1' },
    ],
  },
  cpp: {
    title: 'C++: Memory Leak & Dangling Pointer in Linked List',
    language: 'cpp',
    code: `#include <iostream>

struct Node {
    int data;
    Node* next;
};

class LinkedList {
public:
    Node* head;
    LinkedList() : head(nullptr) {}

    void append(int val) {
        Node* newNode = new Node{val, nullptr};
        if (!head) {
            head = newNode;
            return;
        }
        Node* curr = head;
        while (curr->next != nullptr) {
            curr = curr->next;
        }
        curr->next = newNode;
    }

    void remove(int val) {
        // Bug: If head is removed, memory is freed but head pointer is dangling
        if (head && head->data == val) {
            delete head; // Use-after-free bug
            head = head->next;
            return;
        }
    }
};
`,
    error_description: 'delete head executed before reading head->next, creating an undefined behavior / use-after-free memory corruption.',
    expected_behavior: 'Store head->next in a temporary pointer before deleting head to avoid use-after-free and memory leaks.',
    stdin: '',
    test_cases: [
      { input: 'append(1), append(2), remove(1)', expected_output: 'head->data == 2' },
    ],
  },
};
