import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const generateCertificate = (
  donorName: string,
  scrapType: string,
  donationDate: string,
  donationEmail: string,
  outputPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Initialize PDF document with A4 size and margins
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Define constants for page dimensions (A4: 595 x 842 points)
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;

    // Register fonts (use Helvetica as fallback, or load custom fonts if available)
    doc.registerFont('PrimaryFont', 'Helvetica');
    doc.registerFont('BoldFont', 'Helvetica-Bold');

    // ===== Decorative Border =====
    doc
      .rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
      .strokeColor('#2c6e49')
      .lineWidth(3)
      .stroke();
    doc
      .rect(margin + 10, margin + 10, pageWidth - 2 * (margin + 10), pageHeight - 2 * (margin + 10))
      .strokeColor('#c8b273')
      .lineWidth(1)
      .stroke();

    // ===== HEADER with Logo =====
    const logoPath = path.resolve(__dirname, '../images/gauabhayaranyam.png');
    let currentY = margin + 20;

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, (pageWidth - 120) / 2, currentY, { width: 120, align: 'center' });
        currentY += 130; // Adjust Y position after logo
      } catch (err) {
        console.warn('Error loading logo:', err);
        // Fallback: Add organization name as text if logo fails
        doc
          .fontSize(24)
          .font('BoldFont')
          .fillColor('#2c6e49')
          .text('GauAbhayaranyam', 0, currentY, { align: 'center' });
        currentY += 40;
      }
    } else {
      console.warn('Logo not found at', logoPath);
      doc
        .fontSize(24)
        .font('BoldFont')
        .fillColor('#2c6e49')
        .text('GauAbhayaranyam', 0, currentY, { align: 'center' });
      currentY += 40;
    }

    // Horizontal line
    doc
      .moveTo(margin + 50, currentY)
      .lineTo(pageWidth - margin - 50, currentY)
      .strokeColor('#c8b273')
      .lineWidth(1.5)
      .stroke();
    currentY += 20;

    // ===== TITLE =====
    doc
      .fontSize(28)
      .font('BoldFont')
      .fillColor('#2c6e49')
      .text('Certificate of Scrap Donation', 0, currentY, { align: 'center' });
    currentY += 50;

    // ===== MAIN TEXT =====
    doc
      .fontSize(14)
      .font('PrimaryFont')
      .fillColor('#333333')
      .text('This certificate is proudly presented to', 0, currentY, { align: 'center' });
    currentY += 30;

    // Handle long donor names by adjusting font size dynamically
    const donorNameFontSize = donorName.length > 30 ? 18 : 22;
    doc
      .fontSize(donorNameFontSize)
      .font('BoldFont')
      .fillColor('#000000')
      .text(donorName, margin, currentY, { align: 'center', width: contentWidth });
    currentY += 40;

    doc
      .fontSize(14)
      .font('PrimaryFont')
      .fillColor('#333333')
      .text(
        `In recognition of your generous scrap donation (${scrapType}) made on ${donationDate}.`,
        margin,
        currentY,
        { align: 'center', width: contentWidth }
      );
    currentY += 50;

    doc
      .fontSize(12)
      .font('PrimaryFont')
      .fillColor('#2c6e49')
      .text(
        'Your contribution plays a vital role in our mission to protect cows and promote a sustainable environment.',
        margin,
        currentY,
        { align: 'center', width: contentWidth }
      );
    currentY += 60;

    // ===== SIGNATURE / ISSUED SECTION =====
    doc
      .fontSize(12)
      .font('PrimaryFont')
      .fillColor('#000000')
      .text('Issued by: GauAbhayaranyam', 0, currentY, { align: 'center' });
    currentY += 20;
    doc
      .fontSize(12)
      .text(`Date of Issue: ${new Date().toLocaleDateString('en-GB')}`, 0, currentY, {
        align: 'center',
      });
    currentY += 30;

    // ===== FOOTER =====
    const footerY = pageHeight - margin - 30; // Ensure footer stays within margins
    doc
      .moveTo(margin + 50, footerY - 10)
      .lineTo(pageWidth - margin - 50, footerY - 10)
      .strokeColor('#c8b273')
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(10)
      .font('PrimaryFont')
      .fillColor('gray')
      .text(
        'www.gauabhayaranyam.org | seva@gauabhayaranyam.org | +91 98765 43210',
        margin,
        footerY,
        { align: 'center', width: contentWidth }
      );

    // Finalize the PDF
    doc.end();

    stream.on('finish', () => {
      console.log('✅ PDF written to:', outputPath);
      resolve(outputPath);
    });

    stream.on('error', (err) => {
      console.error('❌ Error writing PDF:', err);
      reject(err);
    });
  });
};

export { generateCertificate };