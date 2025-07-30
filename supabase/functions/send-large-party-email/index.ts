import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LargePartyEmailRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  partySize: number;
  preferredDate: string;
  preferredTime: string;
  specialRequests?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      partySize, 
      preferredDate, 
      preferredTime,
      specialRequests 
    }: LargePartyEmailRequest = await req.json();

    console.log(`Processing large party request for ${partySize} people from ${customerName}`);

    // Send email to restaurant
    const restaurantEmailResponse = await resend.emails.send({
      from: "BarBizoe Reservations <onboarding@resend.dev>",
      to: ["info@barbizoe.be"],
      subject: `Grote Groep Reservering Aanvraag - ${partySize} personen`,
      html: `
        <h2>Nieuwe Reservering Aanvraag voor Grote Groep</h2>
        <p>Er is een reservering aangevraagd voor meer dan 6 personen:</p>
        
        <h3>Klantgegevens:</h3>
        <ul>
          <li><strong>Naam:</strong> ${customerName}</li>
          <li><strong>Email:</strong> ${customerEmail}</li>
          ${customerPhone ? `<li><strong>Telefoon:</strong> ${customerPhone}</li>` : ''}
          <li><strong>Aantal personen:</strong> ${partySize}</li>
        </ul>
        
        <h3>Gewenste reservering:</h3>
        <ul>
          <li><strong>Datum:</strong> ${preferredDate}</li>
          <li><strong>Tijd:</strong> ${preferredTime}</li>
        </ul>
        
        ${specialRequests ? `
        <h3>Speciale verzoeken:</h3>
        <p>${specialRequests}</p>
        ` : ''}
        
        <p>Neem contact op met de klant om de reservering te bevestigen en eventuele speciale arrangementen te bespreken.</p>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "BarBizoe <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "Uw reservering aanvraag is ontvangen - BarBizoe",
      html: `
        <h2>Bedankt voor uw reservering aanvraag!</h2>
        <p>Beste ${customerName},</p>
        
        <p>We hebben uw aanvraag ontvangen voor een reservering voor <strong>${partySize} personen</strong> op <strong>${preferredDate} om ${preferredTime}</strong>.</p>
        
        <p>Omdat u een reservering wilt maken voor meer dan 6 personen, nemen wij binnen 24 uur contact met u op om uw reservering te bevestigen en eventuele speciale arrangementen te bespreken.</p>
        
        <p>Voor vragen kunt u contact opnemen via:</p>
        <ul>
          <li>Email: info@barbizoe.be</li>
          <li>Telefoon: [TELEFOONNUMMER]</li>
        </ul>
        
        <p>Met vriendelijke groet,<br>
        Het team van BarBizoe</p>
      `,
    });

    console.log("Emails sent successfully:", { restaurantEmailResponse, customerEmailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      restaurantEmailId: restaurantEmailResponse.data?.id,
      customerEmailId: customerEmailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-large-party-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);