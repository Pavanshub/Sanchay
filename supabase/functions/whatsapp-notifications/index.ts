import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  to: string;
  type: 'order_confirmation' | 'order_update' | 'reminder';
  data: {
    vendor_name: string;
    order_id: string;
    total_amount: number;
    delivery_date?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const message: WhatsAppMessage = await req.json();
    
    // Note: In production, you would use actual Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      // For demo purposes, we'll just log the message
      console.log('WhatsApp message would be sent:', message);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Demo mode: Message logged instead of sent',
        demo_message: generateMessageContent(message)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate message content based on type
    const messageContent = generateMessageContent(message);

    // Send WhatsApp message via Twilio (commented out for demo)
    /*
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${twilioWhatsAppNumber}`,
          To: `whatsapp:${message.to}`,
          Body: messageContent,
        }),
      }
    );

    if (!twilioResponse.ok) {
      throw new Error(`Twilio API error: ${twilioResponse.statusText}`);
    }

    const result = await twilioResponse.json();
    */

    return new Response(JSON.stringify({ 
      success: true,
      message_sid: 'demo_sid_' + Date.now(),
      content: messageContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('WhatsApp notification error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMessageContent(message: WhatsAppMessage): string {
  const { type, data } = message;
  
  switch (type) {
    case 'order_confirmation':
      return `🎉 *संचय Group Order Confirmed!*

नमस्ते ${data.vendor_name}!

Your group order #${data.order_id} has been confirmed.
💰 Total Amount: ₹${data.total_amount}
📅 Delivery: ${data.delivery_date || 'TBD'}

${data.items ? data.items.map(item => 
  `• ${item.name}: ${item.quantity} units - ₹${item.price}`
).join('\n') : ''}

Thanks for saving together! 🤝

- Team Sanchay`;

    case 'order_update':
      return `📦 *Order Update - Sanchay*

Hi ${data.vendor_name}!

Your order #${data.order_id} status has been updated.
Delivery scheduled for: ${data.delivery_date}

Track your order: sanchay.app/orders/${data.order_id}

- Team Sanchay`;

    case 'reminder':
      return `⏰ *Reorder Reminder - Sanchay*

Hi ${data.vendor_name}!

It's time to reorder your regular items.
Last order: ₹${data.total_amount}

Start new group order: sanchay.app/orders/new

Save more together! 💚

- Team Sanchay`;

    default:
      return `Hi ${data.vendor_name}, you have a new notification from Sanchay!`;
  }
}