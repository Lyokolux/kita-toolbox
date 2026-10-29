import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';

const FONT_NAME = 'DejaVuSans';
const MATERNELLE_FONT_NAME = 'MaternelleGraphisme';

type FontFile = { file: string; name: string; style: string };

const BASE_FONTS: FontFile[] = [
  { file: 'DejaVuSans.ttf', name: FONT_NAME, style: 'normal' },
  { file: 'DejaVuSans-Bold.ttf', name: FONT_NAME, style: 'bold' },
];
const MATERNELLE_FONT: FontFile = {
  file: 'MaternelleGraphisme.ttf',
  name: MATERNELLE_FONT_NAME,
  style: 'normal',
};

const fontCache = new Map<string, Promise<string>>();

function loadFont(file: string): Promise<string> {
  let promise = fontCache.get(file);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(new URL(`fonts/${file}`, document.baseURI));
      if (!response.ok) throw new Error(`Failed to load font ${file}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(binary);
    })().catch((error) => {
      fontCache.delete(file);
      throw error;
    });
    fontCache.set(file, promise);
  }
  return promise;
}

@Component({
  imports: [FormsModule],
  selector: 'app-letter-sheet',
  templateUrl: './letter-sheet.html',
  styleUrl: './letter-sheet.css',
})
export class LetterSheet {
  protected readonly text = signal('');
  protected readonly useMaternelle = signal(false);

  SYMBOLS = ['+', '*', '→', '←', '↑', '↓', '△', 'ℓ'];

  protected readonly lines = computed(() => {
    const value = this.text().trim().toUpperCase();
    if (!value) return [];
    return [...Array.from(value).filter((c) => c.trim() !== ''), value];
  });

  protected async generatePdf(): Promise<void> {
    const FONT_SIZE = 28;
    if (this.lines().length === 0) return;

    const fontFiles = [...BASE_FONTS];
    if (this.useMaternelle()) fontFiles.push(MATERNELLE_FONT);
    const fontData = await Promise.all(fontFiles.map(({ file }) => loadFont(file)));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    fontFiles.forEach(({ file, name, style }, i) => {
      doc.addFileToVFS(file, fontData[i]);
      doc.addFont(file, name, style);
    });

    const maternelleGlyphs = this.useMaternelle()
      ? (
          doc.setFont(MATERNELLE_FONT_NAME, 'normal').getFont() as unknown as {
            metadata: { characterToGlyph(code: number): number };
          }
        ).metadata
      : undefined;
    // Maternelle only for alphabetical letters (incl. umlauts/ß, excl. symbols like ℓ)
    // that the font supports, otherwise the base font.
    const isAlphabetical = (char: string) => /\p{L}/u.test(char) && !this.SYMBOLS.includes(char);
    const fontFor = (char: string) =>
      isAlphabetical(char) && maternelleGlyphs?.characterToGlyph(char.codePointAt(0)!)
        ? MATERNELLE_FONT_NAME
        : FONT_NAME;
    // Draws `text` letter by letter, each in its own font. Returns per-letter positions.
    const drawText = (text: string, startX: number, y: number, charSpace = 0) => {
      let x = startX;
      return Array.from(text).map((char) => {
        doc.setFont(fontFor(char), 'normal');
        const width = doc.getTextWidth(char);
        doc.text(char, x, y);
        const placed = { char, x, width };
        x += width + charSpace;
        return placed;
      });
    };
    const measureText = (text: string, charSpace = 0) => {
      const chars = Array.from(text);
      return chars.reduce(
        (sum, char) => {
          doc.setFont(fontFor(char), 'normal');
          return sum + doc.getTextWidth(char);
        },
        charSpace * Math.max(chars.length - 1, 0),
      );
    };

    const margin = 20;
    const lineHeight = FONT_SIZE * 0.5;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont(FONT_NAME, 'bold');
    doc.setFontSize(FONT_SIZE);
    doc.text('Schreibübung', pageWidth / 2, margin, { align: 'center' });
    doc.setFont(FONT_NAME, 'normal');

    doc.setFontSize(FONT_SIZE * 0.7);
    const label = 'Vorname: ';
    doc.text(label, margin, margin + 1 * lineHeight);
    doc.text(this.text(), margin + doc.getTextWidth(label), margin + 1 * lineHeight);
    doc.setFont(FONT_NAME, 'normal');
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
      const letterWidth = measureText(line);
      drawText(line, margin, y);
      // draw the following dots

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
    const CHAR_SPACE = 2;
    const startX = (pageWidth - measureText(firstname, CHAR_SPACE)) / 2;
    const dotsY = y + lineHeight;
    for (const { char, x, width } of drawText(firstname, startX, y, CHAR_SPACE)) {
      if (char.trim() !== '') {
        doc.circle(x + width / 2, dotsY, 1, 'F');
      }
    }

    doc.save(`schreibuebung-${this.text().trim()}.pdf`);
  }
}
