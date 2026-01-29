export type CategoryColor =
    | 'blue'
    | 'yellow'
    | 'green-light'
    | 'pink'
    | 'green'
    | 'purple'
    | 'gray'
    | 'holiday'
    | null;

export interface Category {
    id: string;
    name: string;
    color: CategoryColor;
}

export interface DayData {
    color: CategoryColor;
    text: string;
}

export interface CalendarData {
    [key: string]: DayData[]; // key format: "YYYY-MM-DD"
}

export interface MonthData {
    month: number;
    year: number;
    name: string;
}

export const MONTHS_PT: string[] = [
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO',
];

export const WEEKDAYS_PT: string[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'TRÁFEGO BITTENCOURT', color: 'blue' },
    { id: '2', name: 'TRÁFEGO LETÍCIA', color: 'yellow' },
    { id: '3', name: 'DIVULGAÇÃO BITTENCOURT', color: 'green-light' },
    { id: '4', name: 'DIVULGAÇÃO LETÍCIA', color: 'pink' },
    { id: '5', name: 'CRIAR ARTES', color: 'green' },
    { id: '6', name: 'OUTRAS CIDADES', color: 'purple' },
    { id: '7', name: 'FERIADO', color: 'gray' },
];
