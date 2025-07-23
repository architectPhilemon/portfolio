    // server.js

    const express = require('express');
    const cors = require('cors');
    const nodemailer = require('nodemailer');
    const { google } = require('googleapis'); // Import googleapis for OAuth2
    require('dotenv').config();

    const app = express();
    const PORT = process.env.PORT || 5000;

    app.use(cors());
    app.use(express.json());

    // --- OAuth2 Configuration for Nodemailer ---
    const OAuth2 = google.auth.OAuth2;

    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,        // Your Client ID from .env
      process.env.CLIENT_SECRET,    // Your Client Secret from .env
      "https://developers.google.com/oauthplayground" // Redirect URL
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN // Your Refresh Token from .env
    });

    // Function to create the Nodemailer transporter with dynamic access token
    const createTransporter = async () => {
      try {
        const accessToken = await oauth2Client.getAccessToken(); // Get a fresh access token
        console.log('Access Token obtained:', accessToken.token ? 'Success' : 'Failed');

        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER, // Your Gmail address
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken.token // Use the dynamically obtained access token
          }
        });
      } catch (error) {
        console.error('Error creating OAuth2 transporter:', error);
        throw new Error('Failed to create email transporter with OAuth2.');
      }
    };
    // --- End OAuth2 Configuration ---


    // Contact form submission endpoint
    app.post('/api/contact', async (req, res) => {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }

      try {
        const transporter = await createTransporter(); // Get the transporter

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Send to your own email
          subject: `New Contact Form Submission from ${name} - Portfolio`,
          html: `
            <p>You have a new contact form submission from your portfolio:</p>
            <h3>Contact Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
            </ul>
            <h3>Message:</h3>
            <p>${message}</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        res.status(200).json({ msg: 'Message sent successfully!' });
      } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ msg: 'Failed to send message. Please try again later.' });
      }
    });

    // Simple root route for testing if the server is running
    app.get('/', (req, res) => {
      res.send('Portfolio backend is running!');
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Access it at http://localhost:${PORT}`);
    });
    