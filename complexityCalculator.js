function calculateComplexity(expression) {
    const operators = expression.match(/[\+\-\*\/\^\√]/g) || [];
    const operands = expression.match(/\d+/g) || [];
    const uniqueOperators = new Set(operators);
    const uniqueOperands = new Set(operands);

    // Calculate complexity based on unique operands and operators
    let complexity = uniqueOperands.size + uniqueOperators.size * 2;

    // Penalize for excessive operands
    const MAX_OPERANDS = 10;
    if (operands.length > MAX_OPERANDS) {
        complexity = Math.floor(complexity / (operands.length - MAX_OPERANDS + 1));
    }

    // Penalize for trivial operations like x^0 or 0*x
    const trivialPowerPattern = /\d+\s*\^\s*0/g;
    const trivialMultiplyPattern = /0\s*\*/g;
    const trivialPowerMatches = expression.match(trivialPowerPattern) || [];
    const trivialMultiplyMatches = expression.match(trivialMultiplyPattern) || [];
    complexity -= (trivialPowerMatches.length + trivialMultiplyMatches.length);

    return Math.max(1, complexity); // Ensure minimum complexity of 1
}

module.exports = {calculateComplexity};
