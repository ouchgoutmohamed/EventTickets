<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING = "Pending";
    case SUCCESS = "Success";
    case FAILED = "Failed";
    case REFUNDED = "Refunded";
}
