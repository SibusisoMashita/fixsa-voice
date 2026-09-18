<?php

namespace App\Enums;

enum ResolutionState: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Partial = 'partial';
    case Disputed = 'disputed';
}
