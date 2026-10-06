# Kita Toolbox

A small web toolbox for daycare (Kita) educators, built with Angular. It produces printable worksheets for children and is currently nearly nothing.

## Tools

### Vornamen-Blatt (first name sheet)

Enter a child's first name and generate an A4 PDF for handwriting practice:

- one line per letter of the name (in uppercase), followed by a line with the whole name
- a dotted guide line under each row to trace and write on
- a live preview of the lines before export
- the PDF is downloaded as `<name>.pdf`

PDFs are generated entirely in the browser with [jsPDF](https://github.com/parallax/jsPDF). No data leaves the device.

## Getting started

Requirements: Node.js and npm.

```bash
npm install
npm start
```

Then open `http://localhost:4200/`. The app reloads automatically when you change source files.

## Tech stack

- [Angular](https://angular.dev)
- UI look and feel from [PaperCSS](https://www.getpapercss.com/) for the hand-drawn look
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
