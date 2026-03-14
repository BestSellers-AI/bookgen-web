'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EmailPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (email: string) => void
  loading?: boolean
}

export default function EmailPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: EmailPromptDialogProps) {
  const t = useTranslations('landingV2.pricing')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onSubmit(email.trim())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('emailPromptTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Button type="submit" disabled={loading || !email.trim()}>
            {loading ? (
              <svg className="w-5 h-5 animate-spin mx-auto" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              t('emailPromptSubmit')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
