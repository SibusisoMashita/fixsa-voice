<?php

namespace App\Enums;

enum ResolutionOutcome: string
{
    case Fixed = 'fixed';
    case PartiallyFixed = 'partially_fixed';
    case NotFixed = 'not_fixed';
}
