<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f1ec; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <div style="max-width:640px; margin:0 auto; padding:32px 20px;">
        <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 12px 40px rgba(15, 23, 42, 0.08);">
            <div style="background:linear-gradient(135deg, #111827 0%, #7c2d12 100%); padding:28px 32px;">
                <p style="margin:0; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#fde68a;">The Wooden Plate</p>
                <h1 style="margin:10px 0 0; font-size:28px; line-height:1.2; color:#ffffff;">We replied to your message</h1>
            </div>

            <div style="padding:32px;">
                <p style="margin:0 0 16px; font-size:16px;">Hi {{ $contactMessage->name }},</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.7;">
                    Thank you for contacting The Wooden Plate. Here is our reply to your message.
                </p>

                <div style="margin-bottom:24px; padding:20px; border-radius:16px; background:#fff7ed; border:1px solid #fdba74;">
                    <p style="margin:0 0 10px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#9a3412;">Your message</p>
                    <p style="margin:0; font-size:15px; line-height:1.7; white-space:pre-line;">{{ $contactMessage->message }}</p>
                </div>

                <div style="padding:20px; border-radius:16px; background:#f9fafb; border:1px solid #e5e7eb;">
                    <p style="margin:0 0 10px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#111827;">Our reply</p>
                    <p style="margin:0; font-size:15px; line-height:1.8; white-space:pre-line;">{{ $replyBody }}</p>
                </div>

                <p style="margin:24px 0 0; font-size:15px; line-height:1.7;">
                    If you need anything else, feel free to reply to this email or contact us again.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
