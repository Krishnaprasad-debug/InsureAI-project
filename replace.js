const fs = require('fs');
let content = fs.readFileSync('src/pages/ClaimFormPage.tsx', 'utf8');

const regex = /\/\/ Insert notification[\s\S]*?type: 'success',\s*\}\);/;
const newText = // Insert notifications
      await supabase.from('notifications').insert([
        {
          user_id: profile.id,
          claim_id: claim.id,
          title: 'Claim Submitted',
          message: \Your claim \ has been submitted successfully.\,
          type: 'info',
        },
        {
          user_id: profile.id,
          claim_id: claim.id,
          title: 'AI Prediction Available',
          message: \AI prediction is available for your claim \. Prediction: \. Risk: \.\,
          type: 'success',
        },
        {
          user_id: profile.id,
          claim_id: claim.id,
          target_role: 'company',
          title: 'New Claim Received',
          message: \Customer: \\\nClaim ID: \\\nAI Prediction: \\\nRisk: \\,
          type: 'info',
        }
      ]);;
content = content.replace(regex, newText);
fs.writeFileSync('src/pages/ClaimFormPage.tsx', content);
