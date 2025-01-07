const math = require('mathjs');

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
        if (!isFinite(result)) break;
    }
    return result;
}

function isPrime(num) {
    for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
        if (num % i === 0) return false;
    }
    return num > 1;
}

function parseExpression(expression) {
    expression = expression.replace(/√(\d+)/g, 'sqrt($1)').replace(/√/g, 'sqrt');
    expression = expression.replace(/∛(\d+)/g, 'cbrt($1)').replace(/∛/g, 'cbrt');
    expression = expression.replace(/(\d+)!/g, 'factorial($1)');
    return expression;
}


function simplifyExpression(expression) {
    if (expression.length > 1000) {
        return expression;
    }

    // Check for repetitive patterns
    const repetitivePattern = /(\+0\*\d+){10,}/;
    if (repetitivePattern.test(expression)) {
        return '1'; // Since 0^0 = 1, and all other terms are 0
    }

    try {
        const preparedExpression = expression
            .replace(/√(\d+)/g, 'sqrt($1)')
            .replace(/√/g, 'sqrt');

        const simplified = math.simplify(preparedExpression);
        return simplified.toString().replace(/sqrt/g, '√');
    } catch (error) {
        console.error('Error simplifying expression:', error);
        return expression; // Return original expression if simplification fails
    }
}

function evaluateExpression(parsedExpression) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error("Evaluation timed out")), 5000);
        try {
            const scope = {factorial, sqrt: Math.sqrt, cbrt: Math.cbrt};  // Include cbrt in the scope
            const result = math.evaluate(parsedExpression, scope);
            clearTimeout(timeoutId);
            resolve(result);
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

module.exports = {
    factorial,
    isPrime,
    parseExpression,
    simplifyExpression,
    evaluateExpression
};
