<?php

namespace App\Enums;

enum ReportStatus: string
{
    case Reported = 'reported';
    case Triaged = 'triaged';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';
}
