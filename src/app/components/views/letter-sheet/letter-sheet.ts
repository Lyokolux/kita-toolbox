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
    doc.setFont('helvetica'); // century gothic?
    doc.setFontSize(FONT_SIZE);

    const margin = 20;
    const lineHeight = FONT_SIZE * 0.5;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'bold');
    doc.text('Schreibübung', pageWidth / 2, margin, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(FONT_SIZE * 0.7);
    doc.text(`Vorname: ${this.text()}`, margin, margin + 1 * lineHeight);
    doc.text(`Datum:`, margin, margin + 2 * lineHeight);

    doc.setFontSize(FONT_SIZE);
    const [letters, firstname] = [this.lines().slice(0, -1), this.lines().at(-1)!];

    let y = margin + lineHeight * 3.5;
    doc.setFillColor(180, 180, 180);

    const DOT_HEIGHT_MARGIN = 3;
    const DOT_RADIUS = 0.4;
    const DOT_HEIGHT_SPACE = DOT_HEIGHT_MARGIN + DOT_RADIUS;
    for (const line of letters) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      // draw the letter line
      doc.text(line, margin, y);
      // draw the following dots
      const letterWidth = doc.getTextWidth(line);

      const letterDotWidth = Math.max(letterWidth, 5);
      const letterDotMidWidth = letterDotWidth / 2;
      for (
        let x = margin + letterWidth / 2;
        x <= pageWidth - margin;
        x += letterWidth + letterDotMidWidth
      ) {
        doc.circle(x, y + DOT_HEIGHT_MARGIN, DOT_RADIUS, 'F');
      }
      y += lineHeight + DOT_HEIGHT_SPACE;
    }

    // Last line: the whole word centered, then one dot under each character.
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    } else {
      y += margin;
    }
    const startX = (pageWidth - doc.getTextWidth(firstname)) / 2;
    const CHAR_SPACE = 2;
    doc.text(firstname, startX, y, { charSpace: CHAR_SPACE });
    const dotsY = y + lineHeight;
    let x = startX;
    for (const char of firstname) {
      const charWidth = doc.getTextWidth(char);
      if (char.trim() !== '') {
        doc.circle(x + charWidth / 2, dotsY, 1, 'F');
      }
      x += charWidth + CHAR_SPACE;
    }

    doc.save(`schreibuebung-${this.text().trim()}.pdf`);
  }
}
