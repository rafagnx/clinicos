import { addDays, getDate, getMonth, getYear, isSameDay } from 'date-fns';

export interface Holiday {
    date: Date;
    name: string;
}

// Logic to calculate mobile holidays (Easter, Carnival, Corpus Christi)
function getEaster(year: number): Date {
    const f = Math.floor,
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);

    return new Date(year, month - 1, day);
}

export function getHolidays(year: number): Holiday[] {
    const easter = getEaster(year);
    const carnival = addDays(easter, -47);
    const goodFriday = addDays(easter, -2);
    const corpusChristi = addDays(easter, 60);

    const fixedHolidays = [
        { date: new Date(year, 0, 1), name: 'Ano Novo' },
        { date: new Date(year, 3, 21), name: 'Tiradentes' },
        { date: new Date(year, 4, 1), name: 'Dia do Trabalho' },
        { date: new Date(year, 8, 7), name: 'Independência' },
        { date: new Date(year, 9, 12), name: 'Nossa Sra. Aparecida' },
        { date: new Date(year, 10, 2), name: 'Finados' },
        { date: new Date(year, 10, 15), name: 'Proclamação da República' },
        { date: new Date(year, 11, 25), name: 'Natal' },
    ];

    const mobileHolidays = [
        { date: carnival, name: 'Carnaval' },
        { date: goodFriday, name: 'Sexta-feira Santa' },
        { date: easter, name: 'Páscoa' },
        { date: corpusChristi, name: 'Corpus Christi' },
    ];

    return [...fixedHolidays, ...mobileHolidays].sort((a, b) => a.date.getTime() - b.date.getTime());
}
