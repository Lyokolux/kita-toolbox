import { Routes } from '@angular/router';
import { Design } from './components/views/design/design';
import { LetterSheet } from './components/views/letter-sheet/letter-sheet';

export const routes: Routes = [
  {
    path: '',
    component: LetterSheet,
  },
  {
    path: 'design',
    component: Design,
  },
];
