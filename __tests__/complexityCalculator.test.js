const {calculateComplexity} = require('../complexityCalculator');

describe('calculateComplexity', () => {
    test('calculates complexity for simple expressions', () => {
        expect(calculateComplexity('2+2')).toBe(3); // 2 operands, 1 operator
        expect(calculateComplexity('3*3')).toBe(3); // 2 operands, 1 operator
    });

    test('calculates complexity for expressions with multiple operators', () => {
        expect(calculateComplexity('2+2*3')).toBe(6); // 3 operands, 2 operators (2 unique operators)
        expect(calculateComplexity('4/2-1')).toBe(7); // 3 operands, 2 operators (2 unique operators)
    });

    test('calculates complexity for expressions with unique operators', () => {
        expect(calculateComplexity('2+2-2')).toBe(5); // 3 operands, 2 unique operators
        expect(calculateComplexity('3*3/3')).toBe(5); // 3 operands, 2 unique operators
    });

    test('penalizes for excessive operands', () => {
        expect(calculateComplexity('1+1+1+1+1+1+1+1+1+1+1')).toBe(1); // 11 operands, 10 operators
        expect(calculateComplexity('1+1+1+1+1+1+1+1+1+1+1+1')).toBe(1); // 12 operands, 11 operators
    });

    test('penalizes for trivial operations', () => {
        const testCases = [
            ['2^0', 1],
            ['0*5', 1],
            ['0*10', 1],
            ['0*100', 1],
            ['2+3', 3],  // non-trivial case for comparison
        ];

        testCases.forEach(([expression, expected]) => {
            const result = calculateComplexity(expression);
            console.log(`Expression: ${expression}, Expected: ${expected}, Actual: ${result}`);
            expect(result).toBe(expected);
        });
    });

    test('ensures minimum complexity of 1', () => {
        expect(calculateComplexity('')).toBe(1); // empty expression
        expect(calculateComplexity('0')).toBe(1); // single operand
    });

    test('calculates complexity for complex expressions', () => {
        expect(calculateComplexity('2+2*3-4/2')).toBe(11); // 4 operands, 3 unique operators
        expect(calculateComplexity('3*3/3+2-1')).toBe(11); // 5 operands, 4 unique operators
    });
});
