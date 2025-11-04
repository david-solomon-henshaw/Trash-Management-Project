const nodemailer = require('nodemailer');
require('dotenv').config()

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
 port: 465,  
  secure: true,  // Enable for SSL
  auth: {
 user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});  

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

/**
 * Send payment receipt email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.customerName - Customer name
 * @param {Buffer} options.pdfBuffer - PDF receipt buffer
 * @param {Object} options.paymentDetails - Payment details
 */
const sendPaymentReceipt = async (options) => {
  const { to, customerName, pdfBuffer, paymentDetails } = options;

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Waste Management'}" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Payment Receipt - ${paymentDetails.month}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E8B57; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .total-row { background: #2E8B57; color: white; padding: 15px; margin-top: 20px; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-paid { background: #10B981; color: white; }
          .status-partial { background: #F59E0B; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Thank you for your payment!</p>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>This is to confirm that we have received your payment. Details are as follows:</p>
            
            <div class="detail-row">
              <span class="detail-label">Receipt #:</span>
              <span class="detail-value">${paymentDetails.receiptNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${new Date(paymentDetails.paymentDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Month:</span>
              <span class="detail-value">${paymentDetails.month}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${paymentDetails.paymentMethod.toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Paid:</span>
              <span class="detail-value"><strong>₦${paymentDetails.amountPaid.toLocaleString()}</strong></span>
            </div>
            
            <div class="total-row">
              <div class="detail-row" style="border: none; color: white;">
                <span class="detail-label" style="color: white;">Monthly Fee:</span>
                <span class="detail-value" style="color: white;">₦${paymentDetails.totalFee.toLocaleString()}</span>
              </div>
              <div class="detail-row" style="border: none; color: white;">
                <span class="detail-label" style="color: white;">Total Paid:</span>
                <span class="detail-value" style="color: white;">₦${paymentDetails.totalPaid.toLocaleString()}</span>
              </div>
              <div class="detail-row" style="border: none; color: white;">
                <span class="detail-label" style="color: white;">Remaining Balance:</span>
                <span class="detail-value" style="color: white; font-size: 18px;">
                  <strong>₦${paymentDetails.remainingBalance.toLocaleString()}</strong>
                </span>
              </div>
            </div>
            
            <p style="margin-top: 20px;">
              Status: 
              <span class="status-badge ${paymentDetails.remainingBalance === 0 ? 'status-paid' : 'status-partial'}">
                ${paymentDetails.remainingBalance === 0 ? 'FULLY PAID' : 'PARTIALLY PAID'}
              </span>
            </p>
            
            ${paymentDetails.agentNotes ? `
              <div style="margin-top: 20px; padding: 15px; background: #fff; border-left: 4px solid #2E8B57;">
                <strong>Notes:</strong><br/>
                ${paymentDetails.agentNotes}
              </div>
            ` : ''}
            
            <p style="margin-top: 30px;">A detailed PDF receipt is attached to this email.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Waste Management Services'}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `receipt-${paymentDetails.receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    throw error;
  }
};

module.exports = {
  sendPaymentReceipt,
};