import type { Category } from '../types'

const COLORS = [
  '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2',
  '#1b4332', '#081c15', '#d8f3dc', '#b7e4c7', '#a8dadc',
  '#457b9d', '#1d3557', '#e9c46a', '#f4a261', '#e76f51',
  '#264653', '#2a9d8f', '#e9d8a6', '#94d2bd', '#0a9396',
  '#005f73', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012',
  '#9b2226', '#6a994e', '#a7c957', '#386641', '#bc4749',
  '#6d597a', '#b56576', '#e56b6f',
]

const NAMES: Array<{ name: string; group?: string }> = [
  { name: 'Продукты' },
  { name: 'Обеды' },
  { name: 'Аптека' },
  { name: 'Мобильный' },
  { name: 'Дом' },
  { name: 'Такси', group: 'Авто' },
  { name: 'Аврора' },
  { name: 'Интернет', group: 'Коммуналка' },
  { name: 'Сервис' },
  { name: 'Подарки' },
  { name: 'Бензин', group: 'Авто' },
  { name: 'Наташа' },
  { name: 'Одежда' },
  { name: 'Досуг' },
  { name: 'Кредит' },
  { name: 'Отпуск' },
  { name: 'Школа', group: 'Дети' },
  { name: 'Коммуналка', group: 'Коммуналка' },
  { name: 'Парикмахерская' },
  { name: 'КредитАльфа' },
  { name: 'Алиса' },
  { name: 'Лечение' },
  { name: 'Налоги' },
  { name: 'Рестораны' },
  { name: 'Мойка', group: 'Авто' },
  { name: 'Репетитор', group: 'Дети' },
  { name: 'Животные' },
  { name: 'Штрафы' },
  { name: 'Спорт' },
  { name: 'Кино' },
  { name: 'Дети', group: 'Дети' },
  { name: 'Авто', group: 'Авто' },
  { name: 'Прочее' },
]

export const SEED_CATEGORIES: Category[] = NAMES.map((item, i) => ({
  name: item.name,
  group: item.group,
  color: COLORS[i % COLORS.length],
  sortOrder: i,
}))
