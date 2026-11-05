"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ModalDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" />}>
        Open modal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to your queue?</DialogTitle>
          <DialogDescription>
            Saved to Ravelry only after Ravelry confirms the change.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button>Add to queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
