<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $heading }}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F0A08;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F0A08; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A110D; border-radius: 16px; overflow: hidden; border: 1px solid #8B5A2B;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #C98A5A 0%, #8B5A2B 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #0F0A08; font-size: 28px; font-weight: bold;">The Wooden Plate</h1>
                            <p style="margin: 8px 0 0 0; color: #1A110D; font-size: 14px;">Order Update</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 30px 20px 30px; text-align: center;">
                            <h2 style="color: {{ $accentColor }}; font-size: 24px; margin: 0 0 18px 0;">{{ $heading }}</h2>
                            <p style="color: #E7D2B6; font-size: 16px; line-height: 1.6; margin: 0 0 12px 0;">
                                Dear {{ $customerName }},
                            </p>
                            <p style="color: #BFA58A; font-size: 15px; line-height: 1.6; margin: 0;">
                                {{ $introText }}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 30px 24px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F0A08; border-radius: 12px; border: 1px solid #8B5A2B;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="color: #C98A5A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">Order Details</h3>

                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; color: #BFA58A; font-size: 14px;">Order Number</td>
                                                <td style="padding: 8px 0; color: #E7D2B6; font-size: 14px; text-align: right; font-weight: 600;">{{ $order->order_number ?: ('#' . $order->id) }}</td>
                                            </tr>
                                            <tr><td colspan="2" style="border-bottom: 1px solid #8B5A2B40;"></td></tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #BFA58A; font-size: 14px;">Order Type</td>
                                                <td style="padding: 8px 0; color: #E7D2B6; font-size: 14px; text-align: right; font-weight: 600;">{{ ucfirst($order->order_type ?? 'N/A') }}</td>
                                            </tr>
                                            <tr><td colspan="2" style="border-bottom: 1px solid #8B5A2B40;"></td></tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #BFA58A; font-size: 14px;">Status</td>
                                                <td style="padding: 8px 0; color: {{ $accentColor }}; font-size: 14px; text-align: right; font-weight: 700;">{{ $statusLabel }}</td>
                                            </tr>
                                            <tr><td colspan="2" style="border-bottom: 1px solid #8B5A2B40;"></td></tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #BFA58A; font-size: 14px;">Payment Method</td>
                                                <td style="padding: 8px 0; color: #E7D2B6; font-size: 14px; text-align: right; font-weight: 600;">{{ ucfirst($order->payment_method ?? 'N/A') }}</td>
                                            </tr>
                                            <tr><td colspan="2" style="border-bottom: 1px solid #8B5A2B40;"></td></tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #BFA58A; font-size: 14px;">Total</td>
                                                <td style="padding: 8px 0; color: #E7D2B6; font-size: 16px; text-align: right; font-weight: 700;">LKR {{ number_format((float) ($order->total ?? $order->total_amount ?? 0), 2) }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    @if (!empty($estimatedTimeLabel) || !empty($highlightTitle))
                        <tr>
                            <td style="padding: 0 30px 24px 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.08); border-radius: 12px; border: 1px solid rgba(201, 138, 90, 0.25);">
                                    <tr>
                                        <td style="padding: 20px;">
                                            @if (!empty($estimatedTimeLabel))
                                                <p style="color: #C98A5A; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">{{ $estimatedTimeLabel }}</p>
                                                <p style="color: #E7D2B6; font-size: 18px; font-weight: 700; margin: 0 0 14px 0;">{{ $estimatedTimeValue }}</p>
                                            @endif
                                            @if (!empty($highlightTitle))
                                                <p style="color: #C98A5A; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">{{ $highlightTitle }}</p>
                                                <p style="color: #BFA58A; font-size: 14px; line-height: 1.6; margin: 0;">{{ $highlightBody }}</p>
                                            @endif
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif

                    <tr>
                        <td style="padding: 0 30px 24px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(201, 138, 90, 0.08); border-radius: 12px; border: 1px solid rgba(201, 138, 90, 0.25);">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="color: #C98A5A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">Items Ordered</h3>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            @foreach ($items as $item)
                                                <tr>
                                                    <td style="padding: 8px 0; color: #E7D2B6; font-size: 14px;">{{ $item['name'] }} x {{ $item['quantity'] }}</td>
                                                    <td style="padding: 8px 0; color: #BFA58A; font-size: 14px; text-align: right;">LKR {{ number_format((float) $item['subtotal'], 2) }}</td>
                                                </tr>
                                            @endforeach
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    @if ($order->delivery_address || $order->special_instructions)
                        <tr>
                            <td style="padding: 0 30px 24px 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(139, 90, 43, 0.25);">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="color: #C98A5A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">Additional Information</h3>
                                            @if ($order->delivery_address)
                                                <p style="color: #BFA58A; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;"><strong style="color: #E7D2B6;">Delivery Address:</strong> {{ $order->delivery_address }}</p>
                                            @endif
                                            @if ($order->special_instructions)
                                                <p style="color: #BFA58A; font-size: 14px; line-height: 1.6; margin: 0;"><strong style="color: #E7D2B6;">Special Instructions:</strong> {{ $order->special_instructions }}</p>
                                            @endif
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif

                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <p style="color: #BFA58A; font-size: 14px; line-height: 1.7; margin: 0;">
                                {{ $closingText }}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #0F0A08; padding: 25px 30px; text-align: center; border-top: 1px solid #8B5A2B40;">
                            <p style="color: #BFA58A; font-size: 13px; margin: 0 0 10px 0;">
                                Questions? Contact us at <a href="mailto:info@thewoodenplate.com" style="color: #C98A5A; text-decoration: none;">info@thewoodenplate.com</a>
                            </p>
                            <p style="color: #BFA58A60; font-size: 12px; margin: 0;">
                                &copy; {{ date('Y') }} The Wooden Plate. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
