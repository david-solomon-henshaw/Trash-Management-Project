const PDFDocument = require('pdfkit');

/**
 * Generate payment receipt PDF
 * @param {Object} data - Receipt data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePaymentReceipt = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fillColor('#2E8B57')
         .fontSize(28)
         .text(data.companyName || 'WASTE MANAGEMENT SERVICES', { align: 'center' })
         .moveDown(0.5);

      doc.fillColor('#666')
         .fontSize(10)
         .text(data.companyAddress || 'Lagos, Nigeria', { align: 'center' })
         .text(data.companyPhone || 'Phone: +234 XXX XXX XXXX', { align: 'center' })
         .text(data.companyEmail || 'info@wastemanagement.com', { align: 'center' })
         .moveDown(1);

      // Title
      doc.fillColor('#000')
         .fontSize(20)
         .text('PAYMENT RECEIPT', { align: 'center', underline: true })
         .moveDown(1);

      // Receipt details
      const receiptY = doc.y;
      doc.fontSize(10)
         .fillColor('#666')
         .text('Receipt #:', 50, receiptY)
         .fillColor('#000')
         .text(data.receiptNumber, 150, receiptY);

      doc.fillColor('#666')
         .text('Date:', 50, receiptY + 20)
         .fillColor('#000')
         .text(new Date(data.paymentDate).toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         }), 150, receiptY + 20);

      doc.fillColor('#666')
         .text('Payment Month:', 50, receiptY + 40)
         .fillColor('#000')
         .text(data.month, 150, receiptY + 40);

      doc.moveDown(3);

      // Customer details section
      doc.fillColor('#2E8B57')
         .fontSize(14)
         .text('CUSTOMER DETAILS', 50, doc.y, { underline: true })
         .moveDown(0.5);

      const customerY = doc.y;
      doc.fontSize(10)
         .fillColor('#666')
         .text('Name:', 50, customerY)
         .fillColor('#000')
         .text(data.customerName, 150, customerY);

      doc.fillColor('#666')
         .text('Address:', 50, customerY + 20)
         .fillColor('#000')
         .text(data.customerAddress, 150, customerY + 20);

      doc.fillColor('#666')
         .text('Phone:', 50, customerY + 40)
         .fillColor('#000')
         .text(data.customerPhone, 150, customerY + 40);

      if (data.customerEmail) {
        doc.fillColor('#666')
           .text('Email:', 50, customerY + 60)
           .fillColor('#000')
           .text(data.customerEmail, 150, customerY + 60);
        doc.moveDown(4);
      } else {
        doc.moveDown(3);
      }

      // Payment details table
      doc.fillColor('#2E8B57')
         .fontSize(14)
         .text('PAYMENT DETAILS', 50, doc.y, { underline: true })
         .moveDown(1);

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 400;

      // Table header
      doc.rect(col1X, tableTop, 495, 25).fillAndStroke('#2E8B57', '#2E8B57');
      doc.fillColor('#FFF')
         .fontSize(11)
         .text('Description', col1X + 10, tableTop + 8)
         .text('Amount (₦)', col2X, tableTop + 8);

      let currentY = tableTop + 35;

      // Table rows
      const rows = [
        { label: 'Payment Method', value: data.paymentMethod.toUpperCase() },
        { label: 'Monthly Fee', value: data.totalFee.toLocaleString() },
        { label: 'Amount Paid (This Payment)', value: data.amountPaid.toLocaleString(), highlight: true },
        { label: 'Total Paid This Month', value: data.totalPaid.toLocaleString() },
        { label: 'Remaining Balance', value: data.remainingBalance.toLocaleString(), highlight: true },
      ];

      rows.forEach((row, index) => {
        if (row.highlight) {
          doc.rect(col1X, currentY - 5, 495, 25).fillAndStroke('#F0FDF4', '#E2E8F0');
        } else if (index % 2 === 0) {
          doc.rect(col1X, currentY - 5, 495, 25).fillAndStroke('#FAFAFA', '#E2E8F0');
        } else {
          doc.rect(col1X, currentY - 5, 495, 25).stroke('#E2E8F0');
        }

        doc.fillColor('#000')
           .fontSize(10)
           .text(row.label, col1X + 10, currentY);

        doc.text(row.value, col2X, currentY, { align: 'left' });

        currentY += 25;
      });

      // Payment status
      doc.moveDown(2);
      const statusY = doc.y;
      doc.fontSize(12)
         .fillColor('#666')
         .text('Payment Status:', 50, statusY);

      const statusText = data.remainingBalance === 0 ? 'FULLY PAID' : 'PARTIALLY PAID';
      const statusColor = data.remainingBalance === 0 ? '#10B981' : '#F59E0B';

      doc.roundedRect(180, statusY - 5, 120, 25, 5)
         .fillAndStroke(statusColor, statusColor);

      doc.fillColor('#FFF')
         .fontSize(11)
         .text(statusText, 180, statusY, { width: 120, align: 'center' });

      // Agent notes
      if (data.agentNotes) {
        doc.moveDown(2);
        doc.fillColor('#2E8B57')
           .fontSize(12)
           .text('Notes:', 50, doc.y);
        doc.fillColor('#666')
           .fontSize(10)
           .text(data.agentNotes, 50, doc.y + 5, { width: 495, align: 'justify' });
      }

      // Footer
      doc.fontSize(8)
         .fillColor('#999')
         .text(
           `This is a computer-generated receipt and does not require a signature.`,
           50,
           doc.page.height - 100,
           { align: 'center', width: 495 }
         );

      doc.text(
        `Generated on ${new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        50,
        doc.page.height - 80,
        { align: 'center', width: 495 }
      );

      doc.fillColor('#2E8B57')
         .text(
           `Thank you for your payment!`,
           50,
           doc.page.height - 60,
           { align: 'center', width: 495 }
         );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePaymentReceipt,
};