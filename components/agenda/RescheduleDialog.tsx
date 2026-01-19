import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
interface RescheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment?: any;
}

export default function RescheduleDialog({ open, onOpenChange, appointment }: RescheduleDialogProps) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>RescheduleDialog</DialogContent></Dialog>; }
