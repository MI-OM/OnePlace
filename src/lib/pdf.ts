import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PDFReportOptions = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  filename: string;
};

export function generatePDF(options: PDFReportOptions): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(options.title, 14, 22);

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(options.subtitle, 14, 30);
    doc.setTextColor(0);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, options.subtitle ? 36 : 30);
  doc.setTextColor(0);

  const startY = options.subtitle ? 42 : 36;

  autoTable(doc, {
    startY,
    head: [options.headers],
    body: options.rows.map((row) =>
      row.map((v) => (v == null ? "" : String(v))),
    ),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [18, 60, 58] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  return doc;
}

export function downloadPDF(options: PDFReportOptions) {
  const doc = generatePDF(options);
  doc.save(`${options.filename}.pdf`);
}
