function calculateComplexity(expression) {
    const operators = expression.match(/[\+\-\*\/\^\√]/g) || [];
    const operands = expression.match(/\d+/g) || [];
    const uniqueOperators = new Set(operators);
    const uniqueOperands = new Set(operands);

    // Penalize for trivial operations like x^0 or 0*x
    const trivialPowerPattern = /\b\d+\s*\^\s*0\b/;
    const trivialMultiplyPattern = /\b0\s*\*\s*\d+\b/;
    if (trivialPowerPattern.test(expression) || trivialMultiplyPattern.test(expression)) {
        console.log('Expression:', expression, 'Complexity:', 1);
        return 1;
    }

    // Calculate complexity based on unique operands and operators
    let complexity = uniqueOperands.size + uniqueOperators.size * 2;

    // Penalize for excessive operands
    const MAX_OPERANDS = 10;
    if (operands.length > MAX_OPERANDS) {
        complexity = Math.floor(complexity / (operands.length - MAX_OPERANDS + 1));
    }

    // Adjust complexity for simple expressions
    if (uniqueOperators.size === 1 && uniqueOperands.size === 2) {
        complexity = 3;
    }

    console.log('Expression:', expression, 'Complexity:', complexity);

    return Math.max(1, complexity); // Ensure minimum complexity of 1
}

module.exports = {calculateComplexity};
