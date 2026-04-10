/*
  SETUP REQUIRED:
  1. Go to your HubSpot account → Settings → Integrations → Private Apps
  2. Create a Private App with scopes: crm.objects.contacts.write, crm.objects.contacts.read
  3. Copy the Access Token
  4. In Vercel dashboard → Project Settings → Environment Variables
     Add: HUBSPOT_API_KEY = <your token>
  5. Redeploy the project
*/

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    console.error('HUBSPOT_API_KEY environment variable is not set');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const { name, email, phone, company, message, inquiryType } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    // Split name into first and last
    const nameParts = name.trim().split(/\s+/);
    const firstname = nameParts[0];
    const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create or update contact in HubSpot
    const contactProperties = {
      email,
      firstname,
      lastname,
    };
    if (phone) contactProperties.phone = phone;
    if (company) contactProperties.company = company;
    if (inquiryType) contactProperties.inquiry_type = inquiryType;

    let contactId;

    // Try to create the contact first
    const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: contactProperties }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      contactId = created.id;
    } else if (createRes.status === 409) {
      // Contact already exists — extract existing ID and update
      const conflict = await createRes.json();
      contactId = conflict.message?.match(/Existing ID:\s*(\d+)/)?.[1];

      if (contactId) {
        await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: contactProperties }),
        });
      }
    } else {
      const errBody = await createRes.text();
      console.error('HubSpot contact create failed:', createRes.status, errBody);
      return res.status(500).json({ success: false, error: 'Failed to create contact' });
    }

    // Create a Note with the full message if we have a contactId and message
    if (contactId && message) {
      const noteRes = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            hs_timestamp: new Date().toISOString(),
            hs_note_body: message,
          },
          associations: [
            {
              to: { id: contactId },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId: 202,
                },
              ],
            },
          ],
        }),
      });

      if (!noteRes.ok) {
        console.warn('HubSpot note creation failed:', noteRes.status, await noteRes.text());
        // Don't fail the whole request — contact was still created
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
