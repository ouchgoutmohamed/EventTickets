<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * Contrôleur API pour la gestion des tickets électroniques.
 * 
 * Ce contrôleur expose les endpoints pour :
 * - Récupérer les tickets d'un utilisateur
 * - Afficher le détail d'un ticket
 * - Générer une vue imprimable avec QR code
 * - Valider un ticket (scan QR)
 */
class TicketController extends Controller
{
    public function __construct(
        protected TicketService $ticketService
    ) {
    }

    /**
     * Récupère tous les tickets de l'utilisateur connecté.
     * 
     * GET /api/tickets/me
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function myTickets(Request $request): JsonResponse
    {
        // Récupérer l'ID utilisateur depuis le header (passé par l'API Gateway)
        $userId = $request->header('X-User-Id') ?? $request->query('user_id');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié',
            ], 401);
        }

        $tickets = $this->ticketService->getUserTickets((int) $userId);

        return response()->json([
            'success' => true,
            'data' => TicketResource::collection($tickets),
            'count' => $tickets->count(),
        ]);
    }

    /**
     * Récupère le détail d'un ticket par son UUID.
     * 
     * GET /api/tickets/{ticket_uuid}
     * 
     * @param Request $request
     * @param string $ticketUuid
     * @return JsonResponse
     */
    public function show(Request $request, string $ticketUuid): JsonResponse
    {
        $userId = $request->header('X-User-Id') ?? $request->query('user_id');
        
        $ticket = $this->ticketService->getTicketByUuid($ticketUuid);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket non trouvé',
            ], 404);
        }

        // Vérifier que l'utilisateur est bien le propriétaire du ticket
        if ($userId && (int) $userId !== $ticket->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à ce ticket',
            ], 403);
        }

        // Récupérer les détails complets avec infos événement et utilisateur
        $fullDetails = $this->ticketService->getTicketFullDetails($ticket);

        return response()->json([
            'success' => true,
            'data' => $fullDetails,
        ]);
    }

    /**
     * Génère une vue HTML imprimable du ticket avec QR code.
     * 
     * GET /api/tickets/{ticket_uuid}/print
     * 
     * Cette route peut être appelée sans authentification stricte car
     * le ticket_uuid est suffisamment unique et sécurisé.
     * 
     * @param string $ticketUuid
     * @return \Illuminate\View\View|JsonResponse
     */
    public function print(string $ticketUuid)
    {
        $ticket = $this->ticketService->getTicketByUuid($ticketUuid);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket non trouvé',
            ], 404);
        }

        // Récupérer les détails complets
        $fullDetails = $this->ticketService->getTicketFullDetails($ticket);

        // Générer le QR code en SVG
        $qrCode = $this->generateQrCodeSvg($ticket->qr_payload);

        // Retourner la vue Blade pour impression
        return view('tickets.print', [
            'ticket' => $fullDetails['ticket'],
            'event' => $fullDetails['event'],
            'user' => $fullDetails['user'],
            'payment' => $fullDetails['payment'],
            'qrCode' => $qrCode,
        ]);
    }

    /**
     * Génère une version PDF du ticket (optionnel).
     * 
     * GET /api/tickets/{ticket_uuid}/pdf
     * 
     * @param string $ticketUuid
     * @return \Illuminate\Http\Response|JsonResponse
     */
    public function downloadPdf(string $ticketUuid)
    {
        $ticket = $this->ticketService->getTicketByUuid($ticketUuid);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket non trouvé',
            ], 404);
        }

        // Récupérer les détails complets
        $fullDetails = $this->ticketService->getTicketFullDetails($ticket);

        // Générer le QR code en SVG
        $qrCode = $this->generateQrCodeSvg($ticket->qr_payload);

        // Générer le PDF avec DomPDF (si disponible)
        if (class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('tickets.print', [
                'ticket' => $fullDetails['ticket'],
                'event' => $fullDetails['event'],
                'user' => $fullDetails['user'],
                'payment' => $fullDetails['payment'],
                'qrCode' => $qrCode,
            ]);

            $filename = "ticket-{$ticketUuid}.pdf";
            return $pdf->download($filename);
        }

        // Fallback: retourner le HTML si DomPDF n'est pas installé
        return $this->print($ticketUuid);
    }

    /**
     * Valide un ticket via scan du QR code.
     * 
     * POST /api/tickets/validate
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validateTicket(Request $request): JsonResponse
    {
        $request->validate([
            'qr_payload' => 'required|string',
        ]);

        $result = $this->ticketService->validateAndUseTicket($request->input('qr_payload'));

        $statusCode = $result['success'] ? 200 : 400;

        return response()->json($result, $statusCode);
    }

    /**
     * Génère un QR code SVG à partir du payload.
     * 
     * @param string $payload
     * @return string SVG du QR code
     */
    protected function generateQrCodeSvg(string $payload): string
    {
        // Utiliser simplesoftwareio/simple-qrcode si disponible
        if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
            return QrCode::size(200)
                ->format('svg')
                ->errorCorrection('H')
                ->generate($payload);
        }

        // Fallback: générer un SVG simple avec un placeholder
        // En production, on utilisera une vraie lib de QR code
        return $this->generateFallbackQrSvg($payload);
    }

    /**
     * Génère un SVG de fallback si la lib QR code n'est pas disponible.
     * 
     * @param string $payload
     * @return string
     */
    protected function generateFallbackQrSvg(string $payload): string
    {
        // Générer un pattern simple basé sur le hash du payload
        $hash = md5($payload);
        $size = 200;
        $cellSize = 10;
        $cells = $size / $cellSize;
        
        $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='{$size}' height='{$size}' viewBox='0 0 {$size} {$size}'>";
        $svg .= "<rect width='{$size}' height='{$size}' fill='white'/>";
        
        // Générer un pattern basé sur le hash
        for ($i = 0; $i < strlen($hash); $i++) {
            $charCode = ord($hash[$i]);
            $x = ($i % (int)$cells) * $cellSize;
            $y = (int)($i / $cells) * $cellSize;
            
            if ($charCode % 2 == 0) {
                $svg .= "<rect x='{$x}' y='{$y}' width='{$cellSize}' height='{$cellSize}' fill='black'/>";
            }
        }
        
        $svg .= "</svg>";
        
        return $svg;
    }
}
