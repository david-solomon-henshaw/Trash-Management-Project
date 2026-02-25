
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
    // console.log('Email server is ready to send messages');
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
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .email-header {
            background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .email-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
          }
          .email-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          .email-header p {
            font-size: 1.1em;
            opacity: 0.9;
          }
          .email-content {
            padding: 40px;
          }
          .greeting {
            font-size: 1.2em;
            margin-bottom: 30px;
            color: #555;
          }
          .receipt-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            border-left: 5px solid #2E8B57;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          .detail-item {
            display: flex;
            flex-direction: column;
          }
          .detail-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
            font-weight: 500;
          }
          .detail-value {
            font-size: 1.1em;
            color: #333;
            font-weight: 600;
          }
          .amount-highlight {
            font-size: 1.3em;
            color: #2E8B57;
            font-weight: 700;
          }
          .summary-section {
            background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 30px 0;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
          }
          .summary-item:last-child {
            border-bottom: none;
            font-size: 1.2em;
            font-weight: 700;
          }
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 0.9em;
            font-weight: 600;
            margin-top: 10px;
          }
          .status-paid { 
            background: #10B981; 
            color: white;
          }
          .status-partial { 
            background: #F59E0B; 
            color: white;
          }
          .notes-section {
            background: #FFF9E6;
            border: 1px solid #FFE58F;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
          }
          .notes-section strong {
            color: #D4A017;
            display: block;
            margin-bottom: 10px;
          }
          .attachment-notice {
            text-align: center;
            padding: 20px;
            background: #E8F5E8;
            border-radius: 10px;
            margin: 25px 0;
            color: #2E8B57;
          }
          .email-footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e9ecef;
          }
          .company-logo {
            font-size: 1.5em;
            font-weight: bold;
            color: #2E8B57;
            margin-bottom: 10px;
          }
          @media (max-width: 600px) {
            .detail-grid {
              grid-template-columns: 1fr;
            }
            .email-content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Payment Confirmed</h1>
            <p>Thank you for your payment!</p>
          </div>
          
          <div class="email-content">
            <div class="greeting">
              Dear <strong>${customerName}</strong>,
            </div>
            
            <p>We've successfully processed your payment. Here's your receipt summary:</p>
            
            <div class="receipt-card">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Receipt Number</span>
                  <span class="detail-value">${paymentDetails.receiptNumber}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Payment Date</span>
                  <span class="detail-value">${new Date(paymentDetails.paymentDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Payment Month</span>
                  <span class="detail-value">${paymentDetails.month}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Payment Method</span>
                  <span class="detail-value">${paymentDetails.paymentMethod.toUpperCase()}</span>
                </div>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Amount Paid</span>
                <span class="detail-value amount-highlight">₦${paymentDetails.amountPaid.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="summary-section">
              <div class="summary-item">
                <span>Monthly Fee:</span>
                <span>₦${paymentDetails.totalFee.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span>Total Paid This Month:</span>
                <span>₦${paymentDetails.totalPaid.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span>Remaining Balance:</span>
                <span>₦${paymentDetails.remainingBalance.toLocaleString()}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <span class="status-badge ${paymentDetails.remainingBalance === 0 ? 'status-paid' : 'status-partial'}">
                ${paymentDetails.remainingBalance === 0 ? '✓ FULLY PAID' : '↻ PARTIALLY PAID'}
              </span>
            </div>
            
            ${paymentDetails.agentNotes ? `
              <div class="notes-section">
                <strong>📝 Agent Notes:</strong>
                ${paymentDetails.agentNotes}
              </div>
            ` : ''}
            
            <div class="attachment-notice">
              <p>📎 A detailed PDF receipt is attached to this email for your records.</p>
            </div>
            
            <p>If you have any questions about this payment, please contact our support team.</p>
          </div>
          
          <div class="email-footer">
            <div class="company-logo">
              ${process.env.COMPANY_NAME || 'WASTE MANAGEMENT SERVICES'}
            </div>
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
    // console.log('Receipt email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    throw error;
  }
};

module.exports = {
  sendPaymentReceipt,
};