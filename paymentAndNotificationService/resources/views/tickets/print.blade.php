<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billet - {{ $event['title'] ?? 'Événement' }}</title>
    <style>
        /* Reset et styles de base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }

        /* Conteneur principal du ticket */
        .ticket-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
        }

        /* En-tête du ticket avec dégradé */
        .ticket-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .ticket-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .ticket-header .event-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .ticket-header .event-category {
            font-size: 14px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Corps du ticket */
        .ticket-body {
            display: flex;
            flex-wrap: wrap;
        }

        /* Informations principales */
        .ticket-info {
            flex: 1;
            min-width: 300px;
            padding: 30px;
        }

        .info-group {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px dashed #e0e0e0;
        }

        .info-group:last-child {
            border-bottom: none;
        }

        .info-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .info-value.highlight {
            color: #667eea;
        }

        /* Section QR Code */
        .ticket-qr {
            width: 250px;
            padding: 30px;
            background: #fafafa;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-left: 2px dashed #e0e0e0;
        }

        .qr-code {
            width: 180px;
            height: 180px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .qr-code svg {
            width: 100%;
            height: 100%;
        }

        .qr-label {
            margin-top: 15px;
            font-size: 12px;
            color: #888;
            text-align: center;
        }

        /* Pied du ticket */
        .ticket-footer {
            background: #f8f9fa;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e0e0e0;
        }

        .ticket-id {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #666;
        }

        .ticket-status {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .ticket-status.green {
            background: #d4edda;
            color: #155724;
        }

        .ticket-status.blue {
            background: #cce5ff;
            color: #004085;
        }

        .ticket-status.red {
            background: #f8d7da;
            color: #721c24;
        }

        .ticket-status.gray {
            background: #e2e3e5;
            color: #383d41;
        }

        /* Décoration du ticket (perforation) */
        .ticket-perforation {
            position: absolute;
            right: 248px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 8px,
                #e0e0e0 8px,
                #e0e0e0 16px
            );
        }

        /* Instructions d'impression */
        .print-instructions {
            max-width: 800px;
            margin: 0 auto 20px;
            padding: 20px;
            background: #fff3cd;
            border-radius: 8px;
            text-align: center;
            font-size: 14px;
            color: #856404;
        }

        .print-instructions button {
            margin-top: 10px;
            padding: 10px 30px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }

        .print-instructions button:hover {
            background: #5a6fd6;
        }

        /* Styles pour l'impression */
        @media print {
            body {
                background: white;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .ticket-container {
                box-shadow: none;
                margin: 0;
                border-radius: 0;
            }

            .print-instructions {
                display: none;
            }

            .ticket-header {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

        /* Responsive */
        @media (max-width: 600px) {
            .ticket-body {
                flex-direction: column;
            }

            .ticket-qr {
                width: 100%;
                border-left: none;
                border-top: 2px dashed #e0e0e0;
            }

            .ticket-perforation {
                display: none;
            }

            .ticket-footer {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <!-- Instructions d'impression (masquées à l'impression) -->
    <div class="print-instructions">
        <p>📄 Présentez ce billet (imprimé ou sur mobile) à l'entrée de l'événement.</p>
        <button onclick="window.print()">🖨️ Imprimer le billet</button>
    </div>

    <!-- Ticket -->
    <div class="ticket-container">
        <!-- Perforation décorative -->
        <div class="ticket-perforation"></div>

        <!-- En-tête -->
        <div class="ticket-header">
            <h1>🎟️ Billet d'entrée</h1>
            <div class="event-title">{{ $event['title'] ?? 'Événement' }}</div>
            @if($event['category'] ?? null)
                <div class="event-category">{{ $event['category'] }}</div>
            @endif
        </div>

        <!-- Corps -->
        <div class="ticket-body">
            <!-- Informations -->
            <div class="ticket-info">
                <div class="info-group">
                    <div class="info-label">📅 Date & Heure</div>
                    <div class="info-value">
                        @if($event['date'] ?? null)
                            {{ \Carbon\Carbon::parse($event['date'])->locale('fr')->isoFormat('dddd D MMMM YYYY') }}
                            @if($event['time'] ?? null)
                                à {{ $event['time'] }}
                            @endif
                        @else
                            Date à confirmer
                        @endif
                    </div>
                </div>

                <div class="info-group">
                    <div class="info-label">📍 Lieu</div>
                    <div class="info-value">{{ $event['location'] ?? 'Lieu à confirmer' }}</div>
                </div>

                <div class="info-group">
                    <div class="info-label">👤 Participant</div>
                    <div class="info-value">{{ $user['name'] ?? 'Participant' }}</div>
                    <div style="font-size: 14px; color: #666; margin-top: 5px;">
                        {{ $user['email'] ?? '' }}
                    </div>
                </div>

                <div class="info-group">
                    <div class="info-label">🎫 Type de billet</div>
                    <div class="info-value highlight">{{ $ticket['type'] ?? 'Standard' }}</div>
                </div>

                <div class="info-group">
                    <div class="info-label">💰 Prix</div>
                    <div class="info-value">{{ number_format($ticket['total_price'] ?? 0, 2, ',', ' ') }} MAD</div>
                </div>
            </div>

            <!-- QR Code -->
            <div class="ticket-qr">
                <div class="qr-code">
                    {!! $qrCode !!}
                </div>
                <div class="qr-label">
                    Scannez ce QR code<br>à l'entrée
                </div>
            </div>
        </div>

        <!-- Pied -->
        <div class="ticket-footer">
            <div class="ticket-id">
                <strong>Réf:</strong> {{ strtoupper(substr($ticket['uuid'] ?? '', 0, 8)) }}
            </div>
            <div class="ticket-status {{ $ticket['status_color'] ?? 'green' }}">
                {{ $ticket['status_description'] ?? 'Valide' }}
            </div>
        </div>
    </div>

    <script>
        // Auto-focus pour l'impression
        window.onload = function() {
            // Optionnel: ouvrir automatiquement la boîte de dialogue d'impression
            // window.print();
        };
    </script>
</body>
</html>
