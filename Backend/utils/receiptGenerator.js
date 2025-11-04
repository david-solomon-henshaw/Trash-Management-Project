
const PDFDocument = require('pdfkit');

/**
 * Generate payment receipt PDF
 * @param {Object} data - Receipt data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePaymentReceipt = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 40,
        bufferPages: true 
      });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add background for header
      doc.rect(0, 0, doc.page.width, 150)
         .fillColor('#2E8B57')
         .fill();

      // Header section
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(data.companyName || 'WASTE MANAGEMENT SERVICES', { 
           align: 'center',
           y: 60
         })
         .moveDown(0.3);

      doc.fontSize(12)
         .font('Helvetica')
         .text('PAYMENT RECEIPT', { align: 'center' })
         .moveDown(1.5);

      // Receipt container
      const receiptBoxY = 180;
      doc.roundedRect(40, receiptBoxY, doc.page.width - 80, doc.page.height - 300, 10)
         .fillColor('#FFFFFF')
         .fill()
         .strokeColor('#E2E8F0')
         .stroke();

      // Receipt header
      doc.fillColor('#2E8B57')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('Payment Confirmation', 60, receiptBoxY + 30, { align: 'center', width: doc.page.width - 120 });

      // Receipt details in two columns
      const leftColX = 60;
      const rightColX = doc.page.width / 2 + 20;
      let currentY = receiptBoxY + 80;

      // Left column
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('RECEIPT NUMBER', leftColX, currentY)
         .text('PAYMENT DATE', leftColX, currentY + 40)
         .text('PAYMENT MONTH', leftColX, currentY + 80);

      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica')
         .text(data.receiptNumber, leftColX, currentY + 15)
         .text(new Date(data.paymentDate).toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         }), leftColX, currentY + 55)
         .text(data.month, leftColX, currentY + 95);

      // Right column
      doc.fillColor('#666666')
         .font('Helvetica-Bold')
         .text('PAYMENT METHOD', rightColX, currentY)
         .text('CUSTOMER', rightColX, currentY + 40);

      doc.fillColor('#333333')
         .font('Helvetica')
         .text(data.paymentMethod.toUpperCase(), rightColX, currentY + 15)
         .text(data.customerName, rightColX, currentY + 55, { width: 200 });

      // Divider line
      currentY += 130;
      doc.moveTo(60, currentY)
         .lineTo(doc.page.width - 60, currentY)
         .strokeColor('#E2E8F0')
         .lineWidth(1)
         .stroke();

      // Payment summary section
      currentY += 30;
      doc.fillColor('#2E8B57')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PAYMENT SUMMARY', 60, currentY);

      currentY += 40;

      // Payment details table
      const tableHeaders = ['Description', 'Amount (₦)'];
      const tableData = [
        { description: 'Monthly Fee', amount: data.totalFee.toLocaleString() },
        { description: 'Amount Paid', amount: data.amountPaid.toLocaleString(), highlight: true },
        { description: 'Total Paid This Month', amount: data.totalPaid.toLocaleString() },
        { description: 'Remaining Balance', amount: data.remainingBalance.toLocaleString(), highlight: true }
      ];

      // Table header - using solid color instead of gradient
      doc.roundedRect(60, currentY, doc.page.width - 120, 30, 5)
         .fillColor('#2E8B57')
         .fill();

      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(tableHeaders[0], 80, currentY + 10)
         .text(tableHeaders[1], doc.page.width - 140, currentY + 10, { align: 'right' });

      currentY += 35;

      // Table rows
      tableData.forEach((row, index) => {
        const rowY = currentY + (index * 35);
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(60, rowY, doc.page.width - 120, 35)
             .fillColor('#F8F9FA')
             .fill();
        }

        if (row.highlight) {
          doc.rect(60, rowY, doc.page.width - 120, 35)
             .fillColor('#F0FDF4')
             .fill()
             .strokeColor('#2E8B57')
             .lineWidth(1)
             .stroke();
        }

        doc.fillColor(row.highlight ? '#2E8B57' : '#333333')
           .fontSize(10)
           .font(row.highlight ? 'Helvetica-Bold' : 'Helvetica')
           .text(row.description, 80, rowY + 12)
           .text(row.amount, doc.page.width - 140, rowY + 12, { align: 'right' });
      });

      // Status badge
      const tableBottom = currentY + (tableData.length * 35) + 20;
      const statusText = data.remainingBalance === 0 ? 'FULLY PAID' : 'PARTIALLY PAID';
      const statusColor = data.remainingBalance === 0 ? '#10B981' : '#F59E0B';

      doc.roundedRect(60, tableBottom, 150, 35, 20)
         .fillColor(statusColor)
         .fill();

      doc.fillColor('#FFFFFF')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(statusText, 60, tableBottom + 12, { width: 150, align: 'center' });

      // Add checkmark for fully paid
      if (data.remainingBalance === 0) {
        doc.fillColor('#FFFFFF')
           .fontSize(14)
           .text('✓', 75, tableBottom + 10);
      }

      // Agent notes if available
      if (data.agentNotes) {
        const notesY = tableBottom + 60;
        doc.roundedRect(60, notesY, doc.page.width - 120, 60, 8)
           .fillColor('#FFF9E6')
           .fill()
           .strokeColor('#FFE58F')
           .stroke();

        doc.fillColor('#D4A017')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('AGENT NOTES', 80, notesY + 15);

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Helvetica')
           .text(data.agentNotes, 80, notesY + 35, { width: doc.page.width - 160 });
      }

      // Footer
      const footerY = doc.page.height - 80;
      doc.fillColor('#999999')
         .fontSize(8)
         .font('Helvetica')
         .text('This is a computer-generated receipt and does not require a signature.', 
               60, footerY, { align: 'center', width: doc.page.width - 120 });

      doc.text(`Generated on ${new Date().toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`, 
               60, footerY + 15, { align: 'center', width: doc.page.width - 120 });

      doc.fillColor('#2E8B57')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Thank you for your payment!', 
               60, footerY + 35, { align: 'center', width: doc.page.width - 120 });

      // Page numbers
      doc.fillColor('#666666')
         .fontSize(8)
         .text(`Page 1 of 1`, doc.page.width - 100, doc.page.height - 30);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePaymentReceipt,
};