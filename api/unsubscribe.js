const prisma = require('./lib/prisma');

module.exports = async (req, res) => {
  // Set headers for HTML response
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    try {
      const { email, token } = req.query;

      // Validate parameters
      if (!email || !token) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html lang="nl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Uitschrijven - SDeal</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 500px;
                text-align: center;
              }
              h1 { color: #333; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Uitschrijven</h1>
              <p class="error">Ongeldige link. De uitschrijflink is niet compleet.</p>
              <p>Als je problemen hebt met uitschrijven, neem dan contact op met <a href="mailto:info@sdeal.com">info@sdeal.com</a>.</p>
            </div>
          </body>
          </html>
        `);
      }

      // Find consumer by email and token (token is consumer.id)
      const consumer = await prisma.consumer.findFirst({
        where: {
          email: decodeURIComponent(email),
          id: token
        }
      });

      if (!consumer) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="nl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Uitschrijven - SDeal</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 500px;
                text-align: center;
              }
              h1 { color: #333; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Uitschrijven</h1>
              <p class="error">Ongeldige link. We kunnen je email adres niet vinden.</p>
              <p>Als je problemen hebt met uitschrijven, neem dan contact op met <a href="mailto:info@sdeal.com">info@sdeal.com</a>.</p>
            </div>
          </body>
          </html>
        `);
      }

      // Check if already unsubscribed
      if (consumer.isUnsubscribed) {
        return res.send(`
          <!DOCTYPE html>
          <html lang="nl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Uitschrijven - SDeal</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 500px;
                text-align: center;
              }
              h1 { color: #333; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              .success { color: #2e7d32; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Uitschrijven</h1>
              <p class="success">Je bent al uitgeschreven voor onze emails.</p>
              <p>Je ontvangt geen marketing emails meer van SDeal.</p>
              <p>Als je je weer wilt aanmelden, neem dan contact op met <a href="mailto:info@sdeal.com">info@sdeal.com</a>.</p>
            </div>
          </body>
          </html>
        `);
      }

      // Unsubscribe the consumer
      await prisma.consumer.update({
        where: { id: consumer.id },
        data: {
          isUnsubscribed: true,
          unsubscribedAt: new Date()
        }
      });

      // Also unsubscribe from all mailing lists
      await prisma.emailListMember.updateMany({
        where: {
          consumerId: consumer.id,
          status: 'subscribed'
        },
        data: {
          status: 'unsubscribed',
          unsubscribedAt: new Date()
        }
      });

      // Record unsubscribe event for all campaigns
      const campaigns = await prisma.emailCampaign.findMany({
        where: {
          status: { in: ['sending', 'sent'] }
        }
      });

      for (const campaign of campaigns) {
        try {
          await prisma.emailEvent.create({
            data: {
              campaignId: campaign.id,
              consumerId: consumer.id,
              eventType: 'unsubscribed',
              occurredAt: new Date()
            }
          });
        } catch (error) {
          // Ignore duplicate events
          console.error(`[Unsubscribe] Error creating event for campaign ${campaign.id}:`, error);
        }
      }

      // Success page
      return res.send(`
        <!DOCTYPE html>
        <html lang="nl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Uitgeschreven - SDeal</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #333; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
            .success { color: #2e7d32; font-size: 48px; margin-bottom: 20px; }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background-color: #2196F3;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 600;
            }
            .button:hover {
              background-color: #1976D2;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓</div>
            <h1>Je bent uitgeschreven</h1>
            <p>Je email adres <strong>${decodeURIComponent(email)}</strong> is succesvol uitgeschreven voor onze marketing emails.</p>
            <p>Je ontvangt geen marketing emails meer van SDeal.</p>
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              Als je je weer wilt aanmelden of vragen hebt, neem dan contact op met<br>
              <a href="mailto:info@sdeal.com" style="color: #2196F3;">info@sdeal.com</a>
            </p>
            <a href="https://www.sdeal.com" class="button">Terug naar SDeal</a>
          </div>
        </body>
        </html>
      `);

    } catch (error) {
      console.error('[Unsubscribe] Error:', error);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="nl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fout - SDeal</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #333; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Fout</h1>
            <p class="error">Er is een fout opgetreden bij het uitschrijven.</p>
            <p>Probeer het later opnieuw of neem contact op met <a href="mailto:info@sdeal.com">info@sdeal.com</a>.</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  // Method not allowed
  return res.status(405).send('Method not allowed');
};

