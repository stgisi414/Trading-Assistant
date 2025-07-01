import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, subject, message, userId } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Compose email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'stefdgisi@gmail.com', // Your email
      subject: `[Signatex Contact] ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
User ID: ${userId || 'Anonymous'}

Message:
${message}

---
Sent via Signatex Contact Form
Time: ${new Date().toISOString()}
      `,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>User ID:</strong> ${userId || 'Anonymous'}</p>
        
        <h4>Message:</h4>
        <p>${message.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p><small>Sent via Signatex Contact Form at ${new Date().toISOString()}</small></p>
      `,
      replyTo: email
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email. Please try again later.' 
    });
  }
});

// Image Proxy Route
app.get('/api/image-proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'stream',
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).send('Failed to fetch image');
  }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Email service running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/api/health`);
});
