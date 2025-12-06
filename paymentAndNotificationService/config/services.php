<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */
    
    /*
    |--------------------------------------------------------------------------
    | Microservices URLs
    |--------------------------------------------------------------------------
    */
    'rabbitmq' => [
        'url' => env('RABBITMQ_SERVICE_URL', 'localhost'),
    ],

    'event_catalog' => [
        'url' => env('EVENT_CATALOG_SERVICE_URL', 'http://event-catalog:8080'),
    ],

    'user_service' => [
        'url' => env('USER_SERVICE_URL', 'http://user-service:3001'),
    ],

    'ticket_inventory' => [
        'url' => env('TICKET_INVENTORY_SERVICE_URL', 'http://ticket-inventory:8083'),
    ],

    /*
    |--------------------------------------------------------------------------
    | External Services
    |--------------------------------------------------------------------------
    */
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
