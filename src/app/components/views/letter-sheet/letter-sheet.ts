import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';

@Component({
  imports: [FormsModule],
  selector: 'app-letter-sheet',
  templateUrl: './letter-sheet.html',
  styleUrl: './letter-sheet.css',
})
export class LetterSheet {
  protected readonly text = signal('');

  protected readonly lines = computed(() => {
    const value = this.text().trim().toUpperCase();
    if (!value) return [];
    return [...Array.from(value).filter((c) => c.trim() !== ''), value];
  });

  protected generatePdf(): void {
    const FONT_SIZE = 28;
    if (this.lines().length === 0) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica');
    doc.setFontSize(FONT_SIZE);

    const margin = 20;
    const lineHeight = FONT_SIZE * 0.5;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = margin;
    for (const line of this.lines()) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      doc.setDrawColor(180);
      doc.line(margin, y + 3, pageWidth - margin, y + 3);
      y += lineHeight;
    }

    doc.save(`${this.text().trim()}.pdf`);
  }
}
