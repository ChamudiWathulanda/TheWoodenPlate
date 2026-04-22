<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $campaign->subject }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5efe8; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <div style="max-width:640px; margin:0 auto; padding:32px 20px;">
        <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 12px 40px rgba(15, 23, 42, 0.08);">
            <div style="background:linear-gradient(135deg, #111827 0%, #92400e 100%); padding:28px 32px;">
                <p style="margin:0; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#fde68a;">The Wooden Plate</p>
                <h1 style="margin:10px 0 0; font-size:28px; line-height:1.2; color:#ffffff;">
                    {{ $campaign->heading ?: $campaign->subject }}
                </h1>
            </div>

            <div style="padding:32px;">
                <div style="font-size:15px; line-height:1.8; color:#374151; white-space:pre-line;">{{ $campaign->body }}</div>

                @if($campaign->cta_label && $campaign->cta_url)
                    <div style="margin-top:28px;">
                        <a
                            href="{{ $campaign->cta_url }}"
                            style="display:inline-block; border-radius:999px; background:#c2410c; color:#ffffff; text-decoration:none; padding:14px 22px; font-weight:700;"
                        >
                            {{ $campaign->cta_label }}
                        </a>
                    </div>
                @endif

                <p style="margin:28px 0 0; font-size:14px; line-height:1.7; color:#6b7280;">
                    Thank you for staying connected with The Wooden Plate.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
