import { Mail, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AICreditLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxActions: number;
}

export function AICreditLimitDialog({ open, onOpenChange, maxActions }: AICreditLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            AI Credit Limit Reached
          </DialogTitle>
          <DialogDescription>
            You have used all {maxActions} AI actions for your account. To continue generating AI feedback or interview
            questions, contact the Kraftworks admin team.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Admin Contact</p>
          <a
            href="mailto:info@kraftworks.com"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            info@kraftworks.com
          </a>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
