// validationUtils.ts

// Função para validar CPF
export const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11 || /^(.)\1{10}$/.test(cpf)) return false;

    const calculateDigit = (digits: string) => {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            sum += parseInt(digits[i]) * (digits.length + 1 - i);
        }
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };

    const firstDigit = calculateDigit(cpf.substring(0, 9));
    const secondDigit = calculateDigit(cpf.substring(0, 9) + firstDigit);

    return cpf.endsWith(firstDigit.toString() + secondDigit.toString());
};

// Função para validar CNPJ
export const isValidCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14 || /^(.)\1{13}$/.test(cnpj)) return false;

    const calculateDigit = (digits: string, weights: number[]) => {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            sum += parseInt(digits[i]) * weights[i];
        }
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const firstDigit = calculateDigit(cnpj.substring(0, 12), weights1);
    const secondDigit = calculateDigit(cnpj.substring(0, 12) + firstDigit, weights2);

    return cnpj.endsWith(firstDigit.toString() + secondDigit.toString());
};

// Função para validar identificador
export const validateIdentifier = (identifier: string): string | null => {
    identifier = identifier.replace(/\D/g, '');

    if (identifier.length === 11) {
        return isValidCPF(identifier) ? null : 'CPF inválido.';
    } else if (identifier.length === 14) {
        return isValidCNPJ(identifier) ? null : 'CNPJ inválido.';
    } else {
        return 'Identificador deve ter 11 (CPF) ou 14 (CNPJ) dígitos.';
    }
};
