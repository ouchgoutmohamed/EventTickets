<?php

namespace App;

enum PaymentMethod: string
{
    case CREDIT_CARD = "Credit Card";
    case PAYPAL = "Paypal";
    case STRIPE = "Stripe";
}
