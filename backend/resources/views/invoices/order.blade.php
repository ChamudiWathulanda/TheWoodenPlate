<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $order->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #8B4513;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #8B4513;
            margin: 0;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-info div {
            width: 48%;
        }
        .invoice-info h3 {
            color: #8B4513;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .invoice-info p {
            margin: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        table thead {
            background-color: #8B4513;
            color: white;
        }
        table th, table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        table th {
            font-weight: bold;
        }
        table tbody tr:hover {
            background-color: #f5f5f5;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            float: right;
            width: 300px;
        }
        .totals table {
            margin-bottom: 0;
        }
        .totals table td {
            padding: 8px;
        }
        .totals .total-row {
            font-size: 1.2em;
            font-weight: bold;
            background-color: #f0f0f0;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-preparing { background-color: #d1ecf1; color: #0c5460; }
        .status-ready { background-color: #cce5ff; color: #004085; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            clear: both;
        }
        .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #8B4513;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>The Wooden Plate</h1>
        <p>Fine Dining Experience</p>
        <p>123 Main Street, City, Country | Phone: (123) 456-7890</p>
    </div>

    <div class="invoice-info">
        <div>
            <h3>Invoice To:</h3>
            <p><strong>{{ $order->customer->name }}</strong></p>
            <p>{{ $order->customer->email }}</p>
            <p>{{ $order->customer->phone }}</p>
            @if($order->customer->address)
                <p>{{ $order->customer->address }}</p>
            @endif
        </div>
        <div>
            <h3>Invoice Details:</h3>
            <p><strong>Invoice #:</strong> {{ str_pad($order->id, 6, '0', STR_PAD_LEFT) }}</p>
            <p><strong>Date:</strong> {{ $order->created_at->format('F d, Y') }}</p>
            <p><strong>Time:</strong> {{ $order->created_at->format('h:i A') }}</p>
            <p><strong>Status:</strong>
                <span class="status-badge status-{{ $order->status }}">
                    {{ ucfirst($order->status) }}
                </span>
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th class="text-right">Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product->name }}</td>
                <td>{{ $item->product->description ?? '-' }}</td>
                <td class="text-right">Rs. {{ number_format($item->price, 2) }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">Rs. {{ number_format($item->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td class="text-right">Rs. {{ number_format($order->total_amount, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Total:</td>
                <td class="text-right">Rs. {{ number_format($order->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($order->notes)
    <div class="notes">
        <strong>Notes:</strong><br>
        {{ $order->notes }}
    </div>
    @endif

    <div class="footer">
        <p>Thank you for your order!</p>
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>&copy; {{ date('Y') }} The Wooden Plate. All rights reserved.</p>
    </div>
</body>
</html>
