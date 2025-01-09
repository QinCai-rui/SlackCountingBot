function calculateComplexity(expression) {
    const operators = expression.match(/[\+\-\*\/\^\√∛]/g) || [];  // Include ∛ (cbrt) in the operators pattern
    const operands = expression.match(/\d+/g) || [];
    const uniqueOperators = new Set(operators);
    const uniqueOperands = new Set(operands);

    // Include sqrt() and cbrt() in the complexity calculation
    const sqrtPattern = /sqrt\(/g;
    const sqrtCount = (expression.match(sqrtPattern) || []).length;
    const cbrtPattern = /cbrt\(/g;  // Adjust the pattern to match cbrt
    const cbrtCount = (expression.match(cbrtPattern) || []).length;

    // Penalize for trivial operations like x^0 or 0*x
    const trivialPowerPattern = /\b\d+\s*\^\s*0\b/;
    const trivialMultiplyPattern = /\b0\s*\*\s*\d+\b/;

    // Penalize for repetitive sequences like 13+13-13/13*13+13-13/13*13+13-13/13*13
    const repetitiveSequencePattern = /(\d+[\+\-\*\/]\d+)([\+\-\*\/]\d+)*(\1)+/;

    if (
        trivialPowerPattern.test(expression) ||
        trivialMultiplyPattern.test(expression) ||
        repetitiveSequencePattern.test(expression)
    ) {
        console.log('Expression:', expression, 'Complexity:', 1);
        return 1;
    }

    // Calculate complexity based on unique operands, operators, sqrt count, and cbrt count
    let complexity = uniqueOperands.size + uniqueOperators.size * 2 + sqrtCount * 2 + cbrtCount * 2;

    // Penalize for excessive operands
    const MAX_OPERANDS = 35;
    if (operands.length > MAX_OPERANDS) {
        complexity = Math.floor(complexity / (operands.length - MAX_OPERANDS + 1));
    }

    // Adjust complexity for simple expressions
    if (uniqueOperators.size === 0 && uniqueOperands.size === 1 && sqrtCount === 0 && cbrtCount === 0) {
        complexity = 2;
    }

    console.log('Expression:', expression, 'Complexity:', complexity);

    return Math.max(1, complexity); // Ensure minimum complexity of 1
}

module.exports = { calculateComplexity };
