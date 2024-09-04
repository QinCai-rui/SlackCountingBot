const {
    factorial,
    isPrime,
    parseExpression,
    simplifyExpression,
    evaluateExpression
} = require('../mathOperations');

describe('factorial', () => {
    test('calculates factorial of 0', () => {
        expect(factorial(0)).toBe(1);
    });

    test('calculates factorial of positive integers', () => {
        expect(factorial(1)).toBe(1);
        expect(factorial(5)).toBe(120);
        expect(factorial(10)).toBe(3628800);
    });

    test('returns NaN for negative numbers', () => {
        expect(factorial(-1)).toBe(NaN);
    });

    test('handles large numbers', () => {
        expect(factorial(20)).toBe(2432902008176640000);
    });
});

describe('isPrime', () => {
    test('correctly identifies prime numbers', () => {
        expect(isPrime(2)).toBe(true);
        expect(isPrime(3)).toBe(true);
        expect(isPrime(17)).toBe(true);
        expect(isPrime(97)).toBe(true);
    });

    test('correctly identifies non-prime numbers', () => {
        expect(isPrime(1)).toBe(false);
        expect(isPrime(4)).toBe(false);
        expect(isPrime(100)).toBe(false);
    });

    test('handles edge cases', () => {
        expect(isPrime(0)).toBe(false);
        expect(isPrime(-1)).toBe(false);
    });
});

describe('parseExpression', () => {
    test('replaces √ with sqrt', () => {
        expect(parseExpression('√9')).toBe('sqrt(9)');
        expect(parseExpression('2+√16')).toBe('2+sqrt(16)');
    });

    test('replaces factorials', () => {
        expect(parseExpression('5!')).toBe('factorial(5)');
        expect(parseExpression('3!+4!')).toBe('factorial(3)+factorial(4)');
    });

    test('handles complex expressions', () => {
        expect(parseExpression('2+√16*5!')).toBe('2+sqrt(16)*factorial(5)');
    });
});

describe('simplifyExpression', () => {
    test('simplifies basic expressions', () => {
        expect(simplifyExpression('2+3')).toBe('5');
        expect(simplifyExpression('4*3')).toBe('12');
    });

    test('handles sqrt expressions', () => {
        expect(simplifyExpression('√16')).toBe('4');
        expect(simplifyExpression('2+√9')).toBe('5');
    });

    test('simplifies complex expressions', () => {
        expect(simplifyExpression('2+3*4')).toBe('14');
        expect(simplifyExpression('(2+3)*4')).toBe('20');
    });

    test('returns original expression if simplification fails', () => {
        const complexExpression = '0^0+' + '0*'.repeat(1000) + '1';
        expect(simplifyExpression(complexExpression)).toBe(complexExpression);
    });
});

describe('evaluateExpression', () => {
    test('evaluates basic expressions', async () => {
        await expect(evaluateExpression('2+3')).resolves.toBe(5);
        await expect(evaluateExpression('4*3')).resolves.toBe(12);
    });

    test('handles sqrt expressions', async () => {
        await expect(evaluateExpression('sqrt(16)')).resolves.toBe(4);
        await expect(evaluateExpression('2+sqrt(9)')).resolves.toBe(5);
    });

    test('evaluates complex expressions', async () => {
        await expect(evaluateExpression('2+3*4')).resolves.toBe(14);
        await expect(evaluateExpression('(2+3)*4')).resolves.toBe(20);
    });

    test('handles factorial', async () => {
        await expect(evaluateExpression('factorial(5)')).resolves.toBe(120);
    });

    test('rejects for invalid expressions', async () => {
        await expect(evaluateExpression('2+')).rejects.toThrow();
    });

    test('rejects for very complex expressions', async () => {
        const complexExpression = '(' + '1+'.repeat(10000) + '1)';
        await expect(evaluateExpression(complexExpression)).rejects.toThrow(/Evaluation timed out|Maximum call stack size exceeded/);
    });
});
