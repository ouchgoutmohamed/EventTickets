<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'payment_id',
        'type',
        'message',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
